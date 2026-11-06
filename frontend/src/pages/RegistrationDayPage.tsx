import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Copy,
  Check,
  BookOpen
} from 'lucide-react';
import { getRegistrationPlan } from '../api/client';
import type { RegistrationPlanDetail } from '../types';

export const RegistrationDayPage: React.FC = () => {
  const [plan, setPlan] = useState<RegistrationPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredMap, setRegisteredMap] = useState<Record<number, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const data = await getRegistrationPlan();
        setPlan(data);
      } catch (err) {
        console.error('Registration Day fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const toggleRegistered = (courseId: number) => {
    setRegisteredMap((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
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
        <p className="text-xs text-slate-500 font-medium">Opening Registration Mode...</p>
      </div>
    );
  }

  const courseGroups = plan?.course_groups || [];
  const registeredCount = Object.values(registeredMap).filter(Boolean).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-entrance">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-slate-800 text-sky-400">
              <Calendar className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Registration Mode
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Speed-optimized cheat sheet for ERP registration • {plan?.semester}
          </p>
        </div>

        <div className="text-right">
          <span className="text-2xl sm:text-3xl font-black text-white">{registeredCount} / {courseGroups.length}</span>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed</span>
        </div>
      </div>

      {courseGroups.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 space-y-3 shadow-2xs">
          <p className="text-base font-bold text-slate-800">No courses planned yet</p>
          <p className="text-xs text-slate-400">Go to Explore Courses or My Plan to select your faculty options.</p>
          <Link to="/courses" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-xs">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Explore Courses</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {courseGroups.map((group, idx) => {
            const isDone = Boolean(registeredMap[group.course_id]);

            return (
              <div
                key={group.course_id}
                className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all duration-200 shadow-2xs ${
                  isDone
                    ? 'border-emerald-300 bg-emerald-50/15 opacity-75'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Course Header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                      {group.course_code}
                    </span>
                    <span className="font-extrabold text-slate-900 text-base sm:text-lg truncate">
                      {group.acronym ? `${group.acronym} — ` : ''}{group.course_title}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleRegistered(group.course_id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isDone ? 'Registered ✓' : 'Mark Done'}</span>
                  </button>
                </div>

                {/* Photo-First Priority Cards Row */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.items.map((item) => {
                    const isP1 = item.priority === 1;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-3xl border p-5 flex flex-col justify-between ${
                          isP1
                            ? 'bg-amber-50/30 border-amber-300 ring-1 ring-amber-200 shadow-2xs'
                            : 'bg-slate-50 border-slate-200/80'
                        }`}
                      >
                        <div className="space-y-3.5">
                          {/* 1. PHOTO FIRST: 4:5 Portrait Frame */}
                          <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-2xs">
                            {item.faculty.photo_path ? (
                              <img
                                src={item.faculty.photo_path}
                                alt={item.faculty.full_name}
                                className="w-full h-full object-cover object-top"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-100">
                                <span className="text-2xl font-black text-slate-700">{getInitials(item.faculty.full_name)}</span>
                              </div>
                            )}
                          </div>

                          {/* 2. NAME */}
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-slate-900 text-base truncate">
                              {item.faculty.full_name}
                            </h4>

                            {/* 3. EMP ID */}
                            <p className="text-xs font-mono font-bold text-slate-700">
                              EMP ID {item.faculty.employee_id}
                            </p>

                            {/* 4. DESIGNATION */}
                            <p className="text-xs text-slate-500 font-medium truncate">
                              {item.faculty.designation || 'Faculty Member'}
                            </p>

                            {/* 5. SECTION & CLUSTER */}
                            <div className="flex items-center justify-between gap-2 pt-2">
                              <button
                                onClick={() => copyToClipboard(item.section_name)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs shadow-2xs transition"
                                title="Click to copy section"
                              >
                                <span>Section {item.section_name}</span>
                                {copiedText === item.section_name ? (
                                  <Check className="w-3 h-3 text-emerald-300" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400" />
                                )}
                              </button>

                              {item.cluster_name && (
                                <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                                  {item.cluster_name}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 6. PRIORITY BADGE */}
                          <div className="pt-1">
                            <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                              isP1 ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}>
                              <span>{isP1 ? '🥇 Priority 1' : item.priority === 2 ? '🥈 Priority 2' : '🥉 Priority 3'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
