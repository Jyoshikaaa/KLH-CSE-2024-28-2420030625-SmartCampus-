import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  RefreshCw
} from 'lucide-react';
import { getFacultyList } from '../api/client';
import type { FacultySummary } from '../types';
import { FacultyCard } from '../components/FacultyCard';

export const FacultyExplorerPage: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesig, setSelectedDesig] = useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const facData = await getFacultyList();
      setFaculty(facData);
    } catch (err) {
      console.error('Faculty fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredFaculty = faculty.filter((f) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.full_name.toLowerCase().includes(q);
      const matchEmp = f.employee_id.toLowerCase().includes(q);
      const matchDesig = (f.designation || '').toLowerCase().includes(q);
      const matchDept = (f.department || '').toLowerCase().includes(q);
      if (!matchName && !matchEmp && !matchDesig && !matchDept) return false;
    }

    if (selectedDesig !== 'all') {
      if (selectedDesig === 'Professor' && !(f.designation || '').includes('Professor')) return false;
      if (selectedDesig === 'Associate' && !(f.designation || '').includes('Associate')) return false;
      if (selectedDesig === 'Assistant' && !(f.designation || '').includes('Assistant')) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-entrance">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            All Faculty
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Identify your faculty before registration with verified official photographs.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="self-start sm:self-auto px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Compact Search & Filter Row */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
        {/* Large Direct Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search faculty by name or employee ID (e.g. Archana, 9940, Kavitha)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Designation:</span>
            <button
              onClick={() => setSelectedDesig('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedDesig === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({faculty.length})
            </button>
            <button
              onClick={() => setSelectedDesig('Professor')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedDesig === 'Professor' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Professors
            </button>
            <button
              onClick={() => setSelectedDesig('Associate')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedDesig === 'Associate' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Associate Professors
            </button>
            <button
              onClick={() => setSelectedDesig('Assistant')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedDesig === 'Assistant' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Assistant Professors
            </button>
          </div>

          <span className="text-slate-400 text-xs font-semibold ml-2">
            Showing <strong>{filteredFaculty.length}</strong> of {faculty.length} Faculty
          </span>
        </div>
      </div>

      {/* 3-Column Vertical Faculty ID Cards Grid */}
      {loading ? (
        <div className="py-24 text-center text-slate-400">
          <div className="inline-block w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium">Loading faculty directory...</p>
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 space-y-3 max-w-md mx-auto shadow-2xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No faculty members match your query</h3>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDesig('all');
            }}
            className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-2xl hover:bg-slate-800 transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.map((fac) => (
            <FacultyCard
              key={fac.id}
              faculty={fac}
            />
          ))}
        </div>
      )}
    </div>
  );
};
