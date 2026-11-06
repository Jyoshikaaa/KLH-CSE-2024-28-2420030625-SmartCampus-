from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class FacultyBase(BaseModel):
    employee_id: str
    full_name: str
    designation: Optional[str] = None
    department: Optional[str] = None
    photo_path: Optional[str] = None
    photo_source_url: Optional[str] = None
    photo_available: bool = False

class FacultySummary(FacultyBase):
    id: int
    identification_status: Optional[str] = "no_preference"

    class Config:
        from_attributes = True

class FacultyAssignmentInfo(BaseModel):
    assignment_id: int
    course_id: int
    course_code: str
    course_title: str
    acronym: Optional[str] = None
    cluster_id: Optional[int] = None
    cluster_name: Optional[str] = None
    section_id: int
    section_name: str

class FacultyDetail(FacultySummary):
    assignments: List[FacultyAssignmentInfo] = []

class SectionSchema(BaseModel):
    id: int
    section_name: str
    cluster_id: Optional[int] = None
    cluster_name: Optional[str] = None

    class Config:
        from_attributes = True

class ClusterSchema(BaseModel):
    id: int
    cluster_name: str
    sections: List[SectionSchema] = []

    class Config:
        from_attributes = True

class CourseAssignmentDetail(BaseModel):
    id: int
    section_id: int
    section_name: str
    cluster_id: Optional[int] = None
    cluster_name: Optional[str] = None
    faculty: FacultySummary

class CourseSummary(BaseModel):
    id: int
    course_code: str
    course_title: str
    acronym: Optional[str] = None
    category: Optional[str] = None
    bucket: Optional[str] = None
    specialization: Optional[str] = None
    lecture_hours: int = 0
    tutorial_hours: int = 0
    practical_hours: int = 0
    skilling_hours: int = 0
    credits: float = 0.0
    contact_hours: float = 0.0
    cluster_count: int = 0
    section_count: int = 0
    faculty_count: int = 0

    class Config:
        from_attributes = True

class CourseDetail(CourseSummary):
    clusters: List[ClusterSchema] = []
    assignments: List[CourseAssignmentDetail] = []

class PlanItemCreate(BaseModel):
    course_id: int
    section_id: int
    faculty_id: int
    cluster_id: Optional[int] = None
    priority: int = 1
    notes: Optional[str] = None

class PlanItemUpdate(BaseModel):
    priority: Optional[int] = None
    notes: Optional[str] = None
    section_id: Optional[int] = None
    faculty_id: Optional[int] = None
    cluster_id: Optional[int] = None

class PlanItemDetail(BaseModel):
    id: int
    course_id: int
    course_code: str
    course_title: str
    acronym: Optional[str] = None
    category: Optional[str] = None
    cluster_id: Optional[int] = None
    cluster_name: Optional[str] = None
    section_id: int
    section_name: str
    faculty_id: int
    faculty: FacultySummary
    priority: int
    notes: Optional[str] = None

class CoursePlanGroup(BaseModel):
    course_id: int
    course_code: str
    course_title: str
    acronym: Optional[str] = None
    category: Optional[str] = None
    credits: float = 0.0
    items: List[PlanItemDetail] = []

class RegistrationPlanDetail(BaseModel):
    id: int
    student_identifier: str
    semester: str
    course_groups: List[CoursePlanGroup] = []
    total_courses_planned: int = 0
    total_courses_available: int = 0
    completion_percentage: float = 0.0
    items: List[PlanItemDetail] = []

class IdentificationStatusUpdate(BaseModel):
    faculty_id: int
    status: str # 'known', 'need_to_identify', 'no_preference'

class ImportSummary(BaseModel):
    success: bool
    message: str
    courses_count: int
    clusters_count: int
    sections_count: int
    faculty_count: int
    assignments_count: int
    photos_matched: int
    photos_unmatched: int

class DashboardStats(BaseModel):
    semester: str
    total_courses: int
    total_clusters: int
    total_sections: int
    total_faculty: int
    planned_courses: int
    faculty_selected: int
    faculty_needing_id: int
    completion_percentage: float
