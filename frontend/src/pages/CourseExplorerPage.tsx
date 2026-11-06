import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  UploadCloud
} from 'lucide-react';
import { getCourses, getRegistrationPlan, getSystemStatus } from '../api/client';
import type { CourseSummary, RegistrationPlanDetail, SystemStatus } from '../types';

export const CourseExplorerPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [plan, setPlan] = useState<RegistrationPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
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
        console.error('Courses fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="inline-block w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading courses...</p>
      </div>
    );
  }

  // If no Excel uploaded
  if (!status?.has_registration_data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4 animate-fade-in-up">
        <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center mx-auto shadow-xs">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">No courses loaded yet</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Upload your semester registration Option Form Excel from the Dashboard to explore all available courses, clusters, and faculty assignments.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-xs transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Go to Dashboard to Upload</span>
          </Link>
        </div>
      </div>
    );
  }

  const categories = Array.from(new Set(courses.map((c) => c.category).filter(Boolean))) as string[];

  const filteredCourses = courses.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.course_title.toLowerCase().includes(q);
      const matchCode = c.course_code.toLowerCase().includes(q);
      const matchAcronym = (c.acronym || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchAcronym) return false;
    }

    if (selectedCategory !== 'all' && c.category !== selectedCategory) {
      return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Courses
          </h1>
          <span className="text-xs font-mono font-bold bg-white text-slate-700 px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
            {courses.length} Courses
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Find your course and compare faculty options before registration.
        </p>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search course title, code, or acronym..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <span className="text-slate-400 text-xs flex-shrink-0 font-medium">
            <strong>{filteredCourses.length}</strong> of {courses.length} Courses
          </span>
        </div>
      </div>

      {/* Course Cards Responsive Grid (Larger Dimensions ~25% bigger) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((c) => {
          const isPlanned = plan?.course_groups.some((g) => g.course_id === c.id);

          return (
            <Link
              key={c.id}
              to={`/courses/${c.id}`}
              className="premium-card p-6 sm:p-7 flex flex-col justify-between group min-h-[230px]"
            >
              <div className="space-y-3">
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

                <h3 className="font-extrabold text-slate-900 group-hover:text-brand-600 transition text-lg sm:text-xl leading-snug line-clamp-2">
                  {c.course_title}
                </h3>

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
  );
};
