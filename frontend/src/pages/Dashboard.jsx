import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listJobs } from '../api/client';
import {
  CloudArrowUpIcon, SparklesIcon, ScaleIcon, ClockIcon,
  ShieldExclamationIcon, ShieldCheckIcon, CpuChipIcon, ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    const interval = setInterval(fetchJobs, 4000);
    return () => clearInterval(interval);
  }, []);

  const doneJobs = jobs.filter(j => j.status === 'DONE');
  const totalPackets = doneJobs.reduce((acc, j) => acc + (j.total_packets || 0), 0);
  const totalFlows = doneJobs.reduce((acc, j) => acc + (j.total_flows || 0), 0);

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      PROCESSING: 'bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse',
      DONE: 'bg-green-500/20 text-green-300 border-green-500/30',
      FAILED: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    const style = styles[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${style}`}>
        {status}
      </span>
    );
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome */}
      <div className="card p-8 border border-cyan-500/30 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            SIH Problem Statement SIH26153 · Active Prototype
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 mb-3">
            Predictive Cyber Defence Command Center
          </h1>
          <p className="text-gray-300 text-base leading-relaxed mb-6">
            End-to-end AI-powered network attack forecasting: ingest PCAP/CSV traffic, extract bidirectional flows, aggregate time-windowed network states, and forecast multi-step attack progression with MITRE ATT&CK stage mapping.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-black font-bold text-sm shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:bg-cyan-400 transition-all"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              Upload Telemetry File
            </Link>
            {doneJobs.length > 0 && (
              <Link
                to={`/jobs/${doneJobs[0].id}/predict`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600/30 border border-purple-500 text-purple-200 font-bold text-sm hover:bg-purple-600/50 transition-all"
              >
                <SparklesIcon className="w-5 h-5 text-purple-400" />
                Latest Attack Forecast
              </Link>
            )}
            {doneJobs.length > 0 && (
              <Link
                to={`/jobs/${doneJobs[0].id}/benchmark`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black/40 border border-gray-700 text-gray-200 font-bold text-sm hover:bg-black/60 transition-all"
              >
                <ScaleIcon className="w-5 h-5 text-gray-400" />
                Benchmark Models
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border border-cyan-500/20">
          <div className="text-xs uppercase tracking-wider font-semibold text-gray-400">Total Telemetry Files</div>
          <div className="text-3xl font-extrabold text-cyan-400 mt-2">{jobs.length}</div>
          <div className="text-xs text-gray-500 mt-1">{doneJobs.length} successfully processed</div>
        </div>

        <div className="card p-5 border border-purple-500/20">
          <div className="text-xs uppercase tracking-wider font-semibold text-gray-400">Total Packets Analyzed</div>
          <div className="text-3xl font-extrabold text-purple-400 mt-2">
            {totalPackets > 0 ? totalPackets.toLocaleString() : 'Telemetry ready'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Multi-protocol deep inspection</div>
        </div>

        <div className="card p-5 border border-pink-500/20">
          <div className="text-xs uppercase tracking-wider font-semibold text-gray-400">Active Flow Sessions</div>
          <div className="text-3xl font-extrabold text-pink-400 mt-2">
            {totalFlows > 0 ? totalFlows.toLocaleString() : 'Flow tracking'}
          </div>
          <div className="text-xs text-gray-500 mt-1">5-tuple bidirectional flows</div>
        </div>

        <div className="card p-5 border border-green-500/20">
          <div className="text-xs uppercase tracking-wider font-semibold text-gray-400">World Model Status</div>
          <div className="text-3xl font-extrabold text-green-400 mt-2">OPERATIONAL</div>
          <div className="text-xs text-gray-500 mt-1">Temporal GRU recurrent engine</div>
        </div>
      </div>

      {/* Pipeline Architecture Stage Strip */}
      <div className="card p-6 border border-cyan-500/30">
        <h3 className="text-lg font-bold text-cyan-100 mb-4 flex items-center gap-2">
          <CpuChipIcon className="w-5 h-5 text-cyan-400" />
          End-to-End Predictive Defence Pipeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/30">
            <div className="font-mono text-cyan-400 font-bold mb-1">01 · INGESTION</div>
            <div className="font-bold text-sm text-gray-200 mb-1">PCAP & CSV Parsing</div>
            <p className="text-gray-400">Streaming packet extraction, timestamp normalization, and multi-protocol parsing.</p>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-purple-500/30">
            <div className="font-mono text-purple-400 font-bold mb-1">02 · FLOW AGGREGATION</div>
            <div className="font-bold text-sm text-gray-200 mb-1">Time Windowing & Entropy</div>
            <p className="text-gray-400">Shannon entropy on IP/ports, TCP flag rates, bidirectional volume asymmetry.</p>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-pink-500/30">
            <div className="font-mono text-pink-400 font-bold mb-1">03 · WORLD MODEL</div>
            <div className="font-bold text-sm text-gray-200 mb-1">Temporal Hidden State</div>
            <p className="text-gray-400">Recurrent momentum projection predicting K future states [t+1 … t+K].</p>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-green-500/30">
            <div className="font-mono text-green-400 font-bold mb-1">04 · DEFENSIVE RESPONSE</div>
            <div className="font-bold text-sm text-gray-200 mb-1">MITRE Stage & Playbook</div>
            <p className="text-gray-400">Classification into 5 MITRE stages with feature attribution and actionable mitigation.</p>
          </div>
        </div>
      </div>

      {/* Recent Jobs Table */}
      <div className="card p-6 border border-cyan-500/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-cyan-100 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-cyan-400" />
            Recent Telemetry Jobs
          </h3>
          <Link
            to="/jobs"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            View All Jobs <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="py-8 text-center text-gray-400">Loading telemetry jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-300 mb-3">No telemetry data ingested yet.</p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30"
            >
              Upload First PCAP / CSV
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-400 text-left">
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Window</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {jobs.slice(0, 5).map(job => (
                  <tr key={job.id} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-cyan-200">
                      {job.filename}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {job.window_seconds}s
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {formatBytes(job.file_size)}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {job.status === 'DONE' ? (
                        <>
                          <Link
                            to={`/jobs/${job.id}/predict`}
                            className="inline-block px-2.5 py-1 text-xs rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 font-semibold"
                          >
                            Forecast 🔮
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/timeline`}
                            className="inline-block px-2.5 py-1 text-xs rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-semibold"
                          >
                            Timeline ⏱️
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/benchmark`}
                            className="inline-block px-2.5 py-1 text-xs rounded bg-gray-700/40 text-gray-300 border border-gray-600 hover:bg-gray-700/60 font-semibold"
                          >
                            Benchmark ⚔️
                          </Link>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">Processing...</span>
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
