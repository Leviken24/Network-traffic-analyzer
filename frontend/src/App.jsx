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
    <div className="relative min-h-screen bg-[#03040a] text-cyan-50 flex flex-col overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="
            absolute -top-40 -left-40
            w-[500px] h-[500px]
            rounded-full
            bg-cyan-400/15
            blur-[130px]
            animate-pulse
          "
        />
        <div
          className="
            absolute top-1/3 -right-40
            w-[500px] h-[500px]
            rounded-full
            bg-fuchsia-500/15
            blur-[130px]
            animate-pulse
          "
        />
        <div
          className="
            absolute -bottom-40 left-1/3
            w-[600px] h-[400px]
            rounded-full
            bg-purple-500/15
            blur-[140px]
            animate-pulse
          "
        />
      </div>

      <div className="relative z-10">
        <NavBar />
      </div>

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <p className="text-xs font-mono text-cyan-300">Loading module...</p>
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
