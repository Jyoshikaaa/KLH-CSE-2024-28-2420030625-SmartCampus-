import axios from 'axios';
import type {
  CourseSummary,
  CourseDetail,
  FacultySummary,
  FacultyDetail,
  RegistrationPlanDetail,
  PlanItemDetail,
  DashboardStats,
  MatchReportRow
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SystemStatus {
  has_registration_data: boolean;
  semester: string;
  courses_count: number;
  clusters_count: number;
  sections_count: number;
  faculty_count: number;
}

export const getSystemStatus = async (): Promise<SystemStatus> => {
  const res = await api.get<SystemStatus>('/status');
  return res.data;
};

export const resetSemesterData = async (): Promise<{ success: boolean; message: string }> => {
  const res = await api.post('/import/reset-semester');
  return res.data;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get<DashboardStats>('/dashboard/stats');
  return res.data;
};

export const getCourses = async (): Promise<CourseSummary[]> => {
  const res = await api.get<CourseSummary[]>('/courses');
  return res.data;
};

export const getCourseDetail = async (id: number): Promise<CourseDetail> => {
  const res = await api.get<CourseDetail>(`/courses/${id}`);
  return res.data;
};

export const getFacultyList = async (params?: {
  q?: string;
  department?: string;
  designation?: string;
  course_id?: number;
  cluster_id?: number;
  section_name?: string;
  status?: string;
}): Promise<FacultySummary[]> => {
  const res = await api.get<FacultySummary[]>('/faculty', { params });
  return res.data;
};

export const getFacultyDetail = async (employeeId: string): Promise<FacultyDetail> => {
  const res = await api.get<FacultyDetail>(`/faculty/${employeeId}`);
  return res.data;
};

export const getFacultyNeedingIdentification = async (): Promise<FacultyDetail[]> => {
  const res = await api.get<FacultyDetail[]>('/faculty/needing-identification');
  return res.data;
};

export const updateFacultyIdentification = async (
  facultyId: number,
  status: 'known' | 'need_to_identify' | 'no_preference'
): Promise<{ success: boolean; faculty_id: number; status: string }> => {
  const res = await api.post('/faculty/identify', { faculty_id: facultyId, status });
  return res.data;
};

export const getRegistrationPlan = async (): Promise<RegistrationPlanDetail> => {
  const res = await api.get<RegistrationPlanDetail>('/registration-plan');
  return res.data;
};

export const addPlanItem = async (data: {
  course_id: number;
  section_id: number;
  faculty_id: number;
  cluster_id?: number;
  priority?: number;
  notes?: string;
}): Promise<PlanItemDetail> => {
  const res = await api.post<PlanItemDetail>('/registration-plan', data);
  return res.data;
};

export const updatePlanItem = async (
  itemId: number,
  data: { priority?: number; notes?: string }
): Promise<{ success: boolean }> => {
  const res = await api.put(`/registration-plan/${itemId}`, data);
  return res.data;
};

export const reorderPlanItems = async (
  courseId: number,
  orderedItemIds: number[]
): Promise<{ success: boolean }> => {
  const res = await api.post('/registration-plan/reorder', orderedItemIds, {
    params: { course_id: courseId },
  });
  return res.data;
};

export const deletePlanItem = async (itemId: number): Promise<{ success: boolean }> => {
  const res = await api.delete(`/registration-plan/${itemId}`);
  return res.data;
};

export const deleteCoursePlan = async (courseId: number): Promise<{ success: boolean }> => {
  const res = await api.delete(`/registration-plan/course/${courseId}`);
  return res.data;
};

export const uploadExcel = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/import/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getMatchReport = async (): Promise<MatchReportRow[]> => {
  const res = await api.get<MatchReportRow[]>('/import/report');
  return res.data;
};

export const uploadFacultyPhoto = async (employeeId: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/faculty/${employeeId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteFacultyPhoto = async (employeeId: string): Promise<any> => {
  const res = await api.delete(`/faculty/${employeeId}/photo`);
  return res.data;
};

export const globalSearch = async (query: string): Promise<{ faculty: any[]; courses: any[] }> => {
  const res = await api.get('/search', { params: { q: query } });
  return res.data;
};

export default api;
