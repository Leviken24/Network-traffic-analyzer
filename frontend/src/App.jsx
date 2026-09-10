import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';

const Upload = lazy(() => import('./pages/Upload'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Timeline = lazy(() => import('./pages/Timeline'));
const StateDetail = lazy(() => import('./pages/StateDetail'));

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Upload />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:jobId/timeline" element={<Timeline />} />
            <Route path="/states/:stateId" element={<StateDetail />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
