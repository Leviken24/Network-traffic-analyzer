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
        return <span className="inline-flex items-center gap-1.5 text-xs text-[#22C55E] font-mono"><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>Completed</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center gap-1.5 text-xs text-[#F59E0B] font-mono animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>Processing</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1.5 text-xs text-[#EF4444] font-mono"><span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>Failed</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 text-xs text-[#71717A] font-mono">Pending</span>;
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#242943] pb-5">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-[#6366F1] uppercase mb-1">
            System Threat Posture
          </div>
          <h1 className="text-2xl font-light text-[#F8FAFC] tracking-tight">
            Network Operations & Predictive Intelligence
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Autonomous multi-step attack trajectory forecasting through continuous temporal traffic analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[#0F1220] border border-[#6366F1]/50 text-[#F8FAFC] text-xs font-medium hover:border-[#818CF8] hover:bg-[#14182A] transition-all"
          >
            <ArrowUpTrayIcon className="w-3.5 h-3.5 text-[#818CF8]" />
            Import Telemetry
          </Link>
          {latestJob && (
            <Link
              to={`/jobs/${latestJob.id}/predict`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[#14182A] border border-[#242943] text-[#F8FAFC] text-xs font-medium hover:border-[#818CF8]/50 hover:text-[#818CF8] transition-all"
            >
              <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-[#A1A1AA]" />
              View Forecast
            </Link>
          )}
          {latestJob && (
            <Link
              to={`/jobs/${latestJob.id}/benchmark`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[#14182A] border border-[#242943] text-[#A1A1AA] text-xs font-medium hover:text-[#F8FAFC] hover:border-[#818CF8]/50 transition-all"
            >
              <ScaleIcon className="w-3.5 h-3.5 text-[#71717A]" />
              Benchmark
            </Link>
          )}
        </div>
      </div>

      {/* Core Metrics Strip: Integrated into page with thin dividers instead of repetitive boxed cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2 border-b border-[#242943]">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-[#71717A] uppercase">
            Predictive Model Engine
          </div>
          <div className="text-lg font-normal text-[#F8FAFC] mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
            Operational
          </div>
          <div className="text-[11px] text-[#A1A1AA] mt-0.5 font-mono">
            Sequential GRU &bull; Local Latent Space
          </div>
        </div>

        <div className="border-l border-[#242943] pl-6">
          <div className="text-[10px] font-mono tracking-wider text-[#71717A] uppercase">
            Ingested Datasets
          </div>
          <div className="text-lg font-normal text-[#F8FAFC] mt-1">
            {jobs.length} <span className="text-xs text-[#71717A] font-normal">Captures</span>
          </div>
          <div className="text-[11px] text-[#A1A1AA] mt-0.5">
            {doneJobs.length} processed sessions
          </div>
        </div>

        <div className="border-l border-[#242943] pl-6">
          <div className="text-[10px] font-mono tracking-wider text-[#71717A] uppercase">
            Analyzed Packets
          </div>
          <div className="text-lg font-normal text-[#F8FAFC] mt-1 font-mono">
            {totalPackets > 0 ? totalPackets.toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-[#A1A1AA] mt-0.5">
            Normalized temporal windows
          </div>
        </div>

        <div className="border-l border-[#242943] pl-6">
          <div className="text-[10px] font-mono tracking-wider text-[#71717A] uppercase">
            Active Flow Sessions
          </div>
          <div className="text-lg font-normal text-[#F8FAFC] mt-1 font-mono">
            {totalFlows > 0 ? totalFlows.toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-[#A1A1AA] mt-0.5">
            Bidirectional state matrices
          </div>
        </div>
      </div>

      {/* Main Analysis Architecture: Pipeline + Threat Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono tracking-wider text-[#A1A1AA] uppercase">
            Continuous Defence Pipeline
          </h2>
          <span className="text-[11px] text-[#71717A]">
            Real-time state trajectory mapping
          </span>
        </div>

        {/* Refined Horizontal Pipeline Track */}
        <div className="glass-panel p-4 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[720px] gap-2">
            {pipelineStages.map((stage, idx) => (
              <React.Fragment key={stage.num}>
                <div className="flex-1">
                  <div className="text-[10px] font-mono text-[#6366F1]">{stage.num}</div>
                  <div className="text-xs font-medium text-[#F8FAFC] mt-0.5">{stage.name}</div>
                  <div className="text-[10px] text-[#71717A] mt-0.5">{stage.desc}</div>
                </div>
                {idx < pipelineStages.length - 1 && (
                  <div className="text-[#71717A] text-xs px-1 select-none font-mono">&rarr;</div>
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
            <h2 className="text-xs font-mono tracking-wider text-[#A1A1AA] uppercase">
              Telemetry Ingestion Ledger
            </h2>
            <p className="text-[11px] text-[#71717A] mt-0.5">
              Processed network traffic sessions and discrete time window series
            </p>
          </div>
          <Link
            to="/jobs"
            className="text-xs text-[#818CF8] hover:text-[#6366F1] flex items-center gap-1 font-medium transition-colors"
          >
            All Sessions <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="glass-panel p-10 text-center text-xs text-[#71717A]">
            Loading active telemetry ledger...
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass-panel p-12 text-center text-xs text-[#71717A]">
            No network captures registered.
            <div className="mt-2">
              <Link to="/upload" className="text-xs text-[#818CF8] hover:underline">
                Upload a capture file to initialize forecasting
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass-panel overflow-x-auto">
            <table className="min-w-full divide-y divide-[#242943] text-xs">
              <thead>
                <tr className="text-left text-[#71717A] font-mono text-[11px]">
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
              <tbody className="divide-y divide-[#242943]/60">
                {jobs.slice(0, 6).map((job) => (
                  <tr key={job.id} className="hover:bg-[#14182A]/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#71717A]">
                      {job.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#F8FAFC]">
                      {job.filename}
                    </td>
                    <td className="py-3 px-4 text-[#A1A1AA] font-mono text-[11px]">
                      {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="py-3 px-4 text-[#A1A1AA] font-mono">
                      {job.window_seconds}s
                    </td>
                    <td className="py-3 px-4 text-[#A1A1AA] font-mono">
                      {job.total_flows ? job.total_flows.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-[#71717A] font-mono">
                      {formatBytes(job.file_size)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {job.status === 'DONE' ? (
                        <>
                          <Link
                            to={`/jobs/${job.id}/timeline`}
                            className="inline-block px-2.5 py-1 text-xs rounded-sm bg-[#14182A] hover:bg-[#14182A]/80 text-[#A1A1AA] hover:text-[#F8FAFC] border border-[#242943] hover:border-[#818CF8]/50 transition-all font-mono"
                          >
                            Timeline
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/predict`}
                            className="inline-block px-2.5 py-1 text-xs rounded-sm bg-[#6366F1]/10 hover:bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30 transition-all font-mono font-medium"
                          >
                            Forecast
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/benchmark`}
                            className="inline-block px-2.5 py-1 text-xs rounded-sm bg-[#14182A] hover:bg-[#14182A]/80 text-[#A1A1AA] hover:text-[#F8FAFC] border border-[#242943] hover:border-[#818CF8]/50 transition-all font-mono"
                          >
                            Benchmark
                          </Link>
                        </>
                      ) : (
                        <span className="text-[#71717A] text-xs font-mono">Processing...</span>
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
