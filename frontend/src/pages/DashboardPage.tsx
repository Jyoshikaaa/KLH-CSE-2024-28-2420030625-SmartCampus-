import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  BookOpen,
  Sparkles,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  Users,
  ShieldCheck
} from 'lucide-react';
import {
  getSystemStatus,
  uploadExcel,
  resetSemesterData,
  getCourses,
  getRegistrationPlan
} from '../api/client';
import type { SystemStatus, CourseSummary, RegistrationPlanDetail } from '../types';

const FACULTYLENS_VERSION = 'v2.0_clean';

export const DashboardPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [plan, setPlan] = useState<RegistrationPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload states
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check version and clear stale local storage if needed
  useEffect(() => {
    const savedVersion = localStorage.getItem('FACULTYLENS_VERSION');
    if (savedVersion !== FACULTYLENS_VERSION) {
      localStorage.clear();
      localStorage.setItem('FACULTYLENS_VERSION', FACULTYLENS_VERSION);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const s = await getSystemStatus();
      setStatus(s);

      if (s.has_registration_data) {
        const [cData, pData] = await Promise.all([
          getCourses(),
          getRegistrationPlan(),
        ]);
        setCourses(cData);
        setPlan(pData);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleProcessFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMessage("We couldn't read this file. Please make sure you're uploading the original .xlsx file provided by KLH.");
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    setUploadStep(1); // Reading option form

    try {
      setTimeout(() => setUploadStep(2), 300); // Detecting courses
      setTimeout(() => setUploadStep(3), 600); // Detecting clusters
      setTimeout(() => setUploadStep(4), 900); // Matching faculty
      setTimeout(() => setUploadStep(5), 1200); // Preparing plan

      await uploadExcel(file);

      setTimeout(async () => {
        setUploading(false);
        setUploadStep(0);
        await loadData();
      }, 1400);
    } catch (err: any) {
      console.error('Upload processing error:', err);
      setUploading(false);
      setUploadStep(0);
      setErrorMessage(
        err.response?.data?.detail ||
        "We couldn't process this option form. Please make sure you're uploading the original .xlsx file provided by KLH."
      );
    }
  };

  const handleResetSemester = async () => {
    if (!window.confirm('Do you want to change or replace the current semester registration Excel?')) return;
    try {
      await resetSemesterData();
      await loadData();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="inline-block w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading workspace...</p>
      </div>
    );
  }

  // --- STATE A: NO REGISTRATION EXCEL LOADED (Clean Initial State) ---
  if (!status || !status.has_registration_data) {
    const facCount = status ? status.faculty_count : 34;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-8 animate-entrance">
        {/* Centered Layered Task Engine-Style Upload Card */}
        <div className="relative">
          {/* Floating subtle background card depth effect */}
          <div className="absolute inset-x-6 -top-4 h-24 bg-gradient-to-r from-indigo-100/50 via-slate-100 to-sky-100/50 rounded-[36px] -z-10 blur-sm transform -rotate-1 opacity-70" />

          <div className="taskengine-upload-card p-8 sm:p-14 text-center space-y-8 relative overflow-hidden">
            {/* Sparkle Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Smart Registration Planning</span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-sm">
                <span className="text-2xl font-black">✦</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Upload Option Form
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Upload the Excel option form provided by KLH before registration planning.
              </p>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`rounded-3xl border-2 border-dashed p-8 sm:p-10 text-center transition-all duration-200 bg-white shadow-2xs ${
                dragActive
                  ? 'border-slate-900 bg-sky-50/50 ring-4 ring-slate-100 scale-[1.01]'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <input
                type="file"
                id="excel-drop-input"
                accept=".xlsx, .xls"
                onChange={handleFileInput}
                className="hidden"
                disabled={uploading}
              />

              {uploading ? (
                <div className="space-y-5 max-w-sm mx-auto py-2">
                  <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
                  <h3 className="text-sm font-extrabold text-slate-900">Preparing your registration plan...</h3>

                  {/* 5-step animated progress */}
                  <div className="space-y-2 text-left bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs font-mono">
                    <p className={`flex items-center justify-between ${uploadStep >= 1 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      <span>Reading option form</span>
                      <span>{uploadStep >= 1 ? '✓' : '...'}</span>
                    </p>
                    <p className={`flex items-center justify-between ${uploadStep >= 2 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      <span>Detecting courses</span>
                      <span>{uploadStep >= 2 ? '✓' : '...'}</span>
                    </p>
                    <p className={`flex items-center justify-between ${uploadStep >= 3 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      <span>Mapping clusters</span>
                      <span>{uploadStep >= 3 ? '✓' : '...'}</span>
                    </p>
                    <p className={`flex items-center justify-between ${uploadStep >= 4 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      <span>Matching faculty</span>
                      <span>{uploadStep >= 4 ? '✓' : '...'}</span>
                    </p>
                    <p className={`flex items-center justify-between ${uploadStep >= 5 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      <span>Preparing your plan</span>
                      <span>{uploadStep >= 5 ? '✓' : '...'}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto shadow-2xs border border-slate-200/80">
                    <FileSpreadsheet className="w-8 h-8 text-slate-800" />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="excel-drop-input"
                      className="cursor-pointer inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition transform active:scale-98"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Choose Excel File</span>
                    </label>
                    <p className="text-xs text-slate-400 font-medium">Drag & drop your <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">.xlsx</code> file here</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-4">
                    <span>Supported format: .xlsx</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {facCount} Faculty Directory Predefined
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Toast */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Direct Faculty Link */}
            <div className="pt-2 text-center">
              <Link
                to="/faculty"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Explore permanent Faculty Directory ({facCount} professors)</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STATE B: REGISTRATION EXCEL LOADED (Active Semester View) ---
  const plannedCount = plan?.total_courses_planned || 0;
  const totalCount = courses.length || (status ? status.courses_count : 0);
  const completionPct = totalCount > 0 ? Math.round((plannedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-entrance">
      {/* Refined Task Engine-Inspired Semester Header */}
      <div className="taskengine-hero p-7 sm:p-9 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-wider">
            <span>ACTIVE SEMESTER</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {status?.semester}
          </h1>

          <p className="text-xs font-semibold text-slate-500 flex items-center gap-2 flex-wrap">
            <span>{status?.courses_count} Courses</span>
            <span>•</span>
            <span>{status?.clusters_count} Clusters</span>
            <span>•</span>
            <span>{status?.sections_count} Sections</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-shrink-0">
          <button
            onClick={handleResetSemester}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition flex items-center gap-2"
            title="Upload another semester file"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Change Excel</span>
          </button>

          <Link
            to="/courses"
            className="px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-2 shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Explore Courses</span>
          </Link>
        </div>
      </div>

      {/* Elegant Planning Progress Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">Planning Progress</span>
          <span className="font-bold text-slate-900">
            {plannedCount} / {totalCount} Courses Planned ({completionPct}%)
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-slate-900 h-full rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Semester Courses Grid (Larger Dimensions ~25% bigger) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Semester Courses</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click any course to inspect cluster section faculty options</p>
          </div>

          <Link
            to="/courses"
            className="text-xs font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1"
          >
            <span>View All Courses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3-Column Responsive Grid with Larger Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => {
            const isPlanned = plan?.course_groups.some((g) => g.course_id === c.id);

            return (
              <Link
                key={c.id}
                to={`/courses/${c.id}`}
                className="taskengine-card p-6 sm:p-7 flex flex-col justify-between group min-h-[220px]"
              >
                <div className="space-y-3">
                  {/* Top: Code & Status Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                      {c.course_code}
                    </span>

                    {isPlanned ? (
                      <span className="text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        PLANNED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/60">
                        ○ NOT PLANNED
                      </span>
                    )}
                  </div>

                  {/* Course Title */}
                  <h3 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition text-lg sm:text-xl leading-snug line-clamp-2">
                    {c.course_title}
                  </h3>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                    {c.acronym && (
                      <span className="font-extrabold bg-slate-100 text-slate-900 px-2 py-0.5 rounded-md border border-slate-200/60">
                        {c.acronym}
                      </span>
                    )}
                    <span className="text-slate-600 font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      {c.credits} Credits
                    </span>
                    <span className="text-slate-500 font-medium">
                      {c.category}
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-600">{c.faculty_count} Faculty Options</span>
                  <span className="font-bold text-slate-900 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
