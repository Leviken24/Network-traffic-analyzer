import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { runBenchmark, listJobs } from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function Benchmark() {
  const { jobId: routeJobId } = useParams();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(routeJobId || '');
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobsList = await listJobs();
        const doneJobs = (jobsList || []).filter((j) => j.status === 'DONE');
        setJobs(doneJobs);
        if (!selectedJobId && doneJobs.length > 0) {
          setSelectedJobId(doneJobs[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch jobs list:", err);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (routeJobId) {
      setSelectedJobId(routeJobId);
    }
  }, [routeJobId]);

  const executeBenchmark = async () => {
    if (!selectedJobId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await runBenchmark(selectedJobId);
      setBenchmarkData(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to execute benchmark evaluation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeBenchmark();
  }, [selectedJobId]);

  const handleJobChange = (e) => {
    const newId = e.target.value;
    setSelectedJobId(newId);
    navigate(`/jobs/${newId}/benchmark`);
  };

  const lrMetrics = benchmarkData?.models?.logistic_regression?.metrics || {};
  const wmMetrics = benchmarkData?.models?.temporal_world_model?.metrics || {};
  const datasetInfo = benchmarkData?.dataset || {};

  const comparisonChartData = benchmarkData ? [
    {
      metric: 'Precision',
      'Logistic Regression': Math.round((lrMetrics.precision || 0) * 100),
      'Temporal World Model': Math.round((wmMetrics.precision || 0) * 100),
    },
    {
      metric: 'Recall',
      'Logistic Regression': Math.round((lrMetrics.recall || 0) * 100),
      'Temporal World Model': Math.round((wmMetrics.recall || 0) * 100),
    },
    {
      metric: 'F1 Score',
      'Logistic Regression': Math.round((lrMetrics.f1 || 0) * 100),
      'Temporal World Model': Math.round((wmMetrics.f1 || 0) * 100),
    },
    {
      metric: 'Accuracy',
      'Logistic Regression': Math.round((lrMetrics.accuracy || 0) * 100),
      'Temporal World Model': Math.round((wmMetrics.accuracy || 0) * 100),
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#0F1220] border border-[#242943] rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">
            Model Benchmark
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Static baseline classification vs. sequential temporal world model
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-[#A1A1AA] font-medium">Session:</label>
          <select
            value={selectedJobId}
            onChange={handleJobChange}
            className="bg-[#14182A] border border-[#242943] rounded px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
          >
            {jobs.length === 0 && <option value="">No completed jobs</option>}
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.filename} ({j.window_seconds}s window)
              </option>
            ))}
          </select>
          {selectedJobId && (
            <Link
              to={`/jobs/${selectedJobId}/predict`}
              className="px-3 py-1.5 text-xs border border-[#242943] rounded text-[#F8FAFC] hover:bg-[#14182A] font-medium transition-colors"
            >
              Forecast View
            </Link>
          )}
        </div>
      </div>

      {loading && (
        <div className="card p-12 text-center text-xs text-[#71717A]">
          Running out-of-sample benchmark evaluation...
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded text-[#EF4444] text-xs flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {benchmarkData && !loading && (
        <>
          {/* Methodology Banner */}
          <div className="card p-4 bg-[#14182A] border-[#242943] text-xs text-[#A1A1AA] flex flex-wrap justify-between items-center gap-3">
            <div>
              <span className="font-semibold text-[#F8FAFC]">Evaluation Methodology:</span> Chronological 70% train split and 30% out-of-sample test partition (zero future-state data leakage).
            </div>
            <div className="flex gap-4 font-mono text-[11px]">
              <span>Total States: <strong className="text-[#F8FAFC]">{datasetInfo.total_states || 0}</strong></span>
              <span>Train Windows: <strong className="text-[#F8FAFC]">{datasetInfo.train_samples || 0}</strong></span>
              <span>Test Windows: <strong className="text-[#F8FAFC]">{datasetInfo.test_samples || 0}</strong></span>
            </div>
          </div>

          {/* Side-by-Side Model Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Baseline Card */}
            <div className="card p-5">
              <div className="border-b border-[#242943] pb-3 mb-4">
                <span className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wider">Baseline Model</span>
                <h3 className="text-base font-bold text-[#F8FAFC] mt-0.5">
                  Static Logistic Regression
                </h3>
                <p className="text-xs text-[#71717A]">
                  Per-window classification without historical state memory
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#14182A] p-3 rounded border border-[#242943]">
                  <div className="text-[11px] text-[#A1A1AA]">F1 Score</div>
                  <div className="text-xl font-bold text-[#F8FAFC] mt-1">{Math.round((lrMetrics.f1 || 0) * 100)}%</div>
                </div>
                <div className="bg-[#14182A] p-3 rounded border border-[#242943]">
                  <div className="text-[11px] text-[#A1A1AA]">Accuracy</div>
                  <div className="text-xl font-bold text-[#F8FAFC] mt-1">{Math.round((lrMetrics.accuracy || 0) * 100)}%</div>
                </div>
                <div className="bg-[#14182A] p-3 rounded border border-[#242943]">
                  <div className="text-[11px] text-[#A1A1AA]">Precision</div>
                  <div className="text-xl font-bold text-[#F8FAFC] mt-1">{Math.round((lrMetrics.precision || 0) * 100)}%</div>
                </div>
                <div className="bg-[#14182A] p-3 rounded border border-[#242943]">
                  <div className="text-[11px] text-[#A1A1AA]">False Positive Rate</div>
                  <div className="text-xl font-bold text-[#F8FAFC] mt-1">{Math.round((lrMetrics.fpr || 0) * 100)}%</div>
                </div>
              </div>

              {/* Confusion Matrix */}
              <div className="mt-4 pt-3 border-t border-[#242943]">
                <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">Confusion Matrix</div>
                <div className="grid grid-cols-2 gap-1.5 text-center text-xs font-mono">
                  <div className="p-2 bg-[#14182A] rounded border border-[#242943]">
                    <div className="text-[10px] text-[#71717A]">TP</div>
                    <div className="font-semibold text-[#F8FAFC]">{lrMetrics.tp ?? 0}</div>
                  </div>
                  <div className="p-2 bg-[#14182A] rounded border border-[#242943]">
                    <div className="text-[10px] text-[#71717A]">FP</div>
                    <div className="font-semibold text-[#F8FAFC]">{lrMetrics.fp ?? 0}</div>
                  </div>
                  <div className="p-2 bg-[#14182A] rounded border border-[#242943]">
                    <div className="text-[10px] text-[#71717A]">FN</div>
                    <div className="font-semibold text-[#F8FAFC]">{lrMetrics.fn ?? 0}</div>
                  </div>
                  <div className="p-2 bg-[#14182A] rounded border border-[#242943]">
                    <div className="text-[10px] text-[#71717A]">TN</div>
                    <div className="font-semibold text-[#F8FAFC]">{lrMetrics.tn ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Champion Model Card */}
            <div className="card p-5 border-[#6366F1]">
              <div className="border-b border-[#242943] pb-3 mb-4 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-semibold text-[#818CF8] uppercase tracking-wider">Champion Model</span>
                  <h3 className="text-base font-bold text-[#F8FAFC] mt-0.5">
                    Temporal World Model
                  </h3>
                  <p className="text-xs text-[#71717A]">
                    Recurrent latent state tracking with multi-step trajectory projection
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#14182A] p-3 rounded border border-[#6366F1]/30">
                  <div className="text-[11px] text-[#818CF8]">F1 Score</div>
                  <div className="text-xl font-bold text-[#F8FAFC] mt-1">{Math.round((wmMetrics.f1 || 0) * 100)}%</div>
                </div>
                <div className="bg-[#14182A] p-3 rounded border border-[#6366F1]/30">
                  <div className="text-[11px] text-[#818CF8]">Accuracy</div>
                  <div className="text-xl font-bold text-[#F8FAFC] mt-1">{Math.round((wmMetrics.accuracy || 0) * 100)}%</div>
                </div>
                <div className="bg-[#14182A] p-3 rounded border border-[#6366F1]/30">
                  <div className="text-[11px] text-[#818CF8]">Precision</div>
                  <div className="text-xl font-bold text-[#F8FAFC] mt-1">{Math.round((wmMetrics.precision || 0) * 100)}%</div>
                </div>
                <div className="bg-[#14182A] p-3 rounded border border-[#6366F1]/30">
                  <div className="text-[11px] text-[#818CF8]">False Positive Rate</div>
                  <div className="text-xl font-bold text-[#22C55E] mt-1">{Math.round((wmMetrics.fpr || 0) * 100)}%</div>
                </div>
              </div>

              {/* Confusion Matrix */}
              <div className="mt-4 pt-3 border-t border-[#242943]">
                <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">Confusion Matrix</div>
                <div className="grid grid-cols-2 gap-1.5 text-center text-xs font-mono">
                  <div className="p-2 bg-[#22C55E]/10 text-[#22C55E] rounded border border-[#22C55E]/30">
                    <div className="text-[10px] text-[#22C55E]/70">TP</div>
                    <div className="font-semibold">{wmMetrics.tp ?? 0}</div>
                  </div>
                  <div className="p-2 bg-[#14182A] text-[#A1A1AA] rounded border border-[#242943]">
                    <div className="text-[10px] text-[#71717A]">FP</div>
                    <div className="font-semibold">{wmMetrics.fp ?? 0}</div>
                  </div>
                  <div className="p-2 bg-[#14182A] text-[#A1A1AA] rounded border border-[#242943]">
                    <div className="text-[10px] text-[#71717A]">FN</div>
                    <div className="font-semibold">{wmMetrics.fn ?? 0}</div>
                  </div>
                  <div className="p-2 bg-[#22C55E]/10 text-[#22C55E] rounded border border-[#22C55E]/30">
                    <div className="text-[10px] text-[#22C55E]/70">TN</div>
                    <div className="font-semibold">{wmMetrics.tn ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Comparison Chart */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-[#F8FAFC] uppercase tracking-wider mb-4">
              Side-by-Side Metric Comparison (%)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#242943" />
                  <XAxis dataKey="metric" stroke="#71717A" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#71717A" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F1220',
                      borderColor: '#242943',
                      borderRadius: '6px',
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#A1A1AA' }} />
                  <Bar dataKey="Logistic Regression" fill="#71717A" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Temporal World Model" fill="#6366F1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Architectural Notes */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-[#F8FAFC] uppercase tracking-wider mb-3">
              Performance Factors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#A1A1AA]">
              <div className="p-3 bg-[#14182A] rounded border border-[#242943]">
                <div className="font-semibold text-[#F8FAFC] mb-1">Sequence State Memory</div>
                <p>
                  Maintains a rolling context window across consecutive time intervals, allowing the detection of low-and-slow reconnaissance prior to volumetric escalation.
                </p>
              </div>

              <div className="p-3 bg-[#14182A] rounded border border-[#242943]">
                <div className="font-semibold text-[#F8FAFC] mb-1">False Alarm Mitigation</div>
                <p>
                  Isolated throughput bursts (such as scheduled backups or software updates) are distinguished from malicious exfiltration by tracking state continuity over time.
                </p>
              </div>

              <div className="p-3 bg-[#14182A] rounded border border-[#242943]">
                <div className="font-semibold text-[#F8FAFC] mb-1">Multi-Horizon Projection</div>
                <p>
                  Projects anticipated risk values into future time windows with momentum damping, allowing defensive controls to be staged in advance.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
