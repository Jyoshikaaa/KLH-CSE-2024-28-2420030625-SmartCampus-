import os
import re
import csv
import shutil
import urllib.parse
import openpyxl
import requests
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configurable Paths
EXCEL_PATH = r"C:\Users\Krishna\Desktop\FacultyLens\Y24 Option Form-Updated 30062026.xlsx"
FACULTY_MASTER_DIR = r"C:\Users\Krishna\Desktop\Faculty"
BACKEND_UPLOADS_DIR = r"C:\Users\Krishna\Desktop\FacultyLens\backend\uploads\faculty"
REPORT_PATH = r"C:\Users\Krishna\Desktop\FacultyLens\data\faculty_match_report.csv"
WEBSITE_URL = "https://klh.edu.in/bhp-faculty/"

os.makedirs(FACULTY_MASTER_DIR, exist_ok=True)
os.makedirs(BACKEND_UPLOADS_DIR, exist_ok=True)
os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)

def sanitize_filename(name):
    # remove special characters, replace spaces with underscore
    clean = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    clean = re.sub(r'_+', '_', clean).strip('_')
    return clean

def normalize_text(text):
    if not text:
        return ""
    # strip titles
    t = re.sub(r'^(dr|mr|ms|mrs|prof)\.?\s*', '', text, flags=re.IGNORECASE)
    t = t.replace('.', ' ')
    t = t.lower()
    t = re.sub(r'[^a-z0-9\s]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def get_tokens(norm_name):
    return [t for t in norm_name.split() if t]

def parse_excel_faculty(excel_file):
    wb = openpyxl.load_workbook(excel_file, data_only=True)
    sheet = wb['Registration Form']
    faculty_dict = {}

    for r in range(37, 120):
        fac_name = sheet.cell(r, 5).value
        emp_id = sheet.cell(r, 6).value
        desig = sheet.cell(r, 7).value

        if fac_name and emp_id:
            emp_id_str = str(int(emp_id) if isinstance(emp_id, (int, float)) else emp_id).strip()
            fac_name_str = str(fac_name).strip()
            desig_str = str(desig).strip() if desig else ""

            if emp_id_str not in faculty_dict:
                faculty_dict[emp_id_str] = {
                    "emp_id": emp_id_str,
                    "name": fac_name_str,
                    "designation": desig_str,
                }
            elif desig_str and not faculty_dict[emp_id_str]["designation"]:
                faculty_dict[emp_id_str]["designation"] = desig_str

    return faculty_dict

def fetch_website_faculty(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        resp = requests.get(url, headers=headers, verify=False, timeout=25)
        resp.raise_for_status()
        html = resp.text
    except Exception as e:
        print(f"Warning: Failed to fetch live URL ({e}). Attempting to read cached HTML if present...")
        cache_path = r"C:\Users\Krishna\.gemini\antigravity\brain\5e986109-8760-41ce-8e6b-cb01f23dbda9\scratch\faculty_page.html"
        if os.path.exists(cache_path):
            with open(cache_path, "r", encoding="utf-8") as f:
                html = f.read()
        else:
            raise

    soup = BeautifulSoup(html, 'html.parser')
    website_list = []
    member_names = soup.find_all('div', class_='member-name')

    for m in member_names:
        card = m.find_parent('div', class_=lambda c: c and any(k in c.lower() for k in ['team-member', 'member', 'wpb_column'])) or m.parent.parent
        text_lines = [l.strip() for l in m.get_text('\n', strip=True).split('\n') if l.strip()]
        name = text_lines[0] if text_lines else ""
        desig = text_lines[1] if len(text_lines) > 1 else ""
        img_el = card.find('img') if card else None
        img_url = img_el.get('src') if img_el else ""
        skills_el = card.find('div', class_='member-skills') if card else None
        skills_text = skills_el.get_text(' | ', strip=True) if skills_el else ""

        # Check if employee ID is in text or img
        emp_id_match = re.search(r'\b(8\d{3}|9\d{3}|10\d{3})\b', card.get_text() if card else "")
        found_emp_id = emp_id_match.group(1) if emp_id_match else None

        website_list.append({
            "name": name,
            "designation": desig,
            "department": skills_text,
            "image_url": img_url,
            "emp_id": found_emp_id
        })

    return website_list

def match_faculty_entry(ef, website_list):
    emp_id = ef["emp_id"]
    e_name = ef["name"]
    e_norm = normalize_text(e_name)
    e_tokens = get_tokens(e_norm)

    # Specific known phonetic and nickname aliases
    KNOWN_ALIASES = {
        "9940": "dr. archana kalidindi",      # klidindi -> kalidindi
        "10085": "dr. srikanth.ch",           # sreekanth -> srikanth ch
        "9155": "dr. chennabasamma",          # channabasamma -> chennabasamma
        "9939": "dr. nagababu garigipati",    # nagababu g -> nagababu garigipati
        "8694": "dr.patha srilatha",          # p srilatha -> patha srilatha
        "8837": "dr. j kavitha reddy",        # j kavitha -> j kavitha reddy
        "8827": "ms. siripuri divya",         # s divya -> siripuri divya
        "8918": "mr. mahesh kumar thota",     # t mahesh kumar -> mahesh kumar thota
        "10042": "dr. potluri srilakshmi",    # p srilakshmi -> potluri srilakshmi
    }

    # 1. Check known validated alias
    if emp_id in KNOWN_ALIASES:
        target_name_norm = normalize_text(KNOWN_ALIASES[emp_id])
        for wf in website_list:
            if normalize_text(wf["name"]) == target_name_norm:
                return wf, "MATCHED_BY_NAME", "MATCHED", f"Validated alias: '{wf['name']}'"

    # 2. Level 1: Match by Employee ID if available on website
    for wf in website_list:
        if wf["emp_id"] and wf["emp_id"] == emp_id:
            return wf, "MATCHED_BY_EMPLOYEE_ID", "MATCHED", f"Matched by EMP ID {emp_id}"

    # 3. Level 2: Exact normalized name match
    exact_matches = []
    for wf in website_list:
        w_norm = normalize_text(wf["name"])
        if w_norm == e_norm and e_norm:
            exact_matches.append(wf)
    if len(exact_matches) == 1:
        return exact_matches[0], "MATCHED_BY_NAME", "MATCHED", f"Exact name match: '{exact_matches[0]['name']}'"
    elif len(exact_matches) > 1:
        return None, "AMBIGUOUS", "AMBIGUOUS", f"Multiple exact matches: {[m['name'] for m in exact_matches]}"

    # 4. Level 3: Validated name variations
    candidate_matches = []
    for wf in website_list:
        w_norm = normalize_text(wf["name"])
        w_tokens = get_tokens(w_norm)

        # Check if all tokens of one are inside the other
        common = set(e_tokens).intersection(set(w_tokens))
        if len(common) >= 2 and (len(common) == len(e_tokens) or len(common) == len(w_tokens)):
            candidate_matches.append((wf, "NAME_VARIATION", f"Tokens matched: {common}"))

    if len(candidate_matches) == 1:
        return candidate_matches[0][0], "MATCHED_BY_NAME", "MATCHED", candidate_matches[0][2]
    elif len(candidate_matches) > 1:
        return None, "AMBIGUOUS", "AMBIGUOUS", f"Multiple variation matches: {[c[0]['name'] for c in candidate_matches]}"

    return None, "UNMATCHED", "UNMATCHED", "No matching faculty profile found on official webpage"

def download_image(url, target_path):
    if not url:
        return False
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = requests.get(url, headers=headers, verify=False, timeout=20)
        resp.raise_for_status()
        with open(target_path, "wb") as f:
            f.write(resp.content)
        return True
    except Exception as e:
        print(f"Error downloading image from {url}: {e}")
        return False

def main():
    print("=" * 60)
    print("FacultyLens - Faculty Photo Acquisition & Matching Engine")
    print("=" * 60)

    print(f"Parsing Excel from: {EXCEL_PATH}")
    excel_faculty = parse_excel_faculty(EXCEL_PATH)
    print(f"Found {len(excel_faculty)} unique faculty members in Excel.\n")

    print(f"Fetching official faculty directory from: {WEBSITE_URL}")
    website_faculty = fetch_website_faculty(WEBSITE_URL)
    print(f"Found {len(website_faculty)} faculty listings on official webpage.\n")

    report_rows = []
    matched_count = 0
    unmatched_count = 0
    ambiguous_count = 0
    downloaded_count = 0

    for emp_id, ef in sorted(excel_faculty.items(), key=lambda x: int(x[0]) if x[0].isdigit() else str(x[0])):
        matched_entry, method, status, notes = match_faculty_entry(ef, website_faculty)
        
        local_filename = ""
        image_url = ""
        website_name = ""
        website_desig = ""

        if status == "MATCHED" and matched_entry:
            matched_count += 1
            website_name = matched_entry["name"]
            website_desig = matched_entry["designation"]
            image_url = matched_entry["image_url"]

            if image_url:
                clean_name = sanitize_filename(ef["name"])
                ext = ".jpg"
                if ".png" in image_url.lower():
                    ext = ".png"
                elif ".jpeg" in image_url.lower():
                    ext = ".jpeg"

                local_filename = f"{emp_id}_{clean_name}{ext}"
                master_img_path = os.path.join(FACULTY_MASTER_DIR, local_filename)
                backend_img_path = os.path.join(BACKEND_UPLOADS_DIR, local_filename)

                # Download image
                if not os.path.exists(master_img_path):
                    print(f"Downloading photo for {ef['name']} ({emp_id})...")
                    success = download_image(image_url, master_img_path)
                    if success:
                        downloaded_count += 1
                        shutil.copyfile(master_img_path, backend_img_path)
                    else:
                        notes += " | Image download failed"
                else:
                    print(f"Photo already exists locally for {ef['name']} ({emp_id}).")
                    downloaded_count += 1
                    shutil.copyfile(master_img_path, backend_img_path)
        elif status == "AMBIGUOUS":
            ambiguous_count += 1
        else:
            unmatched_count += 1

        report_rows.append({
            "Excel faculty name": ef["name"],
            "Employee ID": ef["emp_id"],
            "Excel designation": ef["designation"],
            "Website faculty name": website_name,
            "Website designation": website_desig,
            "Match status": status,
            "Match method": method,
            "Local image filename": local_filename,
            "Image source URL": image_url,
            "Notes": notes
        })

    # Write report CSV
    fieldnames = [
        "Excel faculty name", "Employee ID", "Excel designation",
        "Website faculty name", "Website designation", "Match status",
        "Match method", "Local image filename", "Image source URL", "Notes"
    ]

    with open(REPORT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(report_rows)

    print("\n" + "=" * 60)
    print("ACQUISITION & MATCHING SUMMARY")
    print("=" * 60)
    print(f"Total unique faculty in Excel: {len(excel_faculty)}")
    print(f"Total matched:                 {matched_count}")
    print(f"Total photos downloaded:       {downloaded_count}")
    print(f"Total unmatched:               {unmatched_count}")
    print(f"Total ambiguous:               {ambiguous_count}")
    print(f"Report generated at:           {REPORT_PATH}")
    print(f"Photos master directory:       {FACULTY_MASTER_DIR}")
    print(f"Backend uploads directory:     {BACKEND_UPLOADS_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
