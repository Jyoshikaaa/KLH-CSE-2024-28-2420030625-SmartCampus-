import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { getRegistrationPlan } from '../api/client';
import type { RegistrationPlanDetail } from '../types';

interface NavbarProps {
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch }) => {
  const [plan, setPlan] = useState<RegistrationPlanDetail | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const fetchPlanCount = async () => {
    try {
      const data = await getRegistrationPlan();
      setPlan(data);
    } catch (err) {
      // plan not ready yet
    }
  };

  useEffect(() => {
    fetchPlanCount();
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Global Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  const navLinks = [
    { to: '/faculty', label: 'All Faculty', icon: Users },
    { to: '/courses', label: 'Explore Courses', icon: BookOpen },
    { to: '/plan', label: 'My Plan', icon: CheckCircle2 },
    { to: '/registration-day', label: 'Registration Mode', icon: Calendar },
  ];

  const planCount = plan?.total_courses_planned || 0;

  return (
    <header className="sticky top-0 z-40 bg-[#F5F6F8]/80 backdrop-blur-xl border-b border-slate-200/80 no-print transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Subtitle */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xs border border-slate-800 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight block leading-tight">
                FacultyLens
              </span>
              <span className="text-[11px] font-medium text-slate-400 tracking-wide block">
                Smart Registration Planning
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Only 4 Items) */}
          <nav className="hidden md:flex items-center gap-1 bg-white/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-2xs">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Bar: Search Pill + Plan Pill */}
          <div className="flex items-center gap-2.5">
            {/* Direct Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 text-xs font-medium transition border border-slate-200/80 shadow-2xs"
              title="Search faculty by name or EMP ID (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline font-normal text-slate-400">Search faculty...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-100 text-[10px] text-slate-500 font-mono rounded-md border border-slate-200/70">
                ⌘K
              </kbd>
            </button>

            {/* Compact Plan Pill */}
            <Link
              to="/plan"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Plan</span>
              <span className="px-1.5 py-0.2 bg-slate-700 text-slate-100 text-[11px] font-mono rounded-full font-extrabold">
                {planCount}
              </span>
            </Link>

            {/* Mobile Drawer Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 md:hidden rounded-xl hover:bg-slate-200/60 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-1.5 animate-in slide-in-from-top-2 duration-150 shadow-xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
};
