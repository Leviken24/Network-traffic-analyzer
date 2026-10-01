import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPrediction, listJobs, getStages } from '../api/client';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function Prediction() {
  const { jobId: routeJobId } = useParams();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(routeJobId || '');
  const [sequenceLength, setSequenceLength] = useState(8);
  const [forecastSteps, setForecastSteps] = useState(5);
  const [prediction, setPrediction] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available completed jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobsList = await listJobs();
        const doneJobs = (jobsList || []).filter(j => j.status === 'DONE');
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

  useEffect(() => {
    const fetchStageDefs = async () => {
      try {
        const res = await getStages();
        setStages(res?.stages || []);
      } catch (e) {
        console.warn("Could not fetch stage definitions:", e);
      }
    };
    fetchStageDefs();
  }, []);

  const loadPrediction = async () => {
    if (!selectedJobId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getPrediction(selectedJobId, sequenceLength, forecastSteps);
      setPrediction(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate forecast.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrediction();
  }, [selectedJobId, sequenceLength, forecastSteps]);

  const handleJobChange = (e) => {
    const newId = e.target.value;
    setSelectedJobId(newId);
    navigate(`/jobs/${newId}/predict`);
  };

  // Severity color calculation
  const getRiskLevel = (risk) => {
    if (risk >= 0.7) return { label: 'Critical', colorText: 'text-rose-700', colorBg: 'bg-rose-50', colorBorder: 'border-rose-200' };
    if (risk >= 0.3) return { label: 'Elevated', colorText: 'text-amber-700', colorBg: 'bg-amber-50', colorBorder: 'border-amber-200' };
    return { label: 'Normal', colorText: 'text-emerald-700', colorBg: 'bg-emerald-50', colorBorder: 'border-emerald-200' };
  };

  const getMitigationPlan = (stageIdx) => {
    switch (stageIdx) {
      case 1:
        return [
          { action: "Rate Limit SYN Packets", detail: "Apply ingress rate throttling on perimeter firewall for anomalous port sweep behavior." },
          { action: "Inspect Probe Origin", detail: "Cross-reference scanning IP addresses with threat intelligence blocklists." },
          { action: "Enable Connection Tracking", detail: "Flag rapid failed TCP handshakes across ephemeral port ranges." }
        ];
      case 2:
        return [
          { action: "Mitigate SYN Flood", detail: "Enable SYN Cookies (syncookies=1) and TCP half-open connection pruning." },
          { action: "Inspect Authentication Endpoints", detail: "Monitor SSH / RDP / Web authentication endpoints for credential brute forcing." },
          { action: "Isolate Attacker Ingress", detail: "Temporarily blackhole attacker IPs on border router ACLs." }
        ];
      case 3:
        return [
          { action: "Internal Microsegmentation", detail: "Restrict lateral RPC/SMB (ports 135, 445) and SSH between subnet workstations." },
          { action: "Endpoint Host Isolation", detail: "Quarantine suspicious internal pivot hosts displaying elevated outbound entropy." },
          { action: "Rotate Privileged Credentials", detail: "Revoke active Kerberos tickets and force MFA verification." }
        ];
      case 4:
        return [
          { action: "Sever C2 Channels", detail: "Terminate outbound connections to unapproved high ports (4444, 8888, 31337)." },
          { action: "Inspect Egress Volume", detail: "Inspect asymmetric large outbound data streams for exfiltration patterns." },
          { action: "Trigger Incident Response", detail: "Initiate security triage and preserve network flow logs for forensic analysis." }
        ];
      default:
        return [
          { action: "Baseline Monitoring", detail: "Traffic metrics within normal baseline operational limits. Continuous telemetry active." },
          { action: "Policy Verification", detail: "Firewall rule verification and continuous state snapshot ingestion." }
        ];
    }
  };

  // Prepare chart series: combine historical timeline + forecast projection
  const chartData = [];
  if (prediction?.state_timeline) {
    prediction.state_timeline.forEach((item) => {
      chartData.push({
        name: `W${item.window_index}`,
        observedRisk: Math.round(item.risk * 100),
        forecastRisk: null,
        stage: item.stage_label,
        type: 'observed'
      });
    });
  }

  if (prediction?.forecast && chartData.length > 0) {
    const lastObserved = chartData[chartData.length - 1];
    if (lastObserved) {
      lastObserved.forecastRisk = lastObserved.observedRisk;
    }
    prediction.forecast.forEach((fc) => {
      chartData.push({
        name: fc.label,
        observedRisk: null,
        forecastRisk: Math.round(fc.risk * 100),
        stage: fc.stage_label,
        confidence: Math.round(fc.confidence * 100),
        type: 'forecast'
      });
    });
  }

  const STAGE_NAMES = [
    "Normal Traffic",
    "Reconnaissance",
    "Initial Access",
    "Lateral Movement",
    "Command & Control / Exfil"
  ];

  const currentRiskInfo = prediction ? getRiskLevel(prediction.current_risk) : { label: 'Normal', colorText: 'text-slate-700', colorBg: 'bg-slate-50', colorBorder: 'border-slate-200' };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F3D56]">
            Attack Forecasting
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Temporal risk trajectory and attack stage projection
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-slate-500 font-medium">Session:</label>
          <select
            value={selectedJobId}
            onChange={handleJobChange}
            className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0EA5A8]"
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
              to={`/jobs/${selectedJobId}/timeline`}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Timeline
            </Link>
          )}
          {selectedJobId && (
            <Link
              to={`/jobs/${selectedJobId}/benchmark`}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Benchmark
            </Link>
          )}
        </div>
      </div>

      {/* Sliders for Context & Forecast Horizon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-medium text-slate-700">Context Window</span>
            <span className="font-semibold text-[#0F3D56]">{sequenceLength} states</span>
          </div>
          <input
            type="range"
            min="3"
            max="30"
            step="1"
            value={sequenceLength}
            onChange={(e) => setSequenceLength(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F3D56]"
          />
          <div className="text-[11px] text-slate-400 mt-1">Number of historical windows evaluated</div>
        </div>

        <div className="card p-4">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-medium text-slate-700">Forecast Horizon</span>
            <span className="font-semibold text-[#0EA5A8]">+{forecastSteps} windows</span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            step="1"
            value={forecastSteps}
            onChange={(e) => setForecastSteps(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0EA5A8]"
          />
          <div className="text-[11px] text-slate-400 mt-1">Future window states projected into horizon</div>
        </div>
      </div>

      {loading && (
        <div className="card p-12 text-center text-slate-500 text-xs">
          Computing temporal risk projection...
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {prediction && !loading && (
        <>
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Current Risk */}
            <div className="card p-5">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Current Risk
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-[#0F3D56]">
                  {Math.round(prediction.current_risk * 100)}%
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${currentRiskInfo.colorBg} ${currentRiskInfo.colorText} ${currentRiskInfo.colorBorder}`}>
                  {currentRiskInfo.label}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                <div
                  className={`h-1.5 rounded-full ${
                    prediction.current_risk >= 0.7 ? 'bg-rose-600' :
                    prediction.current_risk >= 0.3 ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(prediction.current_risk * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Predicted Stage */}
            <div className="card p-5">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Predicted Stage
              </div>
              <div className="text-base font-bold text-[#0F3D56] mt-2">
                {prediction.current_stage_label || prediction.stage_label}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Phase {prediction.current_stage} of 4
              </div>
            </div>

            {/* Confidence */}
            <div className="card p-5">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Model Confidence
              </div>
              <div className="text-2xl font-bold text-[#0F3D56] mt-2">
                {Math.round(prediction.stage_confidence * 100)}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Based on sequence trajectory
              </div>
            </div>

            {/* Forecast Steps Breakdown */}
            <div className="card p-5">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Forecast Summary
              </div>
              <div className="mt-2 space-y-1">
                {prediction.forecast && prediction.forecast.slice(0, 3).map((f) => (
                  <div key={f.step} className="flex justify-between text-xs">
                    <span className="text-slate-500">{f.label} ({f.stage_label})</span>
                    <span className="font-medium text-[#0F3D56]">{Math.round(f.risk * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Chart */}
          <div className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-[#0F3D56] uppercase tracking-wider">
                  Forecast Timeline
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Observed historical state sequence vs. predicted future trajectory
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-0.5 bg-[#0F3D56] inline-block"></span> Observed
                </span>
                <span className="flex items-center gap-1.5 text-[#0EA5A8]">
                  <span className="w-3 h-0.5 bg-[#0EA5A8] border-b border-dashed border-[#0EA5A8] inline-block"></span> Predicted
                </span>
                <span className="flex items-center gap-1.5 text-rose-600">
                  <span className="w-3 h-0.5 bg-rose-500 border-b border-dashed border-rose-500 inline-block"></span> Critical (70%)
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#64748B" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '6px',
                      color: '#172033',
                      fontSize: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  />
                  <ReferenceLine y={70} stroke="#DC2626" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="observedRisk"
                    name="Observed Risk"
                    stroke="#0F3D56"
                    strokeWidth={2}
                    dot={{ fill: '#0F3D56', r: 3 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecastRisk"
                    name="Predicted Risk"
                    stroke="#0EA5A8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ fill: '#0EA5A8', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attack Stage Progression */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[#0F3D56] uppercase tracking-wider mb-3">
              Attack Stage Progression
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {STAGE_NAMES.map((name, idx) => {
                const isCurrent = prediction.current_stage === idx;
                const isPast = prediction.current_stage > idx;
                const isFuturePredicted = prediction.forecast?.some((f) => f.stage === idx) && !isCurrent && !isPast;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded border text-xs ${
                      isCurrent
                        ? 'border-[#0EA5A8] bg-[#F0FDFA] font-medium'
                        : isPast
                        ? 'border-slate-200 bg-slate-50 text-slate-500'
                        : isFuturePredicted
                        ? 'border-amber-300 bg-amber-50 text-slate-700'
                        : 'border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Stage {idx}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-[#0EA5A8] uppercase">Active</span>
                      )}
                      {isFuturePredicted && (
                        <span className="text-[10px] font-semibold text-amber-700 uppercase">Predicted</span>
                      )}
                    </div>
                    <div className={`font-semibold ${isCurrent ? 'text-[#0F3D56]' : 'text-slate-700'}`}>
                      {name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explainability & Decision Support */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Explainability (Top contributing features) */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-[#0F3D56] uppercase tracking-wider mb-1">
                Feature Attribution
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Telemetry indicators contributing to current risk score
              </p>

              <div className="space-y-3">
                {prediction.contributing_features && prediction.contributing_features.length > 0 ? (
                  prediction.contributing_features.map((feat, idx) => {
                    const weightPct = Math.round(feat.contribution * 100);
                    const levelLabel = weightPct >= 20 ? 'High contribution' : weightPct >= 10 ? 'Medium contribution' : 'Low contribution';

                    return (
                      <div key={idx} className="border-b border-slate-100 pb-2 last:border-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-[#172033]">{feat.feature}</span>
                          <span className="text-slate-500">{levelLabel}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-[#0EA5A8]"
                            style={{ width: `${Math.min(feat.contribution * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500">All features within nominal baseline bounds.</p>
                )}
              </div>
            </div>

            {/* Decision Support Playbook */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-[#0F3D56] uppercase tracking-wider mb-1">
                Decision Support
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Recommended responses for {prediction.current_stage_label || prediction.stage_label}
              </p>

              <div className="space-y-3">
                {getMitigationPlan(prediction.current_stage).map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                    <div className="font-semibold text-[#0F3D56] mb-0.5">
                      {idx + 1}. {item.action}
                    </div>
                    <div className="text-slate-600">
                      {item.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
