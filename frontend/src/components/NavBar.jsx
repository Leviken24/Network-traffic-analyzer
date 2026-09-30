import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldExclamationIcon, SparklesIcon, ScaleIcon, CloudArrowUpIcon, TableCellsIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function NavBar() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: HomeIcon },
    { label: 'Upload Telemetry', path: '/upload', icon: CloudArrowUpIcon },
    { label: 'Jobs & Timelines', path: '/jobs', icon: TableCellsIcon },
    { label: 'Attack Forecasting', path: '/predict', icon: SparklesIcon },
    { label: 'Model Benchmark', path: '/benchmark', icon: ScaleIcon },
  ];

  return (
    <nav className="glass sticky top-0 z-50 border-b border-cyan-500/20 backdrop-blur-xl bg-black/60 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(0,245,255,0.4)] group-hover:scale-105 transition-transform">
                ⚡
              </div>
              <div>
                <span className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-pink-400">
                  SIH NetFlow
                </span>
                <span className="block text-[9px] uppercase tracking-widest font-mono text-cyan-400/80 -mt-1">
                  World Model Cyber Defence
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      active
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,245,255,0.25)]'
                        : 'text-gray-400 hover:text-cyan-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Status Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>K-Step World Model v2.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav Row */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-gray-800/80 gap-2 bg-black/80">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`whitespace-nowrap px-3 py-1 rounded text-xs font-semibold ${
                active
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
