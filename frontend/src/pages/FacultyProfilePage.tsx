import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Check,
  Layers,
  MapPin,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { getFacultyDetail, addPlanItem } from '../api/client';
import type { FacultyDetail } from '../types';

export const FacultyProfilePage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [faculty, setFaculty] = useState<FacultyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingSectionId, setAddingSectionId] = useState<number | null>(null);
  const [addedSuccessId, setAddedSuccessId] = useState<number | null>(null);

  const fetchFaculty = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const data = await getFacultyDetail(employeeId);
      setFaculty(data);
    } catch (err) {
      console.error('Faculty profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [employeeId]);

  const handleSelectSection = async (courseId: number, sectionId: number, clusterId?: number | null) => {
    if (!faculty) return;
    setAddingSectionId(sectionId);
    try {
      await addPlanItem({
        course_id: courseId,
        section_id: sectionId,
        faculty_id: faculty.id,
        cluster_id: clusterId || undefined,
        priority: 1,
      });
      setAddedSuccessId(sectionId);
      setTimeout(() => setAddedSuccessId(null), 2500);
    } catch (err) {
      console.error('Add plan error:', err);
    } finally {
      setAddingSectionId(null);
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
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="inline-block w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading faculty profile...</p>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Faculty member not found</h2>
        <p className="text-xs text-slate-500">The employee ID "{employeeId}" does not exist in the faculty directory.</p>
        <Link to="/faculty" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-2xl font-bold text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All Faculty
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-entrance">
      {/* Back link */}
      <div>
        <Link
          to="/faculty"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Faculty</span>
        </Link>
      </div>

      {/* Main Profile ID-Card Style Hero Card (Photo on Left, Clean Info on Right) */}
      <div className="taskengine-hero p-8 sm:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Large 4:5 Portrait Photo Frame */}
        <div className="w-52 h-64 sm:w-60 sm:h-76 rounded-3xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-sm flex-shrink-0 relative">
          {faculty.photo_path ? (
            <img
              src={faculty.photo_path}
              alt={faculty.full_name}
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-slate-100 to-slate-200/80">
              <span className="text-4xl font-black text-slate-700">{getInitials(faculty.full_name)}</span>
              <span className="text-xs text-slate-400 font-semibold mt-2">Photo unavailable</span>
            </div>
          )}
        </div>

        {/* 1. Name -> 2. EMP ID -> 3. Designation -> 4. Department */}
        <div className="space-y-3.5 flex-1 text-center md:text-left">
          {faculty.photo_available && (
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Official Photo Verified
              </span>
            </div>
          )}

          {/* NAME */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {faculty.full_name}
          </h1>

          {/* EMP ID */}
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="text-xs font-mono font-bold bg-slate-900 text-white px-3 py-1 rounded-xl shadow-2xs">
              EMP ID {faculty.employee_id}
            </span>
          </div>

          {/* DESIGNATION */}
          <p className="text-base font-bold text-slate-700">
            {faculty.designation || 'Faculty Member'}
          </p>

          {/* DEPARTMENT */}
          <p className="text-xs text-slate-500 flex items-center justify-center md:justify-start gap-1.5 pt-1">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>{faculty.department || 'Department of Computer Science & Engineering'} • KLH Bachupally</span>
          </p>
        </div>
      </div>

      {/* Current Semester Teaching Assignments */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Current Semester Teaching Assignments ({faculty.assignments.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Add this faculty member directly to your Registration Plan for any of their assigned course sections.
          </p>
        </div>

        {faculty.assignments.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-3 text-slate-500">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-800">No active semester assignments loaded</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Upload your semester registration Option Form on the Dashboard to see which courses and sections this faculty is teaching.
            </p>
            <div className="pt-2">
              <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-xs">
                Upload Registration Excel
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faculty.assignments.map((a) => {
              const isAdding = addingSectionId === a.section_id;
              const isAdded = addedSuccessId === a.section_id;

              return (
                <div
                  key={a.assignment_id}
                  className="taskengine-card p-6 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {a.course_code}
                      </span>
                      {a.acronym && (
                        <span className="text-xs font-extrabold bg-slate-100 text-slate-900 px-2 py-0.5 rounded-lg">
                          {a.acronym}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/courses/${a.course_id}`}
                      className="font-extrabold text-slate-900 hover:text-blue-600 transition text-base sm:text-lg block leading-snug"
                    >
                      {a.course_title}
                    </Link>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-xs font-extrabold bg-slate-900 text-white px-3 py-0.5 rounded-xl shadow-2xs">
                        Section {a.section_name}
                      </span>
                      {a.cluster_name && (
                        <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-xl border border-slate-200 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          {a.cluster_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/courses/${a.course_id}`}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900"
                    >
                      View Course Options →
                    </Link>

                    <button
                      onClick={() => handleSelectSection(a.course_id, a.section_id, a.cluster_id)}
                      disabled={isAdding || isAdded}
                      className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 active:scale-98 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>✓ Added to Plan</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add to My Plan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
