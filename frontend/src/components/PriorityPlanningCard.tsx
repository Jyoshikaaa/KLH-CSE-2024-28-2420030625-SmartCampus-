import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  Check
} from 'lucide-react';
import type { PlanItemDetail } from '../types';

interface PriorityPlanningCardProps {
  item: PlanItemDetail;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onUpdateNotes: (notes: string) => void;
}

export const PriorityPlanningCard: React.FC<PriorityPlanningCardProps> = ({
  item,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdateNotes,
}) => {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(item.notes || '');

  const getPriorityStyle = (p: number) => {
    if (p === 1) {
      return {
        label: 'PRIORITY 1',
        icon: '🥇',
        badgeClass: 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold',
        borderClass: 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/15',
      };
    } else if (p === 2) {
      return {
        label: 'PRIORITY 2',
        icon: '🥈',
        badgeClass: 'bg-slate-100 text-slate-900 border-slate-300 font-bold',
        borderClass: 'border-slate-300 bg-slate-50/30',
      };
    } else if (p === 3) {
      return {
        label: 'PRIORITY 3',
        icon: '🥉',
        badgeClass: 'bg-amber-50 text-amber-900 border-amber-200 font-bold',
        borderClass: 'border-slate-200 bg-white',
      };
    }
    return {
      label: `PRIORITY ${p}`,
      icon: '🔹',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      borderClass: 'border-slate-200 bg-white',
    };
  };

  const priorityStyle = getPriorityStyle(item.priority);

  const handleSaveNotes = () => {
    onUpdateNotes(notesText);
    setEditingNotes(false);
  };

  const getInitials = (n: string) => {
    if (!n) return 'FL';
    const clean = n.replace(/^(Dr|Mr|Ms|Mrs|Prof)\.?\s*/i, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className={`rounded-3xl border p-5 transition-all duration-200 shadow-2xs hover:shadow-xs ${priorityStyle.borderClass} flex flex-col justify-between group min-h-[480px] w-full`}
    >
      <div className="space-y-3.5">
        {/* 1. PHOTO FIRST: 4:5 Aspect Ratio Portrait Frame (Unobstructed at top) */}
        <Link
          to={`/faculty/${item.faculty.employee_id}`}
          className="block faculty-photo-frame h-48 shadow-2xs group-hover:shadow-md transition-shadow"
        >
          {item.faculty.photo_path ? (
            <img
              src={item.faculty.photo_path}
              alt={item.faculty.full_name}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-slate-100 to-slate-200/80">
              <span className="text-3xl font-black text-slate-700">{getInitials(item.faculty.full_name)}</span>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">Photo unavailable</span>
            </div>
          )}
        </Link>

        {/* 2. NAME */}
        <div className="space-y-1.5 pt-0.5">
          <Link
            to={`/faculty/${item.faculty.employee_id}`}
            className="font-extrabold text-slate-900 hover:text-blue-600 transition text-base block leading-snug truncate"
            title={item.faculty.full_name}
          >
            {item.faculty.full_name}
          </Link>

          {/* 3. EMP ID */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
              EMP ID {item.faculty.employee_id}
            </span>
          </div>

          {/* 4. DESIGNATION */}
          <p className="text-xs text-slate-600 font-semibold truncate">
            {item.faculty.designation || 'Faculty Member'}
          </p>

          {/* 5. SECTION & CLUSTER */}
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            <span className="text-[11px] font-black bg-slate-900 text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
              Section {item.section_name}
            </span>
            {item.cluster_name && (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                {item.cluster_name}
              </span>
            )}
          </div>

          {/* 6. PRIORITY BADGE (Clean badge below metadata, not covering photo) */}
          <div className="pt-2">
            <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs ${priorityStyle.badgeClass}`}>
              <span>{priorityStyle.icon}</span>
              <span>{priorityStyle.label}</span>
            </span>
          </div>
        </div>

        {/* Custom Notes */}
        {item.notes && !editingNotes && (
          <div className="text-[11px] text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs truncate">
            <span className="font-bold text-slate-900">Note: </span>
            <span>{item.notes}</span>
          </div>
        )}

        {/* Inline Note Editor */}
        {editingNotes && (
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Note..."
              className="text-[11px] px-2.5 py-1 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white w-full"
            />
            <button
              onClick={handleSaveNotes}
              className="p-1 bg-slate-900 text-white rounded-lg text-xs"
              title="Save note"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Controls: Move Left/Right + Edit Note + Delete */}
      <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className={`p-1.5 rounded-xl transition border border-transparent ${
              isFirst
                ? 'text-slate-200 cursor-not-allowed'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:border-slate-200 shadow-2xs active:bg-slate-100'
            }`}
            title="Move Priority Up (Left)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onMoveDown}
            disabled={isLast}
            className={`p-1.5 rounded-xl transition border border-transparent ${
              isLast
                ? 'text-slate-200 cursor-not-allowed'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:border-slate-200 shadow-2xs active:bg-slate-100'
            }`}
            title="Move Priority Down (Right)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setEditingNotes(!editingNotes)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-200"
            title="Edit note"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onDelete}
          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
          title="Remove from plan"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
