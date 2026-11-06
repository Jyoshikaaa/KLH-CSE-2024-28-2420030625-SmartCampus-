import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import Faculty, CourseAssignment, Course, Section, Cluster, FacultyIdentification, RegistrationPlanItem
from ..schemas import FacultySummary, FacultyDetail, FacultyAssignmentInfo, IdentificationStatusUpdate

router = APIRouter(prefix="/api/faculty", tags=["Faculty"])

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads", "faculty")
MASTER_DIR = r"C:\Users\Krishna\Desktop\Faculty"
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(MASTER_DIR, exist_ok=True)

@router.get("", response_model=List[FacultySummary])
def get_faculty_list(
    q: Optional[str] = Query(None, description="Search by name or employee ID"),
    department: Optional[str] = Query(None),
    designation: Optional[str] = Query(None),
    course_id: Optional[int] = Query(None),
    cluster_id: Optional[int] = Query(None),
    section_name: Optional[str] = Query(None),
    status: Optional[str] = Query(None), # known, need_to_identify, no_preference
    db: Session = Depends(get_db)
):
    query = db.query(Faculty)

    if q:
        search_term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Faculty.full_name.ilike(search_term),
                Faculty.employee_id.ilike(search_term),
                Faculty.normalized_name.ilike(search_term)
            )
        )

    if department:
        query = query.filter(Faculty.department.ilike(f"%{department}%"))

    if designation:
        query = query.filter(Faculty.designation.ilike(f"%{designation}%"))

    faculty_list = query.order_by(Faculty.full_name).all()
    results = []

    for fac in faculty_list:
        # Check course/cluster/section filters if present
        assignments = db.query(CourseAssignment).filter_by(faculty_id=fac.id).all()

        if course_id and not any(a.course_id == course_id for a in assignments):
            continue
        if cluster_id and not any(a.cluster_id == cluster_id for a in assignments):
            continue
        if section_name:
            sec_ids = [s.id for s in db.query(Section).filter_by(section_name=section_name.strip().upper()).all()]
            if not any(a.section_id in sec_ids for a in assignments):
                continue

        ident = db.query(FacultyIdentification).filter_by(student_identifier="default_student", faculty_id=fac.id).first()
        ident_status = ident.status if ident else "no_preference"

        if status and ident_status != status:
            continue

        results.append(FacultySummary(
            id=fac.id,
            employee_id=fac.employee_id,
            full_name=fac.full_name,
            designation=fac.designation,
            department=fac.department,
            photo_path=fac.photo_path,
            photo_source_url=fac.photo_source_url,
            photo_available=fac.photo_available,
            identification_status=ident_status
        ))

    return results

@router.get("/needing-identification", response_model=List[FacultyDetail])
def get_faculty_needing_identification(db: Session = Depends(get_db)):
    idents = db.query(FacultyIdentification).filter_by(student_identifier="default_student", status="need_to_identify").all()
    results = []
    for ident in idents:
        fac = db.query(Faculty).filter_by(id=ident.faculty_id).first()
        if not fac:
            continue
        
        assignments = db.query(CourseAssignment).filter_by(faculty_id=fac.id).all()
        assign_info = []
        for a in assignments:
            c = db.query(Course).filter_by(id=a.course_id).first()
            s = db.query(Section).filter_by(id=a.section_id).first()
            cl = db.query(Cluster).filter_by(id=a.cluster_id).first() if a.cluster_id else None
            assign_info.append(FacultyAssignmentInfo(
                assignment_id=a.id,
                course_id=c.id,
                course_code=c.course_code,
                course_title=c.course_title,
                acronym=c.acronym,
                cluster_id=cl.id if cl else None,
                cluster_name=cl.cluster_name if cl else None,
                section_id=s.id,
                section_name=s.section_name
            ))

        results.append(FacultyDetail(
            id=fac.id,
            employee_id=fac.employee_id,
            full_name=fac.full_name,
            designation=fac.designation,
            department=fac.department,
            photo_path=fac.photo_path,
            photo_source_url=fac.photo_source_url,
            photo_available=fac.photo_available,
            identification_status="need_to_identify",
            assignments=assign_info
        ))
    return results

