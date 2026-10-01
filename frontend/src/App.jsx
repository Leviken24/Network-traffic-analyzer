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
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col antialiased">
      <NavBar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-[#0F3D56]"></div>
            <span className="text-xs font-medium">Loading view...</span>
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
