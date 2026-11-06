import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  UserCheck,
  Search,
  RefreshCw,
  Users
} from 'lucide-react';
import { getFacultyNeedingIdentification, updateFacultyIdentification } from '../api/client';
import type { FacultyDetail } from '../types';
import { FacultyAvatar } from '../components/FacultyAvatar';

export const NeedToIdentifyPage: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultyDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getFacultyNeedingIdentification();
      setFaculty(data);
    } catch (err) {
      console.error('Fetch need to identify error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkKnown = async (facultyId: number) => {
    try {
      await updateFacultyIdentification(facultyId, 'known');
      setFaculty(faculty.filter((f) => f.id !== facultyId));
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleClearStatus = async (facultyId: number) => {
    try {
      await updateFacultyIdentification(facultyId, 'no_preference');
      setFaculty(faculty.filter((f) => f.id !== facultyId));
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const filteredFaculty = faculty.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.full_name.toLowerCase().includes(q) ||
      f.employee_id.toLowerCase().includes(q) ||
      (f.designation || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-amber-500 text-white shadow-xs">
              <HelpCircle className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Faculty I Need To Identify
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Review faculty members you have flagged for identity verification, teaching style check, or peer recommendations.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex items-center gap-2 text-xs font-semibold"
          title="Refresh list"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Search Filter */}
      {faculty.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or EMP ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white transition"
            />
          </div>

          <span className="text-xs font-semibold text-slate-500 flex-shrink-0">
            <strong>{filteredFaculty.length}</strong> Flagged for Review
          </span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="inline-block w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium">Loading flagged faculty...</p>
        </div>
      ) : faculty.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <UserCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No faculty marked as "Need to Identify"</h3>
          <p className="text-sm text-slate-500">
            As you browse courses and the faculty directory, click the <strong>? Identify</strong> badge on any professor you wish to review later. They will appear here in your review dashboard.
          </p>
          <Link
            to="/faculty"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md transition"
          >
            <Users className="w-4 h-4" />
            <span>Browse Faculty Directory</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFaculty.map((fac) => (
            <div
              key={fac.id}
              className="bg-white rounded-3xl p-6 border border-amber-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <Link to={`/faculty/${fac.employee_id}`}>
                    <FacultyAvatar
                      photoPath={fac.photo_path}
                      name={fac.full_name}
                      size="lg"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/faculty/${fac.employee_id}`}
                      className="font-extrabold text-slate-900 hover:text-brand-600 transition text-base block truncate"
                    >
                      {fac.full_name}
                    </Link>

                    <span className="text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md inline-block mt-1">
                      EMP: {fac.employee_id}
                    </span>

                    <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                      {fac.designation}
                    </p>
                  </div>
                </div>

                {/* Assigned Courses */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Current Semester Sections ({fac.assignments.length})
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {fac.assignments.map((a) => (
                      <div
                        key={a.assignment_id}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-200/70"
                      >
                        <span className="font-semibold text-slate-800 truncate mr-2">
                          {a.acronym || a.course_code}: {a.course_title}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="font-extrabold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded-md">
                            {a.section_name}
                          </span>
                          {a.cluster_name && (
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1 py-0.5 rounded-md font-bold">
                              {a.cluster_name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Switcher Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleClearStatus(fac.id)}
                  className="text-xs text-slate-400 hover:text-slate-700 font-medium"
                >
                  Clear Flag
                </button>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/faculty/${fac.employee_id}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    Profile
                  </Link>

                  <button
                    onClick={() => handleMarkKnown(fac.id)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-2xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>I Know This Faculty</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
