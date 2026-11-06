import os
import re
import csv
import openpyxl
from sqlalchemy.orm import Session
from .models import Course, Cluster, Section, CourseAssignment, Faculty, FacultyIdentification, RegistrationPlan, RegistrationPlanItem

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
FACULTY_UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "faculty")
MATCH_REPORT_PATH = os.path.join(DATA_DIR, "faculty_match_report.csv")

def normalize_text(text):
    if not text:
        return ""
    t = re.sub(r'^(dr|mr|ms|mrs|prof)\.?\s*', '', text, flags=re.IGNORECASE)
    t = t.replace('.', ' ')
    t = t.lower()
    t = re.sub(r'[^a-z0-9\s]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def load_photo_match_map():
    photo_map = {}
    if os.path.exists(MATCH_REPORT_PATH):
        with open(MATCH_REPORT_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                emp_id = row.get("Employee ID", "").strip()
                if emp_id and row.get("Match status") == "MATCHED":
                    photo_map[emp_id] = {
                        "local_filename": row.get("Local image filename", "").strip(),
                        "source_url": row.get("Image source URL", "").strip(),
                        "website_name": row.get("Website faculty name", "").strip(),
                        "website_desig": row.get("Website designation", "").strip(),
                    }
    return photo_map

def clear_semester_registration_data(db: Session):
    """
    Clears current semester courses, clusters, sections, assignments, and plan items,
    while leaving the permanent Faculty directory intact.
    """
    db.query(RegistrationPlanItem).delete()
    db.query(CourseAssignment).delete()
    db.query(Section).delete()
    db.query(Cluster).delete()
    db.query(Course).delete()
    db.commit()

def import_excel_data(file_path: str, db: Session) -> dict:
    wb = openpyxl.load_workbook(file_path, data_only=True)
    if "Registration Form" in wb.sheetnames:
        sheet = wb["Registration Form"]
    else:
        sheet = wb.active

    photo_map = load_photo_match_map()

    # Determine semester from headers
    sem_title = "Y24 III B.Tech Odd Sem"
    for r in range(1, 15):
        for c in range(1, 10):
            val = str(sheet.cell(r, c).value or "")
            if "Option Form" in val or "Odd Sem" in val:
                sem_title = val.strip()
                break

    # Clean existing semester registration assignments
    clear_semester_registration_data(db)

    # 1. Parse Course Metadata & Cluster Table (Rows 15 to 33)
    cluster_names = ["Cluster 1", "Cluster 2", "Cluster 3", "Cluster 4"]
    cluster_objects = {}
    for cname in cluster_names:
        c_obj = Cluster(cluster_name=cname, semester=sem_title)
        db.add(c_obj)
        db.flush()
        cluster_objects[cname] = c_obj

    # Cluster column to name mapping
    cluster_roman_map = {
        14: "Cluster 1", # I
        15: "Cluster 2", # II
        16: "Cluster 3", # III
        17: "Cluster 4"  # IV
    }

    # Map section string to cluster
    section_to_cluster_map = {}
    for r in range(17, 33):
        for col_idx, cname in cluster_roman_map.items():
            cell_val = sheet.cell(r, col_idx).value
            if cell_val:
                sec_list = [s.strip().upper() for s in str(cell_val).replace(',', ' ').split() if s.strip()]
                for s_name in sec_list:
                    section_to_cluster_map[s_name] = cname

    # Initialize all S1 to S13
    section_objects = {}
    for s_num in range(1, 14):
        s_name = f"S{s_num}"
        if s_num in [1, 2, 3]:
            cname = "Cluster 1"
        elif s_num in [4, 5, 6]:
            cname = "Cluster 2"
        elif s_num in [7, 8, 9, 10]:
            cname = "Cluster 3"
        elif s_num in [11, 12, 13]:
            cname = "Cluster 4"
        else:
            cname = section_to_cluster_map.get(s_name, "Cluster 1")
        
        c_obj = cluster_objects[cname]
        sec_obj = Section(section_name=s_name, cluster_id=c_obj.id)
        db.add(sec_obj)
        db.flush()
        section_objects[s_name] = sec_obj

    # Parse course metadata from rows 17-33
    course_metadata = {}
    for r in range(17, 33):
        code = sheet.cell(r, 4).value
        if code:
            code_str = str(code).strip()
            bucket = str(sheet.cell(r, 2).value or "").strip()
            cat = str(sheet.cell(r, 3).value or "").strip()
            acronym = str(sheet.cell(r, 5).value or "").strip()
            title = str(sheet.cell(r, 6).value or "").strip()
            spec = str(sheet.cell(r, 7).value or "").strip()
            
            def to_int(v):
                try: return int(float(v))
                except: return 0
            def to_float(v):
                try: return float(v)
                except: return 0.0

            l = to_int(sheet.cell(r, 8).value)
            t = to_int(sheet.cell(r, 9).value)
            p = to_int(sheet.cell(r, 10).value)
            s = to_int(sheet.cell(r, 11).value)
            cr = to_float(sheet.cell(r, 12).value)
            ch = to_float(sheet.cell(r, 13).value)

            course_metadata[code_str] = {
                "bucket": bucket,
                "category": cat,
                "acronym": acronym,
                "title": title,
                "specialization": spec,
                "lecture_hours": l,
                "tutorial_hours": t,
                "practical_hours": p,
                "skilling_hours": s,
                "credits": cr,
                "contact_hours": ch
            }

    # 2. Parse Faculty Assignments (Rows 37 to 120)
    current_course_code = None
    current_course_title = None

    courses_imported = {}
    faculty_used = {}
    assignments_created = 0

    for r in range(37, 120):
        code = sheet.cell(r, 2).value
        title = sheet.cell(r, 3).value
        sec = sheet.cell(r, 4).value
        fac_name = sheet.cell(r, 5).value
        emp_id = sheet.cell(r, 6).value
        desig = sheet.cell(r, 7).value

        if code:
            current_course_code = str(code).strip()
        if title:
            current_course_title = str(title).strip()

        if not current_course_code or not fac_name or not emp_id or not sec:
            continue

        emp_id_str = str(int(emp_id) if isinstance(emp_id, (int, float)) else emp_id).strip()
        fac_name_str = str(fac_name).strip()
        desig_str = str(desig).strip() if desig else "Assistant Professor"
        sec_str = str(sec).strip().upper()

        # Upsert Course
        if current_course_code not in courses_imported:
            c_meta = course_metadata.get(current_course_code, {})
            course_obj = db.query(Course).filter_by(course_code=current_course_code).first()
            if not course_obj:
                course_obj = Course(
                    course_code=current_course_code,
                    course_title=current_course_title or c_meta.get("title", current_course_code),
                    acronym=c_meta.get("acronym", ""),
                    category=c_meta.get("category", ""),
                    bucket=c_meta.get("bucket", ""),
                    specialization=c_meta.get("specialization", ""),
                    lecture_hours=c_meta.get("lecture_hours", 0),
                    tutorial_hours=c_meta.get("tutorial_hours", 0),
                    practical_hours=c_meta.get("practical_hours", 0),
                    skilling_hours=c_meta.get("skilling_hours", 0),
                    credits=c_meta.get("credits", 0.0),
                    contact_hours=c_meta.get("contact_hours", 0.0),
                    semester=sem_title
                )
                db.add(course_obj)
                db.flush()
            courses_imported[current_course_code] = course_obj
        else:
            course_obj = courses_imported[current_course_code]

        # Lookup in permanent faculty directory
        fac_obj = db.query(Faculty).filter_by(employee_id=emp_id_str).first()
        if not fac_obj:
            photo_info = photo_map.get(emp_id_str)
            photo_path = None
            photo_source_url = None
            photo_available = False
            if photo_info and photo_info["local_filename"]:
                local_file = photo_info["local_filename"]
                if os.path.exists(os.path.join(FACULTY_UPLOADS_DIR, local_file)):
                    photo_path = f"/uploads/faculty/{local_file}"
                    photo_available = True
                    photo_source_url = photo_info.get("source_url")

            fac_obj = Faculty(
                employee_id=emp_id_str,
                full_name=fac_name_str,
                normalized_name=normalize_text(fac_name_str),
                designation=desig_str,
                department="Department of Computer Science & Engineering",
                photo_path=photo_path,
                photo_source_url=photo_source_url,
                photo_available=photo_available
            )
            db.add(fac_obj)
            db.flush()

        faculty_used[emp_id_str] = fac_obj

        # Get Section & Cluster
        sec_obj = section_objects.get(sec_str)
        if not sec_obj:
            cname = section_to_cluster_map.get(sec_str, "Cluster 1")
            c_obj = cluster_objects[cname]
            sec_obj = Section(section_name=sec_str, cluster_id=c_obj.id)
            db.add(sec_obj)
            db.flush()
            section_objects[sec_str] = sec_obj

        cluster_obj = sec_obj.cluster

        # Create CourseAssignment
        assign = CourseAssignment(
            course_id=course_obj.id,
            cluster_id=cluster_obj.id if cluster_obj else None,
            section_id=sec_obj.id,
            faculty_id=fac_obj.id,
            semester=sem_title
        )
        db.add(assign)
        db.flush()
        assignments_created += 1

    # Update RegistrationPlan semester
    plan = db.query(RegistrationPlan).filter_by(student_identifier="default_student").first()
    if plan:
        plan.semester = sem_title

    db.commit()

    total_photos_matched = sum(1 for f in faculty_used.values() if f.photo_available)
    total_photos_unmatched = len(faculty_used) - total_photos_matched

    return {
        "success": True,
        "message": f"Successfully loaded {sem_title}: {len(courses_imported)} courses, {len(cluster_objects)} clusters, {len(section_objects)} sections.",
        "semester": sem_title,
        "courses_count": len(courses_imported),
        "clusters_count": len(cluster_objects),
        "sections_count": len(section_objects),
        "faculty_count": len(faculty_used),
        "assignments_count": assignments_created,
        "photos_matched": total_photos_matched,
        "photos_unmatched": total_photos_unmatched
    }
