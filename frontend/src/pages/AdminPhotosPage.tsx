import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { getFacultyList, uploadFacultyPhoto, deleteFacultyPhoto } from '../api/client';
import type { FacultySummary } from '../types';
import { FacultyAvatar } from '../components/FacultyAvatar';

export const AdminPhotosPage: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingEmpId, setUploadingEmpId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFacultyForUpload, setSelectedFacultyForUpload] = useState<FacultySummary | null>(null);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const data = await getFacultyList();
      setFaculty(data);
    } catch (err) {
      console.error('Fetch faculty error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleTriggerUpload = (fac: FacultySummary) => {
    setSelectedFacultyForUpload(fac);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedFacultyForUpload) return;
    const file = e.target.files[0];
    const empId = selectedFacultyForUpload.employee_id;

    setUploadingEmpId(empId);
    try {
      await uploadFacultyPhoto(empId, file);
      setNotification({ text: `Photo updated successfully for ${selectedFacultyForUpload.full_name}`, type: 'success' });
      await fetchFaculty();
    } catch (err) {
      console.error('Photo upload error:', err);
      setNotification({ text: `Failed to upload photo.`, type: 'error' });
    } finally {
      setUploadingEmpId(null);
      setSelectedFacultyForUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDeletePhoto = async (fac: FacultySummary) => {
    if (!window.confirm(`Are you sure you want to remove the photo for ${fac.full_name}?`)) return;
    try {
      await deleteFacultyPhoto(fac.employee_id);
      setNotification({ text: `Photo removed for ${fac.full_name}`, type: 'success' });
      await fetchFaculty();
    } catch (err) {
      console.error('Photo delete error:', err);
      setNotification({ text: `Failed to remove photo.`, type: 'error' });
    } finally {
      setTimeout(() => setNotification(null), 3000);
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

  const photoCount = faculty.filter((f) => f.photo_available).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/import"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Excel Importer</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Faculty Photo Dataset Manager
            </h1>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              {photoCount} / {faculty.length} Photos Configured
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage local photographs in <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">C:\Users\Krishna\Desktop\Faculty</code>. Upload or replace faculty pictures anytime.
          </p>
        </div>

        <button
          onClick={fetchFaculty}
          className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search faculty name or EMP ID to manage photo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Showing <strong>{filteredFaculty.length}</strong> Faculty
        </span>
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="inline-block w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium">Loading faculty list...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredFaculty.map((fac) => {
            const isUploading = uploadingEmpId === fac.employee_id;

            return (
              <div
                key={fac.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 hover:border-brand-300 shadow-xs transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-center py-2">
                    <FacultyAvatar
                      photoPath={fac.photo_path}
                      name={fac.full_name}
                      size="xl"
                    />
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1">
                      {fac.full_name}
                    </h3>
                    <p className="text-xs font-mono font-bold text-slate-500">
                      EMP: {fac.employee_id}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {fac.designation || 'Faculty'}
                    </p>
                  </div>

                  {fac.photo_path ? (
                    <p className="text-[10px] font-mono text-slate-400 truncate bg-slate-50 p-1.5 rounded-lg border border-slate-200/50">
                      {fac.photo_path}
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200/50 text-center font-medium">
                      No Photo Configured
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTriggerUpload(fac)}
                    disabled={isUploading}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{fac.photo_available ? 'Replace' : 'Upload'}</span>
                  </button>

                  {fac.photo_available && (
                    <button
                      onClick={() => handleDeletePhoto(fac)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