@router.get("/{employee_id}", response_model=FacultyDetail)
def get_faculty_by_id(employee_id: str, db: Session = Depends(get_db)):
    fac = db.query(Faculty).filter_by(employee_id=employee_id).first()
    if not fac:
        # try by integer id if passed
        if employee_id.isdigit():
            fac = db.query(Faculty).filter_by(id=int(employee_id)).first()
        if not fac:
            raise HTTPException(status_code=404, detail=f"Faculty with ID '{employee_id}' not found")

    assignments = db.query(CourseAssignment).filter_by(faculty_id=fac.id).all()
    assign_info = []
    for a in assignments:
        c = db.query(Course).filter_by(id=a.course_id).first()
        s = db.query(Section).filter_by(id=a.section_id).first()
        cl = db.query(Cluster).filter_by(id=a.cluster_id).first() if a.cluster_id else None
        assign_info.append(FacultyAssignmentInfo(
            assignment_id=a.id,
            course_id=c.id,
            course_code=c.course_code,
            course_title=c.course_title,
            acronym=c.acronym,
            cluster_id=cl.id if cl else None,
            cluster_name=cl.cluster_name if cl else None,
            section_id=s.id,
            section_name=s.section_name
        ))

    ident = db.query(FacultyIdentification).filter_by(student_identifier="default_student", faculty_id=fac.id).first()
    ident_status = ident.status if ident else "no_preference"

    return FacultyDetail(
        id=fac.id,
        employee_id=fac.employee_id,
        full_name=fac.full_name,
        designation=fac.designation,
        department=fac.department,
        photo_path=fac.photo_path,
        photo_source_url=fac.photo_source_url,
        photo_available=fac.photo_available,
        identification_status=ident_status,
        assignments=assign_info
    )

@router.post("/identify")
def set_faculty_identification(req: IdentificationStatusUpdate, db: Session = Depends(get_db)):
    fac = db.query(Faculty).filter_by(id=req.faculty_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty not found")

    if req.status not in ["known", "need_to_identify", "no_preference"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be known, need_to_identify, or no_preference")

    ident = db.query(FacultyIdentification).filter_by(student_identifier="default_student", faculty_id=fac.id).first()
    if not ident:
        ident = FacultyIdentification(
            student_identifier="default_student",
            faculty_id=fac.id,
            status=req.status
        )
        db.add(ident)
    else:
        ident.status = req.status

    db.commit()
    return {"success": True, "faculty_id": fac.id, "status": req.status}

@router.post("/{employee_id}/photo")
async def upload_faculty_photo(employee_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    fac = db.query(Faculty).filter_by(employee_id=employee_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty not found")

    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{fac.employee_id}_{fac.normalized_name.replace(' ', '_')}{ext}"
    
    upload_path = os.path.join(UPLOADS_DIR, filename)
    master_path = os.path.join(MASTER_DIR, filename)

    contents = await file.read()
    with open(upload_path, "wb") as f:
        f.write(contents)
    with open(master_path, "wb") as f:
        f.write(contents)

    fac.photo_path = f"/uploads/faculty/{filename}"
    fac.photo_available = True
    db.commit()

    return {
        "success": True,
        "message": f"Photo updated for {fac.full_name}",
        "photo_path": fac.photo_path
    }

@router.delete("/{employee_id}/photo")
def delete_faculty_photo(employee_id: str, db: Session = Depends(get_db)):
    fac = db.query(Faculty).filter_by(employee_id=employee_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty not found")

    fac.photo_path = None
    fac.photo_available = False
    db.commit()
    return {"success": True, "message": f"Photo removed for {fac.full_name}"}
