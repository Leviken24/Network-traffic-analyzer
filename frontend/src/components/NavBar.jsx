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
    <header className="bg-[#06070D]/90 backdrop-blur-md border-b border-[#242943] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-5 h-5 rounded-sm bg-[#0F1220] border border-[#242943] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></span>
              </div>
              <span className="font-semibold text-sm tracking-[0.18em] text-[#F8FAFC] uppercase">
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
                    className={`relative px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'text-[#F8FAFC]'
                        : 'text-[#A1A1AA] hover:text-[#818CF8]'
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-[1.5px] bg-[#6366F1] rounded-full"></span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Area */}
          <div className="flex items-center gap-3 text-xs text-[#71717A]">
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#71717A]">
              SOC Node &bull; Ready
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-[#242943] gap-2 bg-[#0B0D16]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`whitespace-nowrap px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'text-[#F8FAFC] border-b border-[#6366F1]'
                  : 'text-[#A1A1AA] hover:text-[#818CF8]'
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
