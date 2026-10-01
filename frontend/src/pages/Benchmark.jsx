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
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#242943] pb-5">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-[#6366F1] uppercase mb-1">
            Empirical Evaluation
          </div>
          <h1 className="text-xl font-light text-[#F8FAFC] tracking-tight">
            Model Benchmark & Architecture Comparison
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Static per-window classification vs. sequential temporal world model on out-of-sample test partition.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-[#71717A] font-mono">Session:</label>
          <select
            value={selectedJobId}
            onChange={handleJobChange}
            className="bg-[#0F1220] border border-[#242943] rounded-sm px-2.5 py-1.5 text-xs text-[#F8FAFC] font-mono focus:outline-none focus:border-[#6366F1]"
          >
            {jobs.length === 0 && <option value="">No completed captures</option>}
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.filename} ({j.window_seconds}s window)
              </option>
            ))}
          </select>
          {selectedJobId && (
            <Link
              to={`/jobs/${selectedJobId}/predict`}
              className="px-3 py-1.5 text-xs border border-[#242943] rounded-sm text-[#A1A1AA] hover:text-[#818CF8] hover:bg-[#14182A] font-mono transition-colors"
            >
              Forecast View
            </Link>
          )}
        </div>
      </div>

      {loading && (
        <div className="glass-panel p-16 text-center text-xs text-[#71717A] font-mono">
          Computing out-of-sample empirical benchmark...
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded text-[#EF4444] text-xs font-mono flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {benchmarkData && !loading && (
        <>
          {/* Methodology Banner */}
          <div className="glass-panel p-4 text-xs text-[#A1A1AA] flex flex-wrap justify-between items-center gap-4">
            <div>
              <span className="font-mono text-[#F8FAFC]">Evaluation Protocol:</span> Chronological 70% train split and 30% out-of-sample test partition (zero future-state data leakage).
            </div>
            <div className="flex gap-5 font-mono text-[11px]">
              <span>Total States: <strong className="text-[#F8FAFC]">{datasetInfo.total_states || 0}</strong></span>
              <span>Train Windows: <strong className="text-[#F8FAFC]">{datasetInfo.train_samples || 0}</strong></span>
              <span>Test Windows: <strong className="text-[#F8FAFC]">{datasetInfo.test_samples || 0}</strong></span>
            </div>
          </div>

          {/* Side-by-Side Model Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Baseline Card */}
            <div className="glass-panel p-5 space-y-4">
              <div className="border-b border-[#242943] pb-3">
                <span className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider">Baseline Model</span>
                <h3 className="text-sm font-medium text-[#F8FAFC] mt-0.5">
                  Static Logistic Regression
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  Per-window isolated classification without historical state memory
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="bg-[#0B0D16] p-3 rounded-sm border border-[#242943]">
                  <div className="text-[10px] text-[#71717A] uppercase">F1 Score</div>
                  <div className="text-xl font-light text-[#F8FAFC] mt-1">{Math.round((lrMetrics.f1 || 0) * 100)}%</div>
                </div>
                <div className="bg-[#0B0D16] p-3 rounded-sm border border-[#242943]">
                  <div className="text-[10px] text-[#71717A] uppercase">Accuracy</div>
                  <div className="text-xl font-light text-[#F8FAFC] mt-1">{Math.round((lrMetrics.accuracy || 0) * 100)}%</div>
                </div>
                <div className="bg-[#0B0D16] p-3 rounded-sm border border-[#242943]">
                  <div className="text-[10px] text-[#71717A] uppercase">Precision</div>
                  <div className="text-xl font-light text-[#F8FAFC] mt-1">{Math.round((lrMetrics.precision || 0) * 100)}%</div>
                </div>
                <div className="bg-[#0B0D16] p-3 rounded-sm border border-[#242943]">
                  <div className="text-[10px] text-[#71717A] uppercase">False Positive Rate</div>
                  <div className="text-xl font-light text-[#A1A1AA] mt-1">{Math.round((lrMetrics.fpr || 0) * 100)}%</div>
                </div>
              </div>

              {/* Confusion Matrix */}
              <div className="pt-2">
                <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider mb-2">Confusion Matrix (Test Split)</div>
                <div className="grid grid-cols-2 gap-1.5 text-center font-mono text-xs">
                  <div className="p-2 bg-[#0B0D16] rounded-sm border border-[#242943]">
                    <div className="text-[9px] text-[#71717A]">TP</div>
                    <div className="text-[#F8FAFC]">{lrMetrics.tp ?? 0}</div>
                  </div>
                  <div className="p-2 bg-[#0B0D16] rounded-sm border border-[#242943]">
                    <div className="text-[9px] text-[#71717A]">FP</div>
                    <div className="text-[#F8FAFC]">{lrMetrics.fp ?? 0}</div>
                  </div>
                  <div className="p-2 bg-[#0B0D16] rounded-sm border border-[#242943]">
                    <div className="text-[9px] text-[#71717A]">FN</div>
                    <div className="text-[#F8FAFC]">{lrMetrics.fn ?? 0}</div>
                  </div>
                  <div className="p-2 bg-[#0B0D16] rounded-sm border border-[#242943]">
                    <div className="text-[9px] text-[#71717A]">TN</div>
                    <div className="text-[#F8FAFC]">{lrMetrics.tn ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Champion Model Card */}
            <div className="glass-panel p-5 space-y-4 border-[#6366F1]/40 bg-[#6366F1]/5">
              <div className="border-b border-[#242943] pb-3">
                <span className="text-[10px] font-mono text-[#6366F1] uppercase tracking-wider">Champion Model</span>
                <h3 className="text-sm font-medium text-[#F8FAFC] mt-0.5">
                  Temporal World Model
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  Recurrent latent state representation with multi-step trajectory projection
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="bg-[#6366F1]/10 p-3 rounded-sm border border-[#6366F1]/30">
                  <div className="text-[10px] text-[#818CF8] uppercase">F1 Score</div>
                  <div className="text-xl font-light text-[#F8FAFC] mt-1">{Math.round((wmMetrics.f1 || 0) * 100)}%</div>
                </div>
                <div className="bg-[#6366F1]/10 p-3 rounded-sm border border-[#6366F1]/30">
                  <div className="text-[10px] text-[#818CF8] uppercase">Accuracy</div>
                  <div className="text-xl font-light text-[#F8FAFC] mt-1">{Math.round((wmMetrics.accuracy || 0) * 100)}%</div>
                </div>
                <div className="bg-[#6366F1]/10 p-3 rounded-sm border border-[#6366F1]/30">
                  <div className="text-[10px] text-[#818CF8] uppercase">Precision</div>
                  <div className="text-xl font-light text-[#F8FAFC] mt-1">{Math.round((wmMetrics.precision || 0) * 100)}%</div>
                </div>
                <div className="bg-[#6366F1]/10 p-3 rounded-sm border border-[#6366F1]/30">
                  <div className="text-[10px] text-[#818CF8] uppercase">False Positive Rate</div>
                  <div className="text-xl font-light text-[#22C55E] mt-1">{Math.round((wmMetrics.fpr || 0) * 100)}%</div>
                </div>
              </div>

              {/* Confusion Matrix */}
              <div className="pt-2">
                <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider mb-2">Confusion Matrix (Test Split)</div>
                <div className="grid grid-cols-2 gap-1.5 text-center font-mono text-xs">
                  <div className="p-2 bg-[#22C55E]/10 text-[#22C55E] rounded-sm border border-[#22C55E]/30">
                    <div className="text-[9px] text-[#22C55E]/70">TP</div>
                    <div>{wmMetrics.tp ?? 0}</div>
                  </div>
                  <div className="p-2 bg-[#0B0D16] text-[#A1A1AA] rounded-sm border border-[#242943]">
                    <div className="text-[9px] text-[#71717A]">FP</div>
                    <div>{wmMetrics.fp ?? 0}</div>
                  </div>
                  <div className="p-2 bg-[#0B0D16] text-[#A1A1AA] rounded-sm border border-[#242943]">
                    <div className="text-[9px] text-[#71717A]">FN</div>
                    <div>{wmMetrics.fn ?? 0}</div>
                  </div>
                  <div className="p-2 bg-[#22C55E]/10 text-[#22C55E] rounded-sm border border-[#22C55E]/30">
                    <div className="text-[9px] text-[#22C55E]/70">TN</div>
                    <div>{wmMetrics.tn ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Comparison Chart */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-mono tracking-wider text-[#A1A1AA] uppercase">
              Side-by-Side Metric Comparison (%)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#242943" />
                  <XAxis dataKey="metric" stroke="#242943" tick={{ fill: '#71717A', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#242943" tick={{ fill: '#71717A', fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F1220',
                      borderColor: '#242943',
                      borderRadius: '4px',
                      color: '#F8FAFC',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#A1A1AA', fontFamily: 'monospace' }} />
                  <Bar dataKey="Logistic Regression" fill="#06B6D4" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Temporal World Model" fill="#6366F1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Architectural Notes */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono tracking-wider text-[#A1A1AA] uppercase">
              Architectural Factors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#A1A1AA]">
              <div className="p-4 glass-panel">
                <div className="font-mono text-[#F8FAFC] mb-1">Sequence State Memory</div>
                <p className="text-[11px] leading-relaxed text-[#A1A1AA]">
                  Maintains a rolling context window across consecutive time intervals, allowing the detection of low-and-slow reconnaissance prior to volumetric escalation.
                </p>
              </div>

              <div className="p-4 glass-panel">
                <div className="font-mono text-[#F8FAFC] mb-1">False Alarm Mitigation</div>
                <p className="text-[11px] leading-relaxed text-[#A1A1AA]">
                  Isolated throughput bursts (such as scheduled backups or software updates) are distinguished from malicious exfiltration by tracking state continuity over time.
                </p>
              </div>

              <div className="p-4 glass-panel">
                <div className="font-mono text-[#F8FAFC] mb-1">Multi-Horizon Projection</div>
                <p className="text-[11px] leading-relaxed text-[#A1A1AA]">
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
