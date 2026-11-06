export interface SystemStatus {
  has_registration_data: boolean;
  semester: string;
  courses_count: number;
  clusters_count: number;
  sections_count: number;
  faculty_count: number;
}

export interface FacultySummary {
  id: number;
  employee_id: string;
  full_name: string;
  designation?: string;
  department?: string;
  photo_path?: string | null;
  photo_available: boolean;
  assigned_course_count: number;
  assigned_section_count: number;
}

export interface FacultyAssignmentInfo {
  assignment_id: number;
  course_id: number;
  course_code: string;
  course_title: string;
  acronym?: string;
  section_id: number;
  section_name: string;
  cluster_id?: number | null;
  cluster_name?: string | null;
}

export interface FacultyDetail extends FacultySummary {
  photo_source_url?: string | null;
  assignments: FacultyAssignmentInfo[];
}

export interface ClusterInfo {
  id: number;
  cluster_name: string;
}

export interface SectionInfo {
  id: number;
  section_name: string;
  cluster_id?: number | null;
  cluster_name?: string | null;
}

export interface CourseAssignmentDetail {
  id: number;
  section_id: number;
  section_name: string;
  cluster_id?: number | null;
  cluster_name?: string | null;
  faculty: FacultySummary;
}

export interface CourseSummary {
  id: number;
  course_code: string;
  course_title: string;
  acronym?: string;
  category?: string;
  bucket?: string;
  specialization?: string;
  credits: number;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  skilling_hours: number;
  contact_hours: number;
  cluster_count: number;
  section_count: number;
  faculty_count: number;
}

export interface CourseDetail extends CourseSummary {
  clusters: ClusterInfo[];
  sections: SectionInfo[];
  assignments: CourseAssignmentDetail[];
}

export interface PlanItemDetail {
  id: number;
  course_id: number;
  course_code: string;
  course_title: string;
  acronym?: string;
  section_id: number;
  section_name: string;
  cluster_id?: number | null;
  cluster_name?: string | null;
  priority: number;
  notes?: string | null;
  faculty: FacultySummary;
}

export interface CoursePlanGroup {
  course_id: number;
  course_code: string;
  course_title: string;
  acronym?: string;
  credits?: number;
  items: PlanItemDetail[];
}

export interface RegistrationPlanDetail {
  id: number;
  student_identifier: string;
  semester: string;
  total_courses_planned: number;
  total_courses_available: number;
  items: PlanItemDetail[];
  course_groups: CoursePlanGroup[];
}

export interface DashboardStats {
  total_faculty: number;
  total_courses: number;
  total_clusters: number;
  total_sections: number;
  planned_courses: number;
  completion_percentage: number;
  photos_matched: number;
}

export interface MatchReportRow {
  'Employee ID': string;
  'Excel faculty name': string;
  'Excel designation': string;
  'Match status': string;
  'Match method': string;
  'Website faculty name': string;
  'Website designation': string;
  'Local image filename': string;
  'Image source URL': string;
}
