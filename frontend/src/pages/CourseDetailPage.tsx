import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  CheckCircle2,
  Plus,
  Check,
  ChevronRight
} from 'lucide-react';
import { getCourseDetail, getRegistrationPlan, addPlanItem } from '../api/client';
import type { CourseDetail, RegistrationPlanDetail, CourseAssignmentDetail } from '../types';

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [plan, setPlan] = useState<RegistrationPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingAssignId, setAddingAssignId] = useState<number | null>(null);
  const [addedAssignId, setAddedAssignId] = useState<number | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [cData, pData] = await Promise.all([
        getCourseDetail(parseInt(id, 10)),
        getRegistrationPlan(),
      ]);
      setCourse(cData);
      setPlan(pData);
    } catch (err) {
      console.error('Course detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSelectFaculty = async (assign: CourseAssignmentDetail) => {
    if (!course) return;
    setAddingAssignId(assign.id);
    try {
      await addPlanItem({
        course_id: course.id,
        section_id: assign.section_id,
        faculty_id: assign.faculty.id,
        cluster_id: assign.cluster_id || undefined,
        priority: 1,
      });
      setAddedAssignId(assign.id);
      await fetchData();
      setTimeout(() => setAddedAssignId(null), 2500);
    } catch (err) {
      console.error('Add to plan error:', err);
    } finally {
      setAddingAssignId(null);
    }
  };

  const getInitials = (n: string) => {
    if (!n) return 'FL';
    const clean = n.replace(/^(Dr|Mr|Ms|Mrs|Prof)\.?\s*/i, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="inline-block w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading course options...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Course not found</h2>
        <Link to="/courses" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-2xl font-bold text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
        </Link>
      </div>
    );
  }

  const coursePlanGroup = plan?.course_groups.find((g) => g.course_id === course.id);
  const plannedItems = coursePlanGroup?.items || [];

  // Group assignments by cluster
  const assignmentsByCluster: Record<string, CourseAssignmentDetail[]> = {};
  course.assignments.forEach((a) => {
    const cName = a.cluster_name || 'Cluster 1';
    if (!assignmentsByCluster[cName]) {
      assignmentsByCluster[cName] = [];
    }
    assignmentsByCluster[cName].push(a);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-entrance">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore Courses</span>
        </Link>

        {plannedItems.length > 0 && (
          <Link
            to="/plan"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-extrabold transition shadow-2xs hover:bg-emerald-100/70"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{plannedItems.length} Option{plannedItems.length > 1 ? 's' : ''} in Plan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Course Overview Header Card */}
      <div className="taskengine-hero p-7 sm:p-9 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80">
                {course.course_code}
              </span>
              {course.acronym && (
                <span className="text-xs font-extrabold bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                  {course.acronym}
                </span>
              )}
              <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70 shadow-2xs">
                {course.category}
              </span>
              <span className="text-xs font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70 shadow-2xs">
                {course.credits} Credits
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {course.course_title}
            </h1>

            {course.specialization && (
              <p className="text-xs text-slate-500 italic">
                {course.specialization}
              </p>
            )}
          </div>

          <div className="text-xs text-slate-500 text-left md:text-right bg-white p-4 rounded-2xl border border-slate-200/80 flex-shrink-0 shadow-2xs">
            <span className="font-semibold text-slate-700">L: {course.lecture_hours} • T: {course.tutorial_hours} • P: {course.practical_hours} • S: {course.skilling_hours}</span>
            <span className="block text-[11px] text-slate-400 mt-1">({course.contact_hours} Contact Hours)</span>
          </div>
        </div>

        {/* Selected Plan Summary Banner */}
        {plannedItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-emerald-900">Your Current Plan Preferences:</span>
              {plannedItems.map((pi) => (
                <span
                  key={pi.id}
                  className="bg-emerald-100/70 text-emerald-900 px-3 py-1 rounded-xl border border-emerald-300/80 font-bold"
                >
                  Priority {pi.priority}: {pi.faculty.full_name} ({pi.section_name})
                </span>
              ))}
            </div>
            <Link to="/plan" className="font-extrabold text-emerald-700 hover:text-emerald-900 underline">
              Manage in My Plan →
            </Link>
          </div>
        )}
      </div>

      {/* Cluster-by-Cluster Photo-First Vertical Faculty Cards */}
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Available Faculty Options by Cluster
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Identify your professor visually and add your section preferences to My Plan.
          </p>
        </div>

        <div className="space-y-8">
          {Object.entries(assignmentsByCluster).map(([cName, assigns]) => (
            <div
              key={cName}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6"
            >
              {/* Cluster Title Banner */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">
                      {cName}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {assigns.length} Allocated Section{assigns.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* PHOTO-FIRST VERTICAL FACULTY CARDS GRID (3 Columns on Desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {assigns.map((assign) => {
                  const isAdding = addingAssignId === assign.id;
                  const isAdded = addedAssignId === assign.id;
                  const inPlan = plannedItems.find(
                    (p) => p.section_id === assign.section_id && p.faculty.id === assign.faculty.id
                  );

                  return (
                    <div
                      key={assign.id}
                      className={`taskengine-card p-6 flex flex-col justify-between group min-h-[540px] ${
                        inPlan
                          ? 'border-emerald-300 ring-2 ring-emerald-100 bg-emerald-50/15 shadow-sm'
                          : 'border-slate-200/90'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* 1. PHOTO FIRST: 4:5 Aspect Ratio Portrait Frame */}
                        <Link
                          to={`/faculty/${assign.faculty.employee_id}`}
                          className="block faculty-photo-frame shadow-2xs group-hover:shadow-md transition-shadow"
                        >
                          {assign.faculty.photo_path ? (
                            <img
                              src={assign.faculty.photo_path}
                              alt={assign.faculty.full_name}
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-slate-100 to-slate-200/80">
                              <span className="text-4xl font-black text-slate-700 tracking-wider">
                                {getInitials(assign.faculty.full_name)}
                              </span>
                              <span className="text-xs text-slate-400 font-semibold mt-2">Photo unavailable</span>
                            </div>
                          )}
                        </Link>

                        {/* 2. NAME */}
                        <div className="space-y-1.5 pt-1">
                          <Link
                            to={`/faculty/${assign.faculty.employee_id}`}
                            className="font-extrabold text-slate-900 group-hover:text-blue-600 transition text-lg block leading-snug line-clamp-1"
                            title={assign.faculty.full_name}
                          >
                            {assign.faculty.full_name}
                          </Link>

                          {/* 3. EMP ID */}
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/70">
                              EMP ID {assign.faculty.employee_id}
                            </span>
                          </div>

                          {/* 4. DESIGNATION */}
                          <p className="text-xs text-slate-600 font-semibold truncate pt-0.5">
                            {assign.faculty.designation || 'Faculty Member'}
                          </p>

                          {/* 5. SECTION & CLUSTER CONTEXT */}
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <span className="text-xs font-black bg-slate-900 text-white px-3 py-1 rounded-xl shadow-2xs">
                              Section {assign.section_name}
                            </span>
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200/70">
                              {assign.cluster_name}
                            </span>
                            {inPlan && (
                              <span className="text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-xl">
                                Priority {inPlan.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 6. CARD ACTION CONTROLS */}
                      <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                        <button
                          onClick={() => handleSelectFaculty(assign)}
                          disabled={isAdding || isAdded}
                          className={`w-full py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-xs active:scale-98 ${
                            inPlan
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {inPlan ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>✓ In Plan (Priority {inPlan.priority})</span>
                            </>
                          ) : isAdded ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>✓ Added to Plan!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>+ Add to My Plan</span>
                            </>
                          )}
                        </button>

                        <div className="text-center">
                          <Link
                            to={`/faculty/${assign.faculty.employee_id}`}
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                          >
                            <span>View Full Profile</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
