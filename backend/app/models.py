import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(200), nullable=False, index=True)
    normalized_name = Column(String(200), index=True)
    designation = Column(String(100), default="Faculty")
    department = Column(String(100), default="Computer Science & Engineering")
    photo_path = Column(String(500), nullable=True)
    photo_source_url = Column(String(500), nullable=True)
    photo_available = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    assignments = relationship("CourseAssignment", back_populates="faculty", cascade="all, delete-orphan")
    identifications = relationship("FacultyIdentification", back_populates="faculty", cascade="all, delete-orphan")
    plan_items = relationship("RegistrationPlanItem", back_populates="faculty")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(50), unique=True, index=True, nullable=False)
    course_title = Column(String(250), nullable=False, index=True)
    acronym = Column(String(50), nullable=True)
    category = Column(String(50), nullable=True)
    bucket = Column(String(50), nullable=True)
    specialization = Column(String(200), nullable=True)
    lecture_hours = Column(Integer, default=0)
    tutorial_hours = Column(Integer, default=0)
    practical_hours = Column(Integer, default=0)
    skilling_hours = Column(Integer, default=0)
    credits = Column(Float, default=0.0)
    contact_hours = Column(Float, default=0.0)
    semester = Column(String(50), default="Y24 III B.Tech Odd Sem")

    assignments = relationship("CourseAssignment", back_populates="course", cascade="all, delete-orphan")
    plan_items = relationship("RegistrationPlanItem", back_populates="course")

class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(Integer, primary_key=True, index=True)
    cluster_name = Column(String(50), nullable=False) # I, II, III, IV
    semester = Column(String(50), default="Y24 III B.Tech Odd Sem")

    sections = relationship("Section", back_populates="cluster", cascade="all, delete-orphan")
    assignments = relationship("CourseAssignment", back_populates="cluster")
    plan_items = relationship("RegistrationPlanItem", back_populates="cluster")

    __table_args__ = (UniqueConstraint('cluster_name', 'semester', name='uix_cluster_semester'),)

class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    section_name = Column(String(50), nullable=False, index=True) # S1, S2...
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=False)

    cluster = relationship("Cluster", back_populates="sections")
    assignments = relationship("CourseAssignment", back_populates="section")
    plan_items = relationship("RegistrationPlanItem", back_populates="section")

    __table_args__ = (UniqueConstraint('section_name', 'cluster_id', name='uix_section_cluster'),)

class CourseAssignment(Base):
    __tablename__ = "course_assignments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    semester = Column(String(50), default="Y24 III B.Tech Odd Sem")

    course = relationship("Course", back_populates="assignments")
    cluster = relationship("Cluster", back_populates="assignments")
    section = relationship("Section", back_populates="assignments")
    faculty = relationship("Faculty", back_populates="assignments")

class RegistrationPlan(Base):
    __tablename__ = "registration_plans"

    id = Column(Integer, primary_key=True, index=True)
    student_identifier = Column(String(100), default="default_student", index=True)
    semester = Column(String(50), default="Y24 III B.Tech Odd Sem")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    items = relationship("RegistrationPlanItem", back_populates="plan", cascade="all, delete-orphan")

class RegistrationPlanItem(Base):
    __tablename__ = "registration_plan_items"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("registration_plans.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    priority = Column(Integer, default=1) # 1, 2, 3...
    notes = Column(Text, nullable=True)

    plan = relationship("RegistrationPlan", back_populates="items")
    course = relationship("Course", back_populates="plan_items")
    cluster = relationship("Cluster", back_populates="plan_items")
    section = relationship("Section", back_populates="plan_items")
    faculty = relationship("Faculty", back_populates="plan_items")

class FacultyIdentification(Base):
    __tablename__ = "faculty_identifications"

    id = Column(Integer, primary_key=True, index=True)
    student_identifier = Column(String(100), default="default_student", index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    status = Column(String(50), default="no_preference") # 'known', 'need_to_identify', 'no_preference'
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    faculty = relationship("Faculty", back_populates="identifications")

    __table_args__ = (UniqueConstraint('student_identifier', 'faculty_id', name='uix_student_faculty_ident'),)
