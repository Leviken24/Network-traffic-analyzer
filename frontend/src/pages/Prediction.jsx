import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPrediction, listJobs, getStages } from '../api/client';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  ExclamationTriangleIcon
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
    if (risk >= 0.7) return { label: 'Critical', colorText: 'text-[#EF4444]', colorBg: 'bg-[#EF4444]/10', colorBorder: 'border-[#EF4444]/30' };
    if (risk >= 0.3) return { label: 'Elevated', colorText: 'text-[#F59E0B]', colorBg: 'bg-[#F59E0B]/10', colorBorder: 'border-[#F59E0B]/30' };
    return { label: 'Normal', colorText: 'text-[#22C55E]', colorBg: 'bg-[#22C55E]/10', colorBorder: 'border-[#22C55E]/30' };
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

  const currentRiskInfo = prediction ? getRiskLevel(prediction.current_risk) : { label: 'Normal', colorText: 'text-[#F8FAFC]', colorBg: 'bg-[#14182A]', colorBorder: 'border-[#242943]' };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-[#0F1220] border border-[#242943] rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">
            Attack Forecasting
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Temporal risk trajectory and attack stage projection
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
              to={`/jobs/${selectedJobId}/timeline`}
              className="px-3 py-1.5 text-xs border border-[#242943] rounded text-[#F8FAFC] hover:bg-[#14182A] font-medium transition-colors"
            >
              Timeline
            </Link>
          )}
          {selectedJobId && (
            <Link
              to={`/jobs/${selectedJobId}/benchmark`}
              className="px-3 py-1.5 text-xs border border-[#242943] rounded text-[#F8FAFC] hover:bg-[#14182A] font-medium transition-colors"
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
            <span className="font-medium text-[#F8FAFC]">Context Window</span>
            <span className="font-semibold text-[#818CF8]">{sequenceLength} states</span>
          </div>
          <input
            type="range"
            min="3"
            max="30"
            step="1"
            value={sequenceLength}
            onChange={(e) => setSequenceLength(Number(e.target.value))}
            className="w-full h-1.5 bg-[#242943] rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
          />
          <div className="text-[11px] text-[#71717A] mt-1">Number of historical windows evaluated</div>
        </div>

        <div className="card p-4">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-medium text-[#F8FAFC]">Forecast Horizon</span>
            <span className="font-semibold text-[#06B6D4]">+{forecastSteps} windows</span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            step="1"
            value={forecastSteps}
            onChange={(e) => setForecastSteps(Number(e.target.value))}
            className="w-full h-1.5 bg-[#242943] rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
          />
          <div className="text-[11px] text-[#71717A] mt-1">Future window states projected into horizon</div>
        </div>
      </div>

      {loading && (
        <div className="card p-12 text-center text-[#71717A] text-xs">
          Computing temporal risk projection...
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded text-[#EF4444] text-xs flex items-center gap-2">
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
              <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
                Current Risk
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-[#F8FAFC]">
                  {Math.round(prediction.current_risk * 100)}%
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${currentRiskInfo.colorBg} ${currentRiskInfo.colorText} ${currentRiskInfo.colorBorder}`}>
                  {currentRiskInfo.label}
                </span>
              </div>
              <div className="w-full bg-[#242943] rounded-full h-1.5 mt-3">
                <div
                  className={`h-1.5 rounded-full ${
                    prediction.current_risk >= 0.7 ? 'bg-[#EF4444]' :
                    prediction.current_risk >= 0.3 ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'
                  }`}
                  style={{ width: `${Math.min(prediction.current_risk * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Predicted Stage */}
            <div className="card p-5">
              <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
                Predicted Stage
              </div>
              <div className="text-base font-bold text-[#F8FAFC] mt-2">
                {prediction.current_stage_label || prediction.stage_label}
              </div>
              <div className="text-xs text-[#71717A] mt-1">
                Phase {prediction.current_stage} of 4
              </div>
            </div>

            {/* Confidence */}
            <div className="card p-5">
              <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
                Model Confidence
              </div>
              <div className="text-2xl font-bold text-[#F8FAFC] mt-2">
                {Math.round(prediction.stage_confidence * 100)}%
              </div>
              <div className="text-xs text-[#71717A] mt-1">
                Based on sequence trajectory
              </div>
            </div>

            {/* Forecast Steps Breakdown */}
            <div className="card p-5">
              <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
                Forecast Summary
              </div>
              <div className="mt-2 space-y-1">
                {prediction.forecast && prediction.forecast.slice(0, 3).map((f) => (
                  <div key={f.step} className="flex justify-between text-xs">
                    <span className="text-[#A1A1AA]">{f.label} ({f.stage_label})</span>
                    <span className="font-medium text-[#F8FAFC]">{Math.round(f.risk * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Chart */}
          <div className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b border-[#242943] pb-3">
              <div>
                <h2 className="text-sm font-semibold text-[#F8FAFC] uppercase tracking-wider">
                  Forecast Timeline
                </h2>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Observed historical state sequence vs. predicted future trajectory
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-[#F8FAFC]">
                  <span className="w-3 h-0.5 bg-[#6366F1] inline-block"></span> Observed
                </span>
                <span className="flex items-center gap-1.5 text-[#06B6D4]">
                  <span className="w-3 h-0.5 bg-[#06B6D4] border-b border-dashed border-[#06B6D4] inline-block"></span> Predicted
                </span>
                <span className="flex items-center gap-1.5 text-[#EF4444]">
                  <span className="w-3 h-0.5 bg-[#EF4444] border-b border-dashed border-[#EF4444] inline-block"></span> Critical (70%)
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#242943" />
                  <XAxis dataKey="name" stroke="#71717A" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#71717A" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F1220',
                      borderColor: '#242943',
                      borderRadius: '6px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}
                  />
                  <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="observedRisk"
                    name="Observed Risk"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={{ fill: '#6366F1', r: 3 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecastRisk"
                    name="Predicted Risk"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ fill: '#06B6D4', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attack Stage Progression */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[#F8FAFC] uppercase tracking-wider mb-3">
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
                        ? 'border-[#6366F1] bg-[#14182A] text-[#F8FAFC] font-medium'
                        : isPast
                        ? 'border-[#242943] bg-[#0B0D16] text-[#71717A]'
                        : isFuturePredicted
                        ? 'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F8FAFC]'
                        : 'border-[#242943] bg-[#0F1220] text-[#71717A]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-[#71717A] uppercase font-mono">Stage {idx}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-[#818CF8] uppercase">Active</span>
                      )}
                      {isFuturePredicted && (
                        <span className="text-[10px] font-semibold text-[#F59E0B] uppercase">Predicted</span>
                      )}
                    </div>
                    <div className={`font-semibold ${isCurrent ? 'text-[#F8FAFC]' : isPast ? 'text-[#71717A]' : 'text-[#F8FAFC]'}`}>
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
              <h2 className="text-sm font-semibold text-[#F8FAFC] uppercase tracking-wider mb-1">
                Feature Attribution
              </h2>
              <p className="text-xs text-[#71717A] mb-4">
                Telemetry indicators contributing to current risk score
              </p>

              <div className="space-y-3">
                {prediction.contributing_features && prediction.contributing_features.length > 0 ? (
                  prediction.contributing_features.map((feat, idx) => {
                    const weightPct = Math.round(feat.contribution * 100);
                    const levelLabel = weightPct >= 20 ? 'High contribution' : weightPct >= 10 ? 'Medium contribution' : 'Low contribution';

                    return (
                      <div key={idx} className="border-b border-[#242943] pb-2 last:border-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-[#F8FAFC]">{feat.feature}</span>
                          <span className="text-[#A1A1AA]">{levelLabel}</span>
                        </div>
                        <div className="w-full bg-[#242943] rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-[#6366F1]"
                            style={{ width: `${Math.min(feat.contribution * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#71717A]">All features within nominal baseline bounds.</p>
                )}
              </div>
            </div>

            {/* Decision Support Playbook */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-[#F8FAFC] uppercase tracking-wider mb-1">
                Decision Support
              </h2>
              <p className="text-xs text-[#71717A] mb-4">
                Recommended responses for {prediction.current_stage_label || prediction.stage_label}
              </p>

              <div className="space-y-3">
                {getMitigationPlan(prediction.current_stage).map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#14182A] border border-[#242943] rounded text-xs">
                    <div className="font-semibold text-[#F8FAFC] mb-0.5">
                      {idx + 1}. {item.action}
                    </div>
                    <div className="text-[#A1A1AA]">
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
