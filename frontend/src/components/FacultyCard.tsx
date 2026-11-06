import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { FacultySummary } from '../types';

interface FacultyCardProps {
  faculty: FacultySummary;
}

export const FacultyCard: React.FC<FacultyCardProps> = ({ faculty }) => {
  const getInitials = (n: string) => {
    if (!n) return 'FL';
    const clean = n.replace(/^(Dr|Mr|Ms|Mrs|Prof)\.?\s*/i, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="taskengine-card p-6 flex flex-col justify-between group min-h-[520px]">
      <div className="space-y-4">
        {/* 1. PHOTO FIRST: 4:5 Aspect Ratio Portrait Frame (Occupies ~60% of card) */}
        <Link
          to={`/faculty/${faculty.employee_id}`}
          className="block faculty-photo-frame shadow-2xs group-hover:shadow-md transition-shadow"
        >
          {faculty.photo_path ? (
            <img
              src={faculty.photo_path}
              alt={faculty.full_name}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-slate-100 to-slate-200/80">
              <span className="text-4xl font-black text-slate-700 tracking-wider">
                {getInitials(faculty.full_name)}
              </span>
              <span className="text-xs text-slate-400 font-semibold mt-2">Photo unavailable</span>
            </div>
          )}
        </Link>

        {/* 2. NAME */}
        <div className="space-y-1.5 pt-1">
          <Link
            to={`/faculty/${faculty.employee_id}`}
            className="font-extrabold text-slate-900 group-hover:text-blue-600 transition text-lg block leading-snug line-clamp-1"
            title={faculty.full_name}
          >
            {faculty.full_name}
          </Link>

          {/* 3. EMP ID */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/70">
              EMP ID {faculty.employee_id}
            </span>
          </div>

          {/* 4. DESIGNATION */}
          <p className="text-xs text-slate-600 font-semibold truncate pt-0.5">
            {faculty.designation || 'Faculty Member'}
          </p>

          {/* 5. DEPARTMENT / CONTEXT */}
          <p className="text-[11px] text-slate-400 truncate">
            {faculty.department || 'Department of Computer Science & Engineering'}
          </p>
        </div>
      </div>

      {/* 6. ACTION */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <Link
          to={`/faculty/${faculty.employee_id}`}
          className="w-full py-2.5 rounded-2xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
        >
          <span>View Profile</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
