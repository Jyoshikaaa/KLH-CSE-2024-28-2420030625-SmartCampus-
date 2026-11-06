import os
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import Course, Faculty, Section, Cluster, CourseAssignment, FacultyIdentification, RegistrationPlanItem
from ..excel_importer import import_excel_data, clear_semester_registration_data
from ..schemas import ImportSummary

router = APIRouter(prefix="/api", tags=["Import & Search"])

IMPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "imports")
REPORT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "faculty_match_report.csv")
os.makedirs(IMPORTS_DIR, exist_ok=True)

@router.get("/status")
def get_system_status(db: Session = Depends(get_db)):
    courses_count = db.query(Course).count()
    clusters_count = db.query(Cluster).count()
    sections_count = db.query(Section).count()
    faculty_count = db.query(Faculty).count()
    
    first_course = db.query(Course).first()
    semester = first_course.semester if first_course else "Not Loaded"
    
    return {
        "has_registration_data": courses_count > 0,
        "semester": semester,
        "courses_count": courses_count,
        "clusters_count": clusters_count,
        "sections_count": sections_count,
        "faculty_count": faculty_count,
    }

@router.post("/import/reset-semester")
def reset_semester(db: Session = Depends(get_db)):
    clear_semester_registration_data(db)
    return {"success": True, "message": "Semester registration data cleared successfully."}

@router.post("/import/excel", response_model=ImportSummary)
async def upload_and_import_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are supported.")

    file_path = os.path.join(IMPORTS_DIR, file.filename)
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    try:
        summary = import_excel_data(file_path, db)
        return ImportSummary(**summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse and import Excel: {str(e)}")

@router.get("/import/report")
def get_matching_report():
    if not os.path.exists(REPORT_PATH):
        return []
    with open(REPORT_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)

@router.get("/search")
def global_search(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    term = f"%{q.strip()}%"
    
    # Search Faculty directly
    faculty_matches = db.query(Faculty).filter(
        or_(
            Faculty.full_name.ilike(term),
            Faculty.employee_id.ilike(term),
            Faculty.normalized_name.ilike(term),
            Faculty.designation.ilike(term),
            Faculty.department.ilike(term)
        )
    ).limit(15).all()

    faculty_results = []
    for fac in faculty_matches:
        assignments = db.query(CourseAssignment).filter_by(faculty_id=fac.id).all()
        courses_assigned = []
        for a in assignments:
            c = db.query(Course).filter_by(id=a.course_id).first()
            s = db.query(Section).filter_by(id=a.section_id).first()
            cl = db.query(Cluster).filter_by(id=a.cluster_id).first() if a.cluster_id else None
            if c:
                courses_assigned.append({
                    "course_code": c.course_code,
                    "course_title": c.course_title,
                    "acronym": c.acronym,
                    "section": s.section_name if s else "",
                    "cluster": cl.cluster_name if cl else ""
                })

        ident = db.query(FacultyIdentification).filter_by(student_identifier="default_student", faculty_id=fac.id).first()
        faculty_results.append({
            "id": fac.id,
            "employee_id": fac.employee_id,
            "full_name": fac.full_name,
            "designation": fac.designation,
            "department": fac.department,
            "photo_path": fac.photo_path,
            "photo_available": fac.photo_available,
            "identification_status": ident.status if ident else "no_preference",
            "assignments": courses_assigned
        })

    # Search Courses
    course_matches = db.query(Course).filter(
        or_(
            Course.course_title.ilike(term),
            Course.course_code.ilike(term),
            Course.acronym.ilike(term),
            Course.specialization.ilike(term)
        )
    ).limit(10).all()

    course_results = []
    for c in course_matches:
        course_results.append({
            "id": c.id,
            "course_code": c.course_code,
            "course_title": c.course_title,
            "acronym": c.acronym,
            "category": c.category,
            "credits": c.credits
        })

    return {
        "query": q,
        "faculty": faculty_results,
        "courses": course_results
    }
