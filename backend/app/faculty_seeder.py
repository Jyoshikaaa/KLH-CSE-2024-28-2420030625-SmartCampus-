import os
import csv
import re
from sqlalchemy.orm import Session
from .models import Faculty, FacultyIdentification

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "faculty")
MATCH_REPORT_PATH = os.path.join(DATA_DIR, "faculty_match_report.csv")
MASTER_DIR = r"C:\Users\Krishna\Desktop\Faculty"

def normalize_text(text):
    if not text:
        return ""
    t = re.sub(r'^(dr|mr|ms|mrs|prof)\.?\s*', '', text, flags=re.IGNORECASE)
    t = t.replace('.', ' ')
    t = t.lower()
    t = re.sub(r'[^a-z0-9\s]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def seed_permanent_faculty(db: Session):
    """
    Pre-populates the permanent faculty directory from faculty_match_report.csv
    and verifies local photograph availability.
    """
    if not os.path.exists(MATCH_REPORT_PATH):
        print(f"Notice: {MATCH_REPORT_PATH} not found. Run photo acquisition script first.")
        return

    with open(MATCH_REPORT_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            emp_id = row.get("Employee ID", "").strip()
            name = row.get("Excel faculty name", "").strip()
            desig = row.get("Excel designation", "").strip() or "Faculty Member"
            local_file = row.get("Local image filename", "").strip()
            source_url = row.get("Image source URL", "").strip()

            if not emp_id or not name:
                continue

            photo_path = None
            photo_available = False

            if local_file:
                # Check if photo exists in uploads or master directory
                upload_file_path = os.path.join(UPLOADS_DIR, local_file)
                master_file_path = os.path.join(MASTER_DIR, local_file)
                if os.path.exists(upload_file_path) or os.path.exists(master_file_path):
                    photo_path = f"/uploads/faculty/{local_file}"
                    photo_available = True

            fac = db.query(Faculty).filter_by(employee_id=emp_id).first()
            if not fac:
                fac = Faculty(
                    employee_id=emp_id,
                    full_name=name,
                    normalized_name=normalize_text(name),
                    designation=desig,
                    department="Department of Computer Science & Engineering",
                    photo_path=photo_path,
                    photo_source_url=source_url if source_url else None,
                    photo_available=photo_available
                )
                db.add(fac)
                db.flush()
            else:
                if photo_available and not fac.photo_available:
                    fac.photo_path = photo_path
                    fac.photo_available = True
                    fac.photo_source_url = source_url

            # Ensure default identification status
            ident = db.query(FacultyIdentification).filter_by(
                student_identifier="default_student",
                faculty_id=fac.id
            ).first()
            if not ident:
                ident = FacultyIdentification(
                    student_identifier="default_student",
                    faculty_id=fac.id,
                    status="no_preference"
                )
                db.add(ident)

    db.commit()
    print("Permanent Faculty Directory successfully seeded.")
