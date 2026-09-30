import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listJobs } from '../api/client';
import { CloudArrowUpIcon, TableCellsIcon, SparklesIcon, ScaleIcon, ClockIcon } from '@heroicons/react/24/outline';

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
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-2">
            <TableCellsIcon className="w-8 h-8 text-cyan-400" />
            Ingested Telemetry Jobs
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time pipeline monitoring & temporal feature sequence tracking.
          </p>
        </div>
        <Link 
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 border border-cyan-500/40 text-sm font-bold rounded-lg text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/25 transition-all shadow-[0_0_15px_rgba(0,245,255,0.2)]"
        >
          <CloudArrowUpIcon className="w-4 h-4" />
          Upload New File
        </Link>
      </div>

      <div className="card border border-cyan-500/25 overflow-hidden">
        {loading && jobs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Loading telemetry jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-lg font-bold text-gray-200">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-400">Get started by uploading a PCAP or CSV telemetry file.</p>
            <Link
              to="/upload"
              className="mt-4 inline-block px-4 py-2 rounded-lg bg-cyan-500 text-black font-bold text-xs"
            >
              Go to Upload
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 text-sm">
              <thead className="bg-black/60">
                <tr className="text-xs uppercase tracking-wider text-gray-400 text-left">
                  <th scope="col" className="px-6 py-3.5">File & Resolution</th>
                  <th scope="col" className="px-6 py-3.5">Status</th>
                  <th scope="col" className="px-6 py-3.5">File Size</th>
                  <th scope="col" className="px-6 py-3.5">Ingested At</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Analysis Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 bg-transparent">
                {jobs.map((job) => (
                  <tr 
                    key={job.id} 
                    className="hover:bg-cyan-950/20 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold font-mono text-cyan-200">{job.filename}</div>
                      <div className="text-xs text-gray-500">ID: {job.id.substring(0, 8)}... · Window: {job.window_seconds}s</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                      {formatSize(job.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2 text-xs">
                      {job.status === 'DONE' ? (
                        <>
                          <Link
                            to={`/jobs/${job.id}/predict`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 font-semibold transition-colors"
                          >
                            <SparklesIcon className="w-3.5 h-3.5" />
                            Forecast
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/timeline`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-semibold transition-colors"
                          >
                            <ClockIcon className="w-3.5 h-3.5" />
                            Timeline
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/benchmark`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-700/40 text-gray-300 border border-gray-600 hover:bg-gray-700/60 font-semibold transition-colors"
                          >
                            <ScaleIcon className="w-3.5 h-3.5" />
                            Benchmark
                          </Link>
                        </>
                      ) : (
                        <span className="text-gray-500 italic">Processing traffic...</span>
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
