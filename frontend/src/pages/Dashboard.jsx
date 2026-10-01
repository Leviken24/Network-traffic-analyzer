import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listJobs } from '../api/client';
import {
  ArrowUpTrayIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  ScaleIcon
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
  const latestJob = doneJobs.length > 0 ? doneJobs[0] : null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DONE':
        return <span className="inline-flex items-center gap-1.5 text-xs text-[#4CAF7A] font-mono"><span className="w-1.5 h-1.5 rounded-full bg-[#4CAF7A]"></span>Completed</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center gap-1.5 text-xs text-[#C9A227] font-mono animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]"></span>Processing</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1.5 text-xs text-[#D64545] font-mono"><span className="w-1.5 h-1.5 rounded-full bg-[#D64545]"></span>Failed</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 text-xs text-[#666666] font-mono">Pending</span>;
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
    { num: "01", name: "Telemetry", desc: "PCAP/CSV Ingestion" },
    { num: "02", name: "Preprocessing", desc: "Normalization" },
    { num: "03", name: "Feature Extraction", desc: "Flow Metrics" },
    { num: "04", name: "Network State", desc: "Vector Window" },
    { num: "05", name: "Temporal Model", desc: "GRU Latent Space" },
    { num: "06", name: "Forecast", desc: "K-Step Projection" },
    { num: "07", name: "Attack Stage", desc: "MITRE Mapping" },
    { num: "08", name: "Decision Support", desc: "Defense Playbook" }
  ];

  return (
    <div className="space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-5">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-[#C9A227] uppercase mb-1">
            System Threat Posture
          </div>
          <h1 className="text-2xl font-light text-[#F5F5F5] tracking-tight">
            Network Operations & Predictive Intelligence
          </h1>
          <p className="text-xs text-[#A1A1A1] mt-1">
            Autonomous multi-step attack trajectory forecasting through continuous temporal traffic analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[#121212] border border-[#C9A227]/50 text-[#F5F5F5] text-xs font-medium hover:border-[#C9A227] hover:bg-[#181818] transition-all"
          >
            <ArrowUpTrayIcon className="w-3.5 h-3.5 text-[#C9A227]" />
            Import Telemetry
          </Link>
          {latestJob && (
            <Link
              to={`/jobs/${latestJob.id}/predict`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#F5F5F5] text-xs font-medium hover:bg-[rgba(255,255,255,0.08)] transition-all"
            >
              <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-[#A1A1A1]" />
              View Forecast
            </Link>
          )}
          {latestJob && (
            <Link
              to={`/jobs/${latestJob.id}/benchmark`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#A1A1A1] text-xs font-medium hover:text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.08)] transition-all"
            >
              <ScaleIcon className="w-3.5 h-3.5 text-[#666666]" />
              Benchmark
            </Link>
          )}
        </div>
      </div>

      {/* Core Metrics Strip: Integrated into page with thin dividers instead of repetitive boxed cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-[#666666] uppercase">
            Predictive Model Engine
          </div>
          <div className="text-lg font-normal text-[#F5F5F5] mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4CAF7A]"></span>
            Operational
          </div>
          <div className="text-[11px] text-[#A1A1A1] mt-0.5 font-mono">
            Sequential GRU &bull; Local Latent Space
          </div>
        </div>

        <div className="border-l border-[rgba(255,255,255,0.06)] pl-6">
          <div className="text-[10px] font-mono tracking-wider text-[#666666] uppercase">
            Ingested Datasets
          </div>
          <div className="text-lg font-normal text-[#F5F5F5] mt-1">
            {jobs.length} <span className="text-xs text-[#666666] font-normal">Captures</span>
          </div>
          <div className="text-[11px] text-[#A1A1A1] mt-0.5">
            {doneJobs.length} processed sessions
          </div>
        </div>

        <div className="border-l border-[rgba(255,255,255,0.06)] pl-6">
          <div className="text-[10px] font-mono tracking-wider text-[#666666] uppercase">
            Analyzed Packets
          </div>
          <div className="text-lg font-normal text-[#F5F5F5] mt-1 font-mono">
            {totalPackets > 0 ? totalPackets.toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-[#A1A1A1] mt-0.5">
            Normalized temporal windows
          </div>
        </div>

        <div className="border-l border-[rgba(255,255,255,0.06)] pl-6">
          <div className="text-[10px] font-mono tracking-wider text-[#666666] uppercase">
            Active Flow Sessions
          </div>
          <div className="text-lg font-normal text-[#F5F5F5] mt-1 font-mono">
            {totalFlows > 0 ? totalFlows.toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-[#A1A1A1] mt-0.5">
            Bidirectional state matrices
          </div>
        </div>
      </div>

      {/* Main Analysis Architecture: Pipeline + Threat Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono tracking-wider text-[#A1A1A1] uppercase">
            Continuous Defence Pipeline
          </h2>
          <span className="text-[11px] text-[#666666]">
            Real-time state trajectory mapping
          </span>
        </div>

        {/* Refined Horizontal Pipeline Track */}
        <div className="glass-panel p-4 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[720px] gap-2">
            {pipelineStages.map((stage, idx) => (
              <React.Fragment key={stage.num}>
                <div className="flex-1">
                  <div className="text-[10px] font-mono text-[#C9A227]">{stage.num}</div>
                  <div className="text-xs font-medium text-[#F5F5F5] mt-0.5">{stage.name}</div>
                  <div className="text-[10px] text-[#666666] mt-0.5">{stage.desc}</div>
                </div>
                {idx < pipelineStages.length - 1 && (
                  <div className="text-[#666666] text-xs px-1 select-none font-mono">&rarr;</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Telemetry & Threat Ingestion Ledger */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xs font-mono tracking-wider text-[#A1A1A1] uppercase">
              Telemetry Ingestion Ledger
            </h2>
            <p className="text-[11px] text-[#666666] mt-0.5">
              Processed network traffic sessions and discrete time window series
            </p>
          </div>
          <Link
            to="/jobs"
            className="text-xs text-[#C9A227] hover:text-[#E0B83F] flex items-center gap-1 font-medium transition-colors"
          >
            All Sessions <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="glass-panel p-10 text-center text-xs text-[#666666]">
            Loading active telemetry ledger...
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass-panel p-12 text-center text-xs text-[#666666]">
            No network captures registered.
            <div className="mt-2">
              <Link to="/upload" className="text-xs text-[#C9A227] hover:underline">
                Upload a capture file to initialize forecasting
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass-panel overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgba(255,255,255,0.06)] text-xs">
              <thead>
                <tr className="text-left text-[#666666] font-mono text-[11px]">
                  <th className="py-3 px-4">Session ID</th>
                  <th className="py-3 px-4">Source Telemetry</th>
                  <th className="py-3 px-4">Ingested At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Resolution</th>
                  <th className="py-3 px-4">Flows</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {jobs.slice(0, 6).map((job) => (
                  <tr key={job.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#666666]">
                      {job.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#F5F5F5]">
                      {job.filename}
                    </td>
                    <td className="py-3 px-4 text-[#A1A1A1] font-mono text-[11px]">
                      {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="py-3 px-4 text-[#A1A1A1] font-mono">
                      {job.window_seconds}s
                    </td>
                    <td className="py-3 px-4 text-[#A1A1A1] font-mono">
                      {job.total_flows ? job.total_flows.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-[#666666] font-mono">
                      {formatBytes(job.file_size)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {job.status === 'DONE' ? (
                        <>
                          <Link
                            to={`/jobs/${job.id}/timeline`}
                            className="inline-block px-2.5 py-1 text-xs rounded-sm bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#A1A1A1] hover:text-[#F5F5F5] border border-[rgba(255,255,255,0.08)] transition-all"
                          >
                            Timeline
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/predict`}
                            className="inline-block px-2.5 py-1 text-xs rounded-sm bg-[#C9A227]/10 hover:bg-[#C9A227]/20 text-[#E0B83F] border border-[#C9A227]/30 transition-all font-medium"
                          >
                            Forecast
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/benchmark`}
                            className="inline-block px-2.5 py-1 text-xs rounded-sm bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#A1A1A1] hover:text-[#F5F5F5] border border-[rgba(255,255,255,0.08)] transition-all"
                          >
                            Benchmark
                          </Link>
                        </>
                      ) : (
                        <span className="text-[#666666] text-xs font-mono">Processing...</span>
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
