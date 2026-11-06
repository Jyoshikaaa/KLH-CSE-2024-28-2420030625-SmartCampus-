import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Calendar,
  Plus,
  BookOpen,
  Trash2,
  Sparkles,
  Printer
} from 'lucide-react';
import { toPng } from 'html-to-image';
import {
  getRegistrationPlan,
  reorderPlanItems,
  deletePlanItem,
  updatePlanItem,
  deleteCoursePlan
} from '../api/client';
import type { RegistrationPlanDetail, CoursePlanGroup } from '../types';
import { PriorityPlanningCard } from '../components/PriorityPlanningCard';

export const RegistrationPlanPage: React.FC = () => {
  const [plan, setPlan] = useState<RegistrationPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const data = await getRegistrationPlan();
      setPlan(data);
    } catch (err) {
      console.error('Fetch plan error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleMoveItem = async (group: CoursePlanGroup, index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= group.items.length) return;

    const newItems = [...group.items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    const orderedIds = newItems.map((it) => it.id);
    try {
      await reorderPlanItems(group.course_id, orderedIds);
      await fetchPlan();
    } catch (err) {
      console.error('Reorder error:', err);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await deletePlanItem(itemId);
      await fetchPlan();
    } catch (err) {
      console.error('Delete item error:', err);
    }
  };

  const handleUpdateNotes = async (itemId: number, notes: string) => {
    try {
      await updatePlanItem(itemId, { notes });
      await fetchPlan();
    } catch (err) {
      console.error('Update notes error:', err);
    }
  };

  const handleClearCourse = async (courseId: number) => {
    if (!window.confirm('Remove all faculty preferences for this course?')) return;
    try {
      await deleteCoursePlan(courseId);
      await fetchPlan();
    } catch (err) {
      console.error('Clear course error:', err);
    }
  };

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(printRef.current, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `FacultyLens_Registration_Plan.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('PNG export error:', err);
      alert('Failed to generate PNG image. You can also print the page.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="inline-block w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading registration plan...</p>
      </div>
    );
  }

  const courseGroups = plan?.course_groups || [];
  const totalPlannedCourses = courseGroups.length;
  const totalCredits = courseGroups.reduce((sum, g) => sum + (g.credits || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-entrance">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Registration Plan
            </h1>
            <span className="text-xs font-mono font-bold bg-white text-slate-700 px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
              {totalPlannedCourses} Courses · {totalCredits} Credits
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review your Priority 1, 2, and 3 backups for registration day.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadImage}
            disabled={exporting || courseGroups.length === 0}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Exporting...' : 'Download Plan (PNG)'}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={courseGroups.length === 0}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <Link
            to="/registration-day"
            className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-sm transition flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Registration Mode</span>
          </Link>
        </div>
      </div>

      {courseGroups.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 space-y-4 max-w-md mx-auto shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto shadow-inner">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Your plan is empty</h2>
            <p className="text-xs text-slate-500">
              Explore your courses and add faculty preferences to build your registration plan.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-xs hover:bg-slate-800 transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore Courses</span>
          </Link>
        </div>
      ) : (
        /* Printable & Downloadable Container (Export layout) */
        <div ref={printRef} className="bg-white p-7 sm:p-9 rounded-3xl border border-slate-200/90 shadow-sm space-y-8">
          {/* Card Header for Export */}
          <div className="border-b border-slate-200 pb-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                </div>
                <span className="font-black text-2xl text-slate-900 tracking-tight">FacultyLens</span>
                <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Registration Plan Card
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {plan?.semester} • {courseGroups.length} Courses Planned • {totalCredits} Credits Total
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
                READY FOR ERP
              </span>
            </div>
          </div>

          {/* Course Groups */}
          <div className="space-y-8">
            {courseGroups.map((group, idx) => (
              <div
                key={group.course_id}
                className="bg-slate-50/60 rounded-3xl p-6 sm:p-7 border border-slate-200/80 space-y-5"
              >
                {/* Course Header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold bg-white text-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {group.course_code}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg truncate">
                      {group.acronym ? `${group.acronym} — ` : ''}{group.course_title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                      {group.credits} Credits
                    </span>
                    <button
                      onClick={() => handleClearCourse(group.course_id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition no-print"
                      title="Clear course preferences"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Vertical ID Cards in a Responsive Row (3 per row) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.items.map((item, itemIdx) => (
                    <PriorityPlanningCard
                      key={item.id}
                      item={item}
                      isFirst={itemIdx === 0}
                      isLast={itemIdx === group.items.length - 1}
                      onMoveUp={() => handleMoveItem(group, itemIdx, 'up')}
                      onMoveDown={() => handleMoveItem(group, itemIdx, 'down')}
                      onDelete={() => handleDeleteItem(item.id)}
                      onUpdateNotes={(notes) => handleUpdateNotes(item.id, notes)}
                    />
                  ))}
                </div>

                {/* Add backup choice link */}
                <div className="pt-2 text-xs no-print">
                  <Link
                    to={`/courses/${group.course_id}`}
                    className="font-bold text-slate-800 hover:text-blue-600 inline-flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add another backup faculty for {group.acronym || group.course_code}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-1">
            <span>FacultyLens Pre-Registration Assistant • KLH Bachupally Campus</span>
            <span>Use Priority 1 first. If section is full in ERP, register Priority 2 backup immediately.</span>
          </div>
        </div>
      )}
    </div>
  );
};
