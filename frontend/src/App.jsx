import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';

const Upload = lazy(() => import('./pages/Upload'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Timeline = lazy(() => import('./pages/Timeline'));
const StateDetail = lazy(() => import('./pages/StateDetail'));

export default function App() {
  return (
    <div className="relative min-h-screen bg-[#03040a] text-cyan-50 flex flex-col overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

                <div
                    className="
                        absolute -top-40 -left-40
                        w-[500px] h-[500px]
                        rounded-full
                        bg-cyan-400/20
                        blur-[120px]
                        animate-pulse
                    "
                />

                <div
                    className="
                        absolute top-1/3 -right-40
                        w-[500px] h-[500px]
                        rounded-full
                        bg-fuchsia-500/15
                        blur-[120px]
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
