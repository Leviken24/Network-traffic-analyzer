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

  // Analytical risk severity categorization
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

  // Dual series chart preparation: Observed (solid cyan) vs Forecast (dashed indigo)
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
    <div className="space-y-8">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#242943] pb-5">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-[#6366F1] uppercase mb-1">
            Latent Trajectory Forecasting
          </div>
          <h1 className="text-xl font-light text-[#F8FAFC] tracking-tight">
            Attack Progression & Multi-Horizon Projection
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Sequential state tracking across time windows to project anticipated risk and attack progression.
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
              to={`/jobs/${selectedJobId}/timeline`}
              className="px-3 py-1.5 text-xs border border-[#242943] rounded-sm text-[#A1A1AA] hover:text-[#818CF8] hover:bg-[#14182A] font-mono transition-colors"
            >
              Timeline
            </Link>
          )}
          {selectedJobId && (
            <Link
              to={`/jobs/${selectedJobId}/benchmark`}
              className="px-3 py-1.5 text-xs border border-[#242943] rounded-sm text-[#A1A1AA] hover:text-[#818CF8] hover:bg-[#14182A] font-mono transition-colors"
            >
              Benchmark
            </Link>
          )}
        </div>
      </div>

      {/* Sliders Bar for Context & Forecast Horizon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="text-[#A1A1AA]">Context Window Length</span>
            <span className="font-mono text-[#F8FAFC]">{sequenceLength} states</span>
          </div>
          <input
            type="range"
            min="3"
            max="30"
            step="1"
            value={sequenceLength}
            onChange={(e) => setSequenceLength(Number(e.target.value))}
            className="w-full h-1 bg-[#242943] rounded appearance-none cursor-pointer accent-[#6366F1]"
          />
          <div className="text-[10px] text-[#71717A] font-mono mt-1">Number of consecutive historical state vectors in GRU memory</div>
        </div>

        <div className="glass-panel p-4">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="text-[#A1A1AA]">Forecast Projection Horizon</span>
            <span className="font-mono text-[#818CF8]">+{forecastSteps} windows</span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            step="1"
            value={forecastSteps}
            onChange={(e) => setForecastSteps(Number(e.target.value))}
            className="w-full h-1 bg-[#242943] rounded appearance-none cursor-pointer accent-[#6366F1]"
          />
          <div className="text-[10px] text-[#71717A] font-mono mt-1">Number of future time steps projected into horizon</div>
        </div>
      </div>

      {loading && (
        <div className="glass-panel p-16 text-center text-[#71717A] text-xs font-mono">
          Evaluating sequence latent trajectory...
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded text-[#EF4444] text-xs font-mono flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {prediction && !loading && (
        <>
          {/* Posture Indicators: Crisp analytical summary line */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-2 border-b border-[#242943]">
            {/* Current Risk */}
            <div>
              <div className="text-[10px] font-mono tracking-wider text-[#71717A] uppercase">
                Observed Network Risk
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-light text-[#F8FAFC] font-mono">
                  {Math.round(prediction.current_risk * 100)}%
                </span>
                <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono border ${currentRiskInfo.colorBg} ${currentRiskInfo.colorText} ${currentRiskInfo.colorBorder}`}>
                  {currentRiskInfo.label}
                </span>
              </div>
              <div className="w-full bg-[#242943] rounded-full h-1 mt-2">
                <div
                  className={`h-1 rounded-full ${
                    prediction.current_risk >= 0.7 ? 'bg-[#EF4444]' :
                    prediction.current_risk >= 0.3 ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'
                  }`}
                  style={{ width: `${Math.min(prediction.current_risk * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Predicted Stage */}
            <div className="border-l border-[#242943] pl-6">
              <div className="text-[10px] font-mono tracking-wider text-[#71717A] uppercase">
                Predicted Attack Phase
              </div>
              <div className="text-base font-normal text-[#F8FAFC] mt-1">
                {prediction.current_stage_label || prediction.stage_label}
              </div>
              <div className="text-[11px] text-[#A1A1AA] mt-0.5 font-mono">
                Phase {prediction.current_stage} of 4 &bull; MITRE Mapping
              </div>
            </div>

            {/* Confidence */}
            <div className="border-l border-[#242943] pl-6">
              <div className="text-[10px] font-mono tracking-wider text-[#71717A] uppercase">
                Model Latent Confidence
              </div>
              <div className="text-2xl font-light text-[#F8FAFC] font-mono mt-1">
                {Math.round(prediction.stage_confidence * 100)}%
              </div>
              <div className="text-[11px] text-[#A1A1AA] mt-0.5">
                Sequential trajectory certainty
              </div>
            </div>

            {/* Horizon Outlook */}
            <div className="border-l border-[#242943] pl-6">
              <div className="text-[10px] font-mono tracking-wider text-[#71717A] uppercase">
                Horizon Outlook
              </div>
              <div className="mt-1 space-y-0.5">
                {prediction.forecast && prediction.forecast.slice(0, 3).map((f) => (
                  <div key={f.step} className="flex justify-between text-[11px] font-mono">
                    <span className="text-[#71717A]">{f.label}:</span>
                    <span className="text-[#F8FAFC]">{Math.round(f.risk * 100)}% ({f.stage_label})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Chart: Observed vs Projected Forecast */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#242943] pb-3">
              <div>
                <h2 className="text-xs font-mono tracking-wider text-[#A1A1AA] uppercase">
                  State Sequence & Forecast Trajectory
                </h2>
                <p className="text-[11px] text-[#71717A] mt-0.5">
                  Observed historical state series vs. multi-step latent projected trajectory
                </p>
              </div>
              <div className="flex items-center gap-5 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-[#06B6D4]">
                  <span className="w-3 h-0.5 bg-[#06B6D4] inline-block"></span> Observed (Cyan)
                </span>
                <span className="flex items-center gap-1.5 text-[#818CF8]">
                  <span className="w-3 h-0.5 bg-[#6366F1] border-b border-dashed border-[#6366F1] inline-block"></span> Projected Forecast (Indigo)
                </span>
                <span className="flex items-center gap-1.5 text-[#EF4444]">
                  <span className="w-3 h-0.5 bg-[#EF4444] border-b border-dashed border-[#EF4444] inline-block"></span> Critical Threshold (70%)
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#242943" />
                  <XAxis dataKey="name" stroke="#242943" tick={{ fill: '#71717A', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#242943" tick={{ fill: '#71717A', fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F1220',
                      borderColor: '#242943',
                      borderRadius: '4px',
                      color: '#F8FAFC',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}
                  />
                  <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="observedRisk"
                    name="Observed Risk"
                    stroke="#06B6D4"
                    strokeWidth={1.5}
                    dot={{ fill: '#06B6D4', r: 2.5 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecastRisk"
                    name="Predicted Risk"
                    stroke="#6366F1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ fill: '#6366F1', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Kill-Chain Progression Rail */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono tracking-wider text-[#A1A1AA] uppercase">
              Kill-Chain Progression Rail
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {STAGE_NAMES.map((name, idx) => {
                const isCurrent = prediction.current_stage === idx;
                const isPast = prediction.current_stage > idx;
                const isFuturePredicted = prediction.forecast?.some((f) => f.stage === idx) && !isCurrent && !isPast;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-sm border text-xs transition-all ${
                      isCurrent
                        ? 'border-[#6366F1] bg-[#14182A]'
                        : isPast
                        ? 'border-[#242943] bg-[#0F1220] text-[#71717A]'
                        : isFuturePredicted
                        ? 'border-[#818CF8]/40 bg-[#6366F1]/10 text-[#F8FAFC]'
                        : 'border-[#242943] bg-[#0B0D16] text-[#71717A]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-[#71717A] uppercase font-mono">Stage 0{idx}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono text-[#818CF8] uppercase">Active</span>
                      )}
                      {isFuturePredicted && (
                        <span className="text-[10px] font-mono text-[#6366F1] uppercase">Predicted</span>
                      )}
                    </div>
                    <div className={`font-medium ${isCurrent ? 'text-[#F8FAFC]' : isPast ? 'text-[#71717A]' : 'text-[#F8FAFC]'}`}>
                      {name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analytical Explainability & Decision Support */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Analytical Explainability: Why This Forecast? */}
            <div className="glass-panel p-5 space-y-4">
              <div>
                <h2 className="text-xs font-mono tracking-wider text-[#A1A1AA] uppercase">
                  Why This Forecast?
                </h2>
                <p className="text-[11px] text-[#71717A] mt-0.5">
                  High-contribution telemetry indicators driving latent trajectory output
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {prediction.contributing_features && prediction.contributing_features.length > 0 ? (
                  prediction.contributing_features.map((feat, idx) => {
                    const weightPct = Math.round(feat.contribution * 100);
                    const levelLabel = weightPct >= 20 ? 'High contribution' : weightPct >= 10 ? 'Moderate' : 'Low contribution';

                    return (
                      <div key={idx} className="border-b border-[#242943]/60 pb-2.5 last:border-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-mono text-[#F8FAFC]">{feat.feature}</span>
                          <span className="text-[11px] font-mono text-[#A1A1AA]">{levelLabel} ({weightPct}%)</span>
                        </div>
                        <div className="w-full bg-[#242943] rounded-full h-1">
                          <div
                            className="h-1 rounded-full bg-[#6366F1]"
                            style={{ width: `${Math.min(feat.contribution * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#71717A] font-mono">Telemetry within nominal operational bounds.</p>
                )}
              </div>
            </div>

            {/* Decision Support Playbook */}
            <div className="glass-panel p-5 space-y-4">
              <div>
                <h2 className="text-xs font-mono tracking-wider text-[#A1A1AA] uppercase">
                  Actionable Defence Playbook
                </h2>
                <p className="text-[11px] text-[#71717A] mt-0.5">
                  Pre-emptive containment protocols for {prediction.current_stage_label || prediction.stage_label}
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {getMitigationPlan(prediction.current_stage).map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#0B0D16] border border-[#242943] rounded-sm text-xs">
                    <div className="font-medium text-[#F8FAFC] mb-0.5 font-mono">
                      0{idx + 1}. {item.action}
                    </div>
                    <div className="text-[#A1A1AA] text-[11px]">
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
