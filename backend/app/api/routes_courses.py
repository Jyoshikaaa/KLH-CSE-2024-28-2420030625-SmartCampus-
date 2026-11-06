from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Course, Cluster, Section, CourseAssignment, Faculty, FacultyIdentification
from ..schemas import CourseSummary, CourseDetail, ClusterSchema, SectionSchema, CourseAssignmentDetail, FacultySummary

router = APIRouter(prefix="/api/courses", tags=["Courses"])

@router.get("", response_model=List[CourseSummary])
def get_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).order_by(Course.id).all()
    results = []
    for c in courses:
        # Count clusters, sections, faculty
        assignments = db.query(CourseAssignment).filter_by(course_id=c.id).all()
        cluster_ids = set(a.cluster_id for a in assignments if a.cluster_id)
        section_ids = set(a.section_id for a in assignments)
        faculty_ids = set(a.faculty_id for a in assignments)

        results.append(CourseSummary(
            id=c.id,
            course_code=c.course_code,
            course_title=c.course_title,
            acronym=c.acronym,
            category=c.category,
            bucket=c.bucket,
            specialization=c.specialization,
            lecture_hours=c.lecture_hours,
            tutorial_hours=c.tutorial_hours,
            practical_hours=c.practical_hours,
            skilling_hours=c.skilling_hours,
            credits=c.credits,
            contact_hours=c.contact_hours,
            cluster_count=len(cluster_ids),
            section_count=len(section_ids),
            faculty_count=len(faculty_ids)
        ))
    return results

@router.get("/{course_id}", response_model=CourseDetail)
def get_course_detail(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter_by(id=course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    assignments = db.query(CourseAssignment).filter_by(course_id=course.id).all()
    
    # Build assignment details
    assignment_details = []
    cluster_ids = set()
    section_ids = set()
    faculty_ids = set()

    for a in assignments:
        fac = db.query(Faculty).filter_by(id=a.faculty_id).first()
        sec = db.query(Section).filter_by(id=a.section_id).first()
        clust = db.query(Cluster).filter_by(id=a.cluster_id).first() if a.cluster_id else None
        
        # Get identification status
        ident = db.query(FacultyIdentification).filter_by(student_identifier="default_student", faculty_id=fac.id).first()
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

        assignment_details.append(CourseAssignmentDetail(
            id=a.id,
            section_id=sec.id,
            section_name=sec.section_name,
            cluster_id=clust.id if clust else None,
            cluster_name=clust.cluster_name if clust else None,
            faculty=fac_summary
        ))

        if clust:
            cluster_ids.add(clust.id)
        section_ids.add(sec.id)
        faculty_ids.add(fac.id)

    # Sort assignments by section name S1, S2, ... S13
    def sec_sort_key(item):
        s = item.section_name
        num = int(s.replace('S', '')) if s.replace('S', '').isdigit() else 99
        return num
    assignment_details.sort(key=sec_sort_key)

    # Build cluster schemas
    clusters = db.query(Cluster).filter(Cluster.id.in_(cluster_ids)).order_by(Cluster.cluster_name).all() if cluster_ids else []
    cluster_schemas = []
    for cl in clusters:
        # get sections for this course in this cluster
        cl_sections = [
            SectionSchema(id=sec.id, section_name=sec.section_name, cluster_id=cl.id, cluster_name=cl.cluster_name)
            for sec in cl.sections if sec.id in section_ids
        ]
        cl_sections.sort(key=lambda s: int(s.section_name.replace('S', '')) if s.section_name.replace('S', '').isdigit() else 99)
        cluster_schemas.append(ClusterSchema(
            id=cl.id,
            cluster_name=cl.cluster_name,
            sections=cl_sections
        ))

    return CourseDetail(
        id=course.id,
        course_code=course.course_code,
        course_title=course.course_title,
        acronym=course.acronym,
        category=course.category,
        bucket=course.bucket,
        specialization=course.specialization,
        lecture_hours=course.lecture_hours,
        tutorial_hours=course.tutorial_hours,
        practical_hours=course.practical_hours,
        skilling_hours=course.skilling_hours,
        credits=course.credits,
        contact_hours=course.contact_hours,
        cluster_count=len(cluster_ids),
        section_count=len(section_ids),
        faculty_count=len(faculty_ids),
        clusters=cluster_schemas,
        assignments=assignment_details
    )
