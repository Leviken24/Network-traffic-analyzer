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
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">Processing</span>;
      case 'FAILED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">Failed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">Pending</span>;
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
          <h1 className="text-xl font-bold text-[#0F3D56]">
            Jobs & Timelines
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical telemetry ingestion logs and state extraction jobs
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#0F3D56] text-white text-xs font-medium hover:bg-[#164967] transition-colors"
        >
          <ArrowUpTrayIcon className="w-3.5 h-3.5 text-[#0EA5A8]" />
          New Telemetry Upload
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="card overflow-hidden">
        {loading && jobs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No telemetry jobs found. Upload a capture file to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600 font-medium">
                  <th scope="col" className="py-3 px-4">Job</th>
                  <th scope="col" className="py-3 px-4">File</th>
                  <th scope="col" className="py-3 px-4">Created</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4">Flows</th>
                  <th scope="col" className="py-3 px-4">Risk</th>
                  <th scope="col" className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr 
                    key={job.id} 
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {job.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#0F3D56]">
                      {job.filename}
                      <span className="text-slate-400 font-normal ml-2">({formatSize(job.file_size)})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(job.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {job.total_flows ? job.total_flows.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {job.status === 'DONE' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Monitored
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {job.status === 'DONE' ? (
                        <>
                          <Link
                            to={`/jobs/${job.id}/timeline`}
                            className="inline-block px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/predict`}
                            className="inline-block px-2.5 py-1 rounded bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4] font-medium transition-colors"
                          >
                            Forecast
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/benchmark`}
                            className="inline-block px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                          >
                            Details
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
