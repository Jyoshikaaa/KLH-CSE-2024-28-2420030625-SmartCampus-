import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Image,
  Search,
  ShieldCheck
} from 'lucide-react';
import { uploadExcel, getMatchReport } from '../api/client';
import type { MatchReportRow } from '../types';

export const AdminImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reportRows, setReportRows] = useState<MatchReportRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchReport = async () => {
    try {
      const data = await getMatchReport();
      setReportRows(data);
    } catch (err) {
      console.error('Report fetch error:', err);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage(null);
      setImportSummary(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('Please select a valid Excel file (.xlsx).');
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    try {
      const result = await uploadExcel(file);
      setImportSummary(result);
      await fetchReport();
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage(err.response?.data?.detail || 'Failed to upload and import Excel file.');
    } finally {
      setUploading(false);
    }
  };

  const filteredRows = reportRows.filter((r) => {
    if (statusFilter !== 'all' && r['Match status'] !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (r['Excel faculty name'] || '').toLowerCase().includes(q);
      const matchEmp = (r['Employee ID'] || '').toLowerCase().includes(q);
      const matchWeb = (r['Website faculty name'] || '').toLowerCase().includes(q);
      if (!matchName && !matchEmp && !matchWeb) return false;
    }
    return true;
  });

  const matchedCount = reportRows.filter((r) => r['Match status'] === 'MATCHED').length;
  const unmatchedCount = reportRows.filter((r) => r['Match status'] === 'UNMATCHED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Data Management & Excel Importer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload new semester registration sheets, re-run data ingestion, and inspect the official KLH faculty photo match audit trail.
          </p>
        </div>

        <Link
          to="/admin/faculty-photos"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition"
        >
          <Image className="w-4 h-4" />
          <span>Faculty Photo Manager</span>
        </Link>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-brand-600" />
          <span>Import Registration Option Form (.xlsx)</span>
        </h2>

        <div className="border-2 border-dashed border-slate-300 hover:border-brand-400 rounded-2xl p-8 text-center bg-slate-50/50 transition">
          <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">
            {file ? file.name : 'Select or drop your registration Excel workbook'}
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Supports standard KLH Option Form matrices (.xlsx, .xls)
          </p>

          <input
            type="file"
            id="excel-upload"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />

          <label
            htmlFor="excel-upload"
            className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition"
          >
            Browse Files
          </label>
        </div>

        {file && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setFile(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Workbook...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Execute Safe Import</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Import Summary */}
        {importSummary && (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-extrabold">{importSummary.message}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/60">
                <span className="text-slate-500 block">Courses</span>
                <span className="text-lg font-black text-slate-900">{importSummary.courses_count}</span>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/60">
                <span className="text-slate-500 block">Faculty</span>
                <span className="text-lg font-black text-slate-900">{importSummary.faculty_count}</span>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/60">
                <span className="text-slate-500 block">Assignments</span>
                <span className="text-lg font-black text-slate-900">{importSummary.assignments_count}</span>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/60">
                <span className="text-slate-500 block">Photos Matched</span>
                <span className="text-lg font-black text-emerald-700">{importSummary.photos_matched}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Faculty Matching Audit Report Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <span>Official Faculty Photo Matching Audit Report</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict 3-tier matching log against the official KLH faculty website.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
              {matchedCount} Matched
            </span>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
              {unmatchedCount} Unmatched
            </span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter audit report..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-brand-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              All ({reportRows.length})
            </button>
            <button
              onClick={() => setStatusFilter('MATCHED')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'MATCHED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Matched ({matchedCount})
            </button>
            <button
              onClick={() => setStatusFilter('UNMATCHED')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'UNMATCHED' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Unmatched ({unmatchedCount})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 font-extrabold text-slate-700">
              <tr>
                <th className="px-4 py-3">EMP ID</th>
                <th className="px-4 py-3">Excel Faculty Name</th>
                <th className="px-4 py-3">Website Matched Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Match Method</th>
                <th className="px-4 py-3">Local Photo File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row, idx) => {
                const isMatched = row['Match status'] === 'MATCHED';
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {row['Employee ID']}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {row['Excel faculty name']}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {row['Excel designation']}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row['Website faculty name'] || '—'}
                      {row['Website designation'] && (
                        <span className="block text-[10px] text-slate-400">
                          {row['Website designation']}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          isMatched
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {row['Match status']}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">
                      {row['Match method'] || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {row['Local image filename'] || (
                        <span className="text-slate-400 italic">Avatar Placeholder</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
