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
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#14182A] text-[#22C55E] border border-[#22C55E]/30">Completed</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#14182A] text-[#F59E0B] border border-[#F59E0B]/30 animate-pulse">Processing</span>;
      case 'FAILED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#14182A] text-[#EF4444] border border-[#EF4444]/30">Failed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#14182A] text-[#A1A1AA] border border-[#242943]">Pending</span>;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">
            Jobs & Timelines
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Historical telemetry ingestion logs and state extraction jobs
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#6366F1] text-white text-xs font-medium hover:bg-[#4F46E5] transition-colors"
        >
          <ArrowUpTrayIcon className="w-3.5 h-3.5 text-white" />
          New Telemetry Upload
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="card overflow-hidden">
        {loading && jobs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#71717A]">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#71717A]">
            No telemetry jobs found. Upload a capture file to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#242943] text-xs">
              <thead className="bg-[#0B0D16]">
                <tr className="text-left text-[#A1A1AA] font-medium">
                  <th scope="col" className="py-3 px-4">Job</th>
                  <th scope="col" className="py-3 px-4">File</th>
                  <th scope="col" className="py-3 px-4">Created</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4">Flows</th>
                  <th scope="col" className="py-3 px-4">Risk</th>
                  <th scope="col" className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242943]">
                {jobs.map((job) => (
                  <tr 
                    key={job.id} 
                    className="hover:bg-[#14182A]/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-[#71717A]">
                      {job.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#F8FAFC]">
                      {job.filename}
                      <span className="text-[#71717A] font-normal ml-2">({formatSize(job.file_size)})</span>
                    </td>
                    <td className="py-3 px-4 text-[#A1A1AA]">
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
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#F8FAFC]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                          Monitored
                        </span>
                      ) : (
                        <span className="text-[#71717A]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {job.status === 'DONE' ? (
                        <>
                          <Link
                            to={`/jobs/${job.id}/timeline`}
                            className="inline-block px-2.5 py-1 rounded bg-[#14182A] hover:bg-[#1E2337] text-[#F8FAFC] font-medium border border-[#242943] transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/predict`}
                            className="inline-block px-2.5 py-1 rounded bg-[#6366F1]/15 hover:bg-[#6366F1]/25 text-[#818CF8] border border-[#6366F1]/40 font-medium transition-colors"
                          >
                            Forecast
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/benchmark`}
                            className="inline-block px-2.5 py-1 rounded bg-[#14182A] hover:bg-[#1E2337] text-[#F8FAFC] font-medium border border-[#242943] transition-colors"
                          >
                            Details
                          </Link>
                        </>
                      ) : (
                        <span className="text-[#71717A]">Processing...</span>
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
