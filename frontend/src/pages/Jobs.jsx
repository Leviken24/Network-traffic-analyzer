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
        return <span className="inline-flex items-center gap-1.5 text-xs text-[#22C55E] font-mono"><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>Completed</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center gap-1.5 text-xs text-[#F59E0B] font-mono animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>Processing</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1.5 text-xs text-[#EF4444] font-mono"><span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>Failed</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 text-xs text-[#71717A] font-mono">Pending</span>;
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#242943] pb-4">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-[#6366F1] uppercase mb-1">
            Telemetry Registry
          </div>
          <h1 className="text-xl font-light text-[#F8FAFC] tracking-tight">
            Jobs & Temporal Timelines
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Historical packet capture records, extracted flow sessions, and sequential model states.
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#0F1220] border border-[#6366F1]/50 text-[#F8FAFC] text-xs font-medium hover:border-[#818CF8] hover:bg-[#14182A] transition-all self-start sm:self-auto"
        >
          <ArrowUpTrayIcon className="w-3.5 h-3.5 text-[#818CF8]" />
          Import Telemetry
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="glass-panel overflow-hidden">
        {loading && jobs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#71717A] font-mono">
            Loading registry entries...
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#71717A]">
            No telemetry jobs found. Import a capture to begin analysis.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#242943] text-xs">
              <thead>
                <tr className="text-left text-[#71717A] font-mono text-[11px]">
                  <th scope="col" className="py-3 px-4">Job ID</th>
                  <th scope="col" className="py-3 px-4">Source Telemetry</th>
                  <th scope="col" className="py-3 px-4">Ingested At</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4">Flows</th>
                  <th scope="col" className="py-3 px-4">Risk</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242943]/60">
                {jobs.map((job) => (
                  <tr 
                    key={job.id} 
                    className="hover:bg-[#14182A]/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-[#71717A]">
                      {job.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#F8FAFC]">
                      {job.filename}
                      <span className="text-[#71717A] font-mono text-[11px] ml-2">({formatSize(job.file_size)})</span>
                    </td>
                    <td className="py-3 px-4 text-[#A1A1AA] font-mono text-[11px]">
                      {new Date(job.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="py-3 px-4 text-[#A1A1AA] font-mono">
                      {job.total_flows ? job.total_flows.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {job.status === 'DONE' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#F8FAFC] font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></span>
                          Monitored
                        </span>
                      ) : (
                        <span className="text-[#71717A] font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {job.status === 'DONE' ? (
                        <>
                          <Link
                            to={`/jobs/${job.id}/timeline`}
                            className="inline-block px-2.5 py-1 rounded-sm bg-[#14182A] hover:bg-[#14182A]/80 text-[#A1A1AA] hover:text-[#F8FAFC] border border-[#242943] hover:border-[#818CF8]/50 transition-all font-mono text-[11px]"
                          >
                            Timeline
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/predict`}
                            className="inline-block px-2.5 py-1 rounded-sm bg-[#6366F1]/10 hover:bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30 font-medium transition-all font-mono text-[11px]"
                          >
                            Forecast
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/benchmark`}
                            className="inline-block px-2.5 py-1 rounded-sm bg-[#14182A] hover:bg-[#14182A]/80 text-[#A1A1AA] hover:text-[#F8FAFC] border border-[#242943] hover:border-[#818CF8]/50 transition-all font-mono text-[11px]"
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
