from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    Course, Cluster, Section, CourseAssignment, Faculty,
    RegistrationPlan, RegistrationPlanItem, FacultyIdentification
)
from ..schemas import (
    RegistrationPlanDetail, CoursePlanGroup, PlanItemDetail,
    PlanItemCreate, PlanItemUpdate, FacultySummary, DashboardStats
)

router = APIRouter(prefix="/api", tags=["Registration Plan & Dashboard"])

def get_or_create_plan(db: Session, student_id: str = "default_student") -> RegistrationPlan:
    plan = db.query(RegistrationPlan).filter_by(student_identifier=student_id).first()
    if not plan:
        plan = RegistrationPlan(student_identifier=student_id, semester="Y24 III B.Tech Odd Sem")
        db.add(plan)
        db.commit()
        db.refresh(plan)
    return plan

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    plan = get_or_create_plan(db)
    
    total_courses = db.query(Course).count()
    total_clusters = db.query(Cluster).count()
    total_sections = db.query(Section).count()
    total_faculty = db.query(Faculty).count()

    plan_items = db.query(RegistrationPlanItem).filter_by(plan_id=plan.id).all()
    planned_course_ids = set(item.course_id for item in plan_items)
    selected_faculty_ids = set(item.faculty_id for item in plan_items)

    needing_id_count = db.query(FacultyIdentification).filter_by(
        student_identifier="default_student",
        status="need_to_identify"
    ).count()

    completion_pct = (len(planned_course_ids) / total_courses * 100) if total_courses > 0 else 0.0

    return DashboardStats(
        semester="Y24 III B.Tech Odd Sem",
        total_courses=total_courses,
        total_clusters=total_clusters,
        total_sections=total_sections,
        total_faculty=total_faculty,
        planned_courses=len(planned_course_ids),
        faculty_selected=len(selected_faculty_ids),
        faculty_needing_id=needing_id_count,
        completion_percentage=round(completion_pct, 1)
    )

@router.get("/registration-plan", response_model=RegistrationPlanDetail)
def get_registration_plan(student_id: str = "default_student", db: Session = Depends(get_db)):
    plan = get_or_create_plan(db, student_id)
    items = db.query(RegistrationPlanItem).filter_by(plan_id=plan.id).order_by(
        RegistrationPlanItem.course_id,
        RegistrationPlanItem.priority
    ).all()

    total_courses = db.query(Course).count()
    detailed_items = []
    course_groups_dict = {}

    for it in items:
        course = db.query(Course).filter_by(id=it.course_id).first()
        sec = db.query(Section).filter_by(id=it.section_id).first()
        clust = db.query(Cluster).filter_by(id=it.cluster_id).first() if it.cluster_id else None
        fac = db.query(Faculty).filter_by(id=it.faculty_id).first()
        ident = db.query(FacultyIdentification).filter_by(student_identifier=student_id, faculty_id=fac.id).first()
        ident_status = ident.status if ident else "no_preference"

        fac_summary = FacultySummary(
            id=fac.id,
            employee_id=fac.employee_id,
            full_name=fac.full_name,
            designation=fac.designation,
            department=fac.department,
            photo_path=fac.photo_path,
            photo_source_url=fac.photo_source_url,
            photo_available=fac.photo_available,
            identification_status=ident_status
        )

        p_detail = PlanItemDetail(
            id=it.id,
            course_id=course.id,
            course_code=course.course_code,
            course_title=course.course_title,
            acronym=course.acronym,
            category=course.category,
            cluster_id=clust.id if clust else None,
            cluster_name=clust.cluster_name if clust else None,
            section_id=sec.id,
            section_name=sec.section_name,
            faculty_id=fac.id,
            faculty=fac_summary,
            priority=it.priority,
            notes=it.notes
        )

        detailed_items.append(p_detail)

        if course.id not in course_groups_dict:
            course_groups_dict[course.id] = CoursePlanGroup(
                course_id=course.id,
                course_code=course.course_code,
                course_title=course.course_title,
                acronym=course.acronym,
                category=course.category,
                credits=course.credits,
                items=[]
            )
        course_groups_dict[course.id].items.append(p_detail)

    course_groups = list(course_groups_dict.values())
    planned_courses_count = len(course_groups)
    completion_pct = (planned_courses_count / total_courses * 100) if total_courses > 0 else 0.0

    return RegistrationPlanDetail(
        id=plan.id,
        student_identifier=plan.student_identifier,
        semester=plan.semester,
        course_groups=course_groups,
        total_courses_planned=planned_courses_count,
        total_courses_available=total_courses,
        completion_percentage=round(completion_pct, 1),
        items=detailed_items
    )

