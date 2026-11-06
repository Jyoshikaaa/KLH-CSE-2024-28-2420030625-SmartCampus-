import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, BookOpen, ChevronRight } from 'lucide-react';
import { globalSearch } from '../api/client';
import { FacultyAvatar } from './FacultyAvatar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ faculty: any[]; courses: any[] }>({
    faculty: [],
    courses: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ faculty: [], courses: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ faculty: [], courses: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await globalSearch(query);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectFaculty = (employeeId: string) => {
    onClose();
    navigate(`/faculty/${employeeId}`);
  };

  const handleSelectCourse = (courseId: number) => {
    onClose();
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-brand-600 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search faculty name, employee ID, course code, title, or acronym..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-base focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="p-4 overflow-y-auto divide-y divide-slate-100">
          {loading && (
            <div className="py-12 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm font-medium">Searching directory...</p>
            </div>
          )}

          {!loading && query && results.faculty.length === 0 && results.courses.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <p className="text-base font-semibold">No results found for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching by EMP ID (e.g. 9940) or course code (e.g. 24CI3201)</p>
            </div>
          )}

          {!query && (
            <div className="py-8 text-center text-slate-400">
              <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">Quick Global Search</p>
              <p className="text-xs text-slate-400 mt-1">Search through all 34 faculty members and 16 registration courses</p>
            </div>
          )}

          {/* Faculty Results */}
          {results.faculty.length > 0 && (
            <div className="py-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <User className="w-3.5 h-3.5" />
                Faculty Members ({results.faculty.length})
              </div>
              <div className="space-y-1.5">
                {results.faculty.map((f) => (
                  <div
                    key={f.id}
                    className="p-2.5 rounded-xl hover:bg-brand-50/70 border border-transparent hover:border-brand-100 transition flex items-center justify-between gap-3 group cursor-pointer"
                    onClick={() => handleSelectFaculty(f.employee_id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FacultyAvatar photoPath={f.photo_path} name={f.full_name} size="sm" />
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 group-hover:text-brand-700 transition truncate">
                            {f.full_name}
                          </span>
                          <span className="text-xs font-mono bg-slate-100 group-hover:bg-brand-100 text-slate-600 group-hover:text-brand-800 px-1.5 py-0.5 rounded-md">
                            #{f.employee_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {f.designation} • {f.assignments?.length || 0} sections assigned
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                        Profile <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courses Results */}
          {results.courses.length > 0 && (
            <div className="py-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <BookOpen className="w-3.5 h-3.5" />
                Courses ({results.courses.length})
              </div>
              <div className="space-y-1.5">
                {results.courses.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-100 transition flex items-center justify-between gap-3 group cursor-pointer"
                    onClick={() => handleSelectCourse(c.id)}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 group-hover:text-emerald-800 transition truncate">
                          {c.course_title}
                        </span>
                        {c.acronym && (
                          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                            {c.acronym}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {c.course_code} • {c.category} • {c.credits} Credits
                      </p>
                    </div>
                    <span className="text-xs font-medium text-emerald-700 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 flex-shrink-0">
                      View Sections <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>Tip: Press <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">K</kbd> anywhere to open search</span>
          <button onClick={onClose} className="hover:text-slate-800 font-medium">Close</button>
        </div>
      </div>
    </div>
  );
};
