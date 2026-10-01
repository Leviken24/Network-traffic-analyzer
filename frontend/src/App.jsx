import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Upload = lazy(() => import('./pages/Upload'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Timeline = lazy(() => import('./pages/Timeline'));
const StateDetail = lazy(() => import('./pages/StateDetail'));
const Prediction = lazy(() => import('./pages/Prediction'));
const Benchmark = lazy(() => import('./pages/Benchmark'));

export default function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col antialiased selection:bg-[#C9A227]/30 selection:text-white">
      <NavBar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center h-72 gap-3 text-[#A1A1A1]">
            <div className="animate-spin rounded-full h-7 w-7 border border-[rgba(255,255,255,0.1)] border-t-[#C9A227]"></div>
            <span className="text-[11px] font-mono tracking-wider text-[#666666] uppercase">Initializing Session</span>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:jobId/timeline" element={<Timeline />} />
            <Route path="/states/:stateId" element={<StateDetail />} />
            <Route path="/predict" element={<Prediction />} />
            <Route path="/jobs/:jobId/predict" element={<Prediction />} />
            <Route path="/benchmark" element={<Benchmark />} />
            <Route path="/jobs/:jobId/benchmark" element={<Benchmark />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
