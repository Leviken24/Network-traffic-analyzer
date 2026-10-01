import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listJobs } from '../api/client';
import {
  ArrowUpTrayIcon,
  ChartBarIcon,
  ScaleIcon,
  ClockIcon,
  ArrowRightIcon,
  CircleStackIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await listJobs();
        setJobs(data || []);
      } catch (err) {
        console.error("Failed to fetch jobs in dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const doneJobs = jobs.filter(j => j.status === 'DONE');
  const totalPackets = doneJobs.reduce((acc, j) => acc + (j.total_packets || 0), 0);
  const totalFlows = doneJobs.reduce((acc, j) => acc + (j.total_flows || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DONE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">Processing</span>;
      case 'FAILED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">Failed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">Pending</span>;
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pipelineStages = [
    { title: "Telemetry", desc: "Raw PCAP & CSV capture" },
    { title: "Preprocessing", desc: "Timestamp normalization" },
    { title: "Feature Extraction", desc: "Bidirectional flow metrics" },
    { title: "Network State", desc: "Windowed state vector" },
    { title: "Temporal Model", desc: "Recurrent sequence tracking" },
    { title: "Future-State Forecast", desc: "K-step latent projection" },
    { title: "Attack Stage", desc: "MITRE kill-chain mapping" },
    { title: "Decision Support", desc: "Actionable defense playbook" }
  ];

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3D56] tracking-tight">
            NETFLOW
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Predictive network security through temporal traffic analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0F3D56] text-white text-xs font-medium hover:bg-[#164967] transition-colors"
          >
            <ArrowUpTrayIcon className="w-4 h-4 text-[#0EA5A8]" />
            Upload Telemetry
          </Link>
          {doneJobs.length > 0 && (
            <Link
              to={`/jobs/${doneJobs[0].id}/predict`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              <ArrowTrendingUpIcon className="w-4 h-4 text-[#0EA5A8]" />
              View Latest Forecast
            </Link>
          )}
          {doneJobs.length > 0 && (
            <Link
              to={`/jobs/${doneJobs[0].id}/benchmark`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              <ScaleIcon className="w-4 h-4 text-slate-500" />
              View Benchmark
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="card p-5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Telemetry Files
          </div>
          <div className="text-2xl font-bold text-[#0F3D56] mt-2">
            {jobs.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {doneJobs.length} processed sessions
          </div>
        </div>

        {/* Card 2 */}
        <div className="card p-5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Packets Analyzed
          </div>
          <div className="text-2xl font-bold text-[#0F3D56] mt-2">
            {totalPackets > 0 ? totalPackets.toLocaleString() : '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across processed telemetry
          </div>
        </div>

        {/* Card 3 */}
        <div className="card p-5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Active Flow Sessions
          </div>
          <div className="text-2xl font-bold text-[#0F3D56] mt-2">
            {totalFlows > 0 ? totalFlows.toLocaleString() : '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            5-tuple bidirectional flows
          </div>
        </div>

        {/* Card 4 */}
        <div className="card p-5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            World Model
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Operational
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Temporal prediction engine
          </div>
        </div>
      </div>

      {/* Predictive Defence Pipeline */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#0F3D56] uppercase tracking-wider">
              Predictive Defence Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous state aggregation and sequential transition modeling
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {pipelineStages.map((stage, idx) => (
            <div key={idx} className="bg-white border border-slate-200 border-t-2 border-t-[#0EA5A8] rounded p-3 relative flex flex-col justify-between shadow-xs">
              <div>
                <div className="text-[10px] font-mono text-[#0EA5A8] font-semibold mb-1">0{idx + 1}</div>
                <div className="text-xs font-semibold text-[#0F3D56] leading-tight mb-1">{stage.title}</div>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 leading-tight">{stage.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Telemetry Table */}
      <div className="card p-5">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#0F3D56] uppercase tracking-wider">
              Recent Telemetry Jobs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingested traffic captures and active temporal timelines
            </p>
          </div>
          <Link
            to="/jobs"
            className="text-xs font-medium text-[#0EA5A8] hover:text-[#0F766E] flex items-center gap-1"
          >
            All Jobs <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading telemetry data...</div>
        ) : jobs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No telemetry jobs recorded yet.
            <div className="mt-2">
              <Link to="/upload" className="text-xs font-semibold text-[#0EA5A8] hover:underline">
                Upload a capture file to begin
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead>
                <tr className="text-left text-slate-500 font-medium">
                  <th className="py-2.5 px-3">Job ID</th>
                  <th className="py-2.5 px-3">File</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Window</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.slice(0, 6).map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {job.id.substring(0, 8)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#0F3D56]">
                      {job.filename}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {job.window_seconds}s
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {formatBytes(job.file_size)}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      {job.status === 'DONE' ? (
                        <>
                          <Link
                            to={`/jobs/${job.id}/timeline`}
                            className="inline-block px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/predict`}
                            className="inline-block px-2 py-1 rounded bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] font-medium border border-[#99F6E4] transition-colors"
                          >
                            Forecast
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/benchmark`}
                            className="inline-block px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                          >
                            Benchmark
                          </Link>
                        </>
                      ) : (
                        <span className="text-slate-400">Processing...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