@router.post("/registration-plan", response_model=PlanItemDetail)
def add_plan_item(req: PlanItemCreate, student_id: str = "default_student", db: Session = Depends(get_db)):
    plan = get_or_create_plan(db, student_id)

    # Validate course, faculty, section
    course = db.query(Course).filter_by(id=req.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    fac = db.query(Faculty).filter_by(id=req.faculty_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty not found")
    sec = db.query(Section).filter_by(id=req.section_id).first()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")

    # Check if duplicate selection exists
    existing = db.query(RegistrationPlanItem).filter_by(
        plan_id=plan.id,
        course_id=req.course_id,
        faculty_id=req.faculty_id,
        section_id=req.section_id
    ).first()

    if existing:
        return PlanItemDetail(
            id=existing.id,
            course_id=course.id,
            course_code=course.course_code,
            course_title=course.course_title,
            acronym=course.acronym,
            category=course.category,
            cluster_id=sec.cluster_id,
            cluster_name=sec.cluster.cluster_name if sec.cluster else None,
            section_id=sec.id,
            section_name=sec.section_name,
            faculty_id=fac.id,
            faculty=FacultySummary.from_orm(fac),
            priority=existing.priority,
            notes=existing.notes
        )

    # If priority not explicitly given, assign next priority for this course
    course_items = db.query(RegistrationPlanItem).filter_by(plan_id=plan.id, course_id=req.course_id).all()
    next_priority = len(course_items) + 1 if req.priority <= 1 and course_items else req.priority

    clust_id = req.cluster_id or sec.cluster_id

    new_item = RegistrationPlanItem(
        plan_id=plan.id,
        course_id=req.course_id,
        cluster_id=clust_id,
        section_id=req.section_id,
        faculty_id=req.faculty_id,
        priority=next_priority,
        notes=req.notes
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    ident = db.query(FacultyIdentification).filter_by(student_identifier=student_id, faculty_id=fac.id).first()
    ident_status = ident.status if ident else "no_preference"

    return PlanItemDetail(
        id=new_item.id,
        course_id=course.id,
        course_code=course.course_code,
        course_title=course.course_title,
        acronym=course.acronym,
        category=course.category,
        cluster_id=new_item.cluster_id,
        cluster_name=new_item.cluster.cluster_name if new_item.cluster else None,
        section_id=sec.id,
        section_name=sec.section_name,
        faculty_id=fac.id,
        faculty=FacultySummary(
            id=fac.id,
            employee_id=fac.employee_id,
            full_name=fac.full_name,
            designation=fac.designation,
            department=fac.department,
            photo_path=fac.photo_path,
            photo_source_url=fac.photo_source_url,
            photo_available=fac.photo_available,
            identification_status=ident_status
        ),
        priority=new_item.priority,
        notes=new_item.notes
    )

@router.put("/registration-plan/{item_id}")
def update_plan_item(item_id: int, req: PlanItemUpdate, db: Session = Depends(get_db)):
    item = db.query(RegistrationPlanItem).filter_by(id=item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Plan item not found")

    if req.priority is not None:
        item.priority = req.priority
    if req.notes is not None:
        item.notes = req.notes
    if req.section_id is not None:
        item.section_id = req.section_id
    if req.faculty_id is not None:
        item.faculty_id = req.faculty_id
    if req.cluster_id is not None:
        item.cluster_id = req.cluster_id

    db.commit()
    return {"success": True, "message": "Plan item updated"}

@router.post("/registration-plan/reorder")
def reorder_plan_items(course_id: int, ordered_item_ids: List[int], db: Session = Depends(get_db)):
    for idx, item_id in enumerate(ordered_item_ids, start=1):
        db.query(RegistrationPlanItem).filter_by(id=item_id, course_id=course_id).update({"priority": idx})
    db.commit()
    return {"success": True, "message": "Priorities reordered"}

@router.delete("/registration-plan/{item_id}")
def delete_plan_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(RegistrationPlanItem).filter_by(id=item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Plan item not found")

    course_id = item.course_id
    plan_id = item.plan_id
    db.delete(item)
    db.commit()

    # Re-sequence remaining priorities for this course
    remaining = db.query(RegistrationPlanItem).filter_by(plan_id=plan_id, course_id=course_id).order_by(RegistrationPlanItem.priority).all()
    for idx, it in enumerate(remaining, start=1):
        it.priority = idx
    db.commit()

    return {"success": True, "message": "Plan item removed"}

@router.delete("/registration-plan/course/{course_id}")
def delete_course_plan(course_id: int, student_id: str = "default_student", db: Session = Depends(get_db)):
    plan = get_or_create_plan(db, student_id)
    db.query(RegistrationPlanItem).filter_by(plan_id=plan.id, course_id=course_id).delete()
    db.commit()
    return {"success": True, "message": "Course choices cleared"}
