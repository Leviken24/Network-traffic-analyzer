import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listJobs } from '../api/client';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await listJobs();
        setJobs(data || []);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 4000);
    return () => clearInterval(interval);
  }, []);

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

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-[#C9A227] uppercase mb-1">
            Telemetry Registry
          </div>
          <h1 className="text-xl font-light text-[#F5F5F5] tracking-tight">
            Jobs & Temporal Timelines
          </h1>
          <p className="text-xs text-[#A1A1A1] mt-0.5">
            Historical packet capture records, extracted flow sessions, and sequential model states.
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#121212] border border-[#C9A227]/50 text-[#F5F5F5] text-xs font-medium hover:border-[#C9A227] hover:bg-[#181818] transition-all self-start sm:self-auto"
        >
          <ArrowUpTrayIcon className="w-3.5 h-3.5 text-[#C9A227]" />
          Import Telemetry
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="glass-panel overflow-hidden">
        {loading && jobs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#666666] font-mono">
            Loading registry entries...
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#666666]">
            No telemetry jobs found. Import a capture to begin analysis.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgba(255,255,255,0.06)] text-xs">
              <thead>
                <tr className="text-left text-[#666666] font-mono text-[11px]">
                  <th scope="col" className="py-3 px-4">Job ID</th>
                  <th scope="col" className="py-3 px-4">Source Telemetry</th>
                  <th scope="col" className="py-3 px-4">Ingested At</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4">Flows</th>
                  <th scope="col" className="py-3 px-4">Risk</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {jobs.map((job) => (
                  <tr 
                    key={job.id} 
                    className="hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-[#666666]">
                      {job.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#F5F5F5]">
                      {job.filename}
                      <span className="text-[#666666] font-mono text-[11px] ml-2">({formatSize(job.file_size)})</span>
                    </td>
                    <td className="py-3 px-4 text-[#A1A1A1] font-mono text-[11px]">
                      {new Date(job.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="py-3 px-4 text-[#A1A1A1] font-mono">
                      {job.total_flows ? job.total_flows.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {job.status === 'DONE' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#F5F5F5] font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]"></span>
                          Monitored
                        </span>
                      ) : (
                        <span className="text-[#666666] font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {job.status === 'DONE' ? (
                        <>
                          <Link
                            to={`/jobs/${job.id}/timeline`}
                            className="inline-block px-2.5 py-1 rounded-sm bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#A1A1A1] hover:text-[#F5F5F5] border border-[rgba(255,255,255,0.08)] transition-all font-mono text-[11px]"
                          >
                            Timeline
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/predict`}
                            className="inline-block px-2.5 py-1 rounded-sm bg-[#C9A227]/10 hover:bg-[#C9A227]/20 text-[#E0B83F] border border-[#C9A227]/30 font-medium transition-all font-mono text-[11px]"
                          >
                            Forecast
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/benchmark`}
                            className="inline-block px-2.5 py-1 rounded-sm bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#A1A1A1] hover:text-[#F5F5F5] border border-[rgba(255,255,255,0.08)] transition-all font-mono text-[11px]"
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
