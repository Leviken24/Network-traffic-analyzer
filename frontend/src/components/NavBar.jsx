import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Telemetry', path: '/upload' },
    { label: 'Jobs & Timelines', path: '/jobs' },
    { label: 'Attack Forecasting', path: '/predict' },
    { label: 'Model Benchmark', path: '/benchmark' },
  ];

  return (
    <header className="bg-[#0B0D16] border-b border-[#242943] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded bg-[#14182A] border border-[#242943] flex items-center justify-center text-white">
                <svg className="w-4 h-4 text-[#6366F1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="18" r="3" />
                  <line x1="9" y1="6" x2="15" y2="6" />
                  <line x1="9" y1="18" x2="15" y2="18" />
                  <line x1="6" y1="9" x2="6" y2="15" />
                  <line x1="18" y1="9" x2="18" y2="15" />
                </svg>
              </div>
              <span className="font-bold text-base tracking-wide text-[#F8FAFC]">
                NETFLOW
              </span>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#14182A] text-[#818CF8] font-semibold border border-[#242943]'
                        : 'text-[#A1A1AA] hover:text-[#F8FAFC] hover:bg-[#14182A]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Area */}
          <div className="flex items-center gap-3 text-xs text-[#71717A]">
            <span className="text-xs text-[#71717A] font-mono">SOC Engine</span>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-[#242943] gap-1 bg-[#0B0D16]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`whitespace-nowrap px-2.5 py-1 rounded text-xs font-medium ${
                active
                  ? 'bg-[#14182A] text-[#818CF8] font-semibold border border-[#242943]'
                  : 'text-[#A1A1AA] hover:text-[#F8FAFC]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
