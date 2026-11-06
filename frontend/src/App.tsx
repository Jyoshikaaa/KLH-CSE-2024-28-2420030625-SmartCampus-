import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { DashboardPage } from './pages/DashboardPage';
import { CourseExplorerPage } from './pages/CourseExplorerPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { FacultyExplorerPage } from './pages/FacultyExplorerPage';
import { FacultyProfilePage } from './pages/FacultyProfilePage';
import { RegistrationPlanPage } from './pages/RegistrationPlanPage';
import { RegistrationDayPage } from './pages/RegistrationDayPage';
import { AdminImportPage } from './pages/AdminImportPage';
import { AdminPhotosPage } from './pages/AdminPhotosPage';

export function App() {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
        {/* Navigation Header */}
        <Navbar onOpenSearch={() => setSearchModalOpen(true)} />

        {/* Global Search Dialog */}
        <GlobalSearchModal
          isOpen={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
        />

        {/* Main Content View */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/courses" element={<CourseExplorerPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/faculty" element={<FacultyExplorerPage />} />
            <Route path="/faculty/:employeeId" element={<FacultyProfilePage />} />
            <Route path="/identify" element={<Navigate to="/faculty" replace />} />
            <Route path="/plan" element={<RegistrationPlanPage />} />
            <Route path="/registration-day" element={<RegistrationDayPage />} />
            <Route path="/admin/import" element={<AdminImportPage />} />
            <Route path="/admin/faculty-photos" element={<AdminPhotosPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Minimal Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 no-print">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              <strong className="text-slate-800">FacultyLens</strong> — Smart Faculty Selection & Registration Planning
            </p>
            <p className="text-slate-400">
              Department of Computer Science & Engineering • KLH Bachupally
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
