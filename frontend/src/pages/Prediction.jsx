import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPrediction, listJobs, getStages } from '../api/client';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  ShieldExclamationIcon, ShieldCheckIcon, ArrowTrendingUpIcon,
  AdjustmentsHorizontalIcon, SparklesIcon, ExclamationTriangleIcon,
  CheckCircleIcon, ArrowPathIcon
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

  // Sync selected job ID from URL param
  useEffect(() => {
    if (routeJobId) {
      setSelectedJobId(routeJobId);
    }
  }, [routeJobId]);

  // Fetch stages definition
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

  // Fetch prediction data
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

  const getStageColor = (stageIdx) => {
    const colors = [
      '#10b981', // Normal (Green)
      '#f59e0b', // Recon (Yellow)
      '#f97316', // Initial Access (Orange)
      '#ef4444', // Lateral Movement (Red)
      '#a855f7'  // C2/Exfil (Purple)
    ];
    return colors[stageIdx] || '#06b6d4';
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
          { action: "Inspect Auth Endpoints", detail: "Monitor SSH / RDP / Web auth endpoints for credential brute forcing." },
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
          { action: "Deep Packet Inspection on Egress", detail: "Inspect asymmetric large outbound data streams for exfiltration patterns." },
          { action: "Trigger Incident Response", detail: "Initiate Tier 3 incident triage and preserve memory forensics." }
        ];
      default:
        return [
          { action: "Baseline Monitoring", detail: "Traffic metrics within normal baseline operational limits. Continuous telemetry active." },
          { action: "Automated Policy Verification", detail: "Firewall rule verification and continuous state snapshot ingestion." }
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
        type: 'historical'
      });
    });
  }

  if (prediction?.forecast && chartData.length > 0) {
    // Add current risk as connection bridge
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
    "C2 / Exfiltration"
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Control Strip */}
      <div className="card p-6 border border-cyan-500/30 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-8 h-8 text-cyan-400 animate-pulse" />
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400">
              AI Network Attack Forecasting
            </h1>
          </div>
          <p className="text-sm text-cyan-100/70 mt-1">
            Temporal World Model · Recurrent K-Step Risk Projection · MITRE ATT&CK Mapping
          </p>
        </div>

        {/* Job Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-wider text-cyan-300 font-semibold">
            Active Job:
          </label>
          <select
            value={selectedJobId}
            onChange={handleJobChange}
            className="bg-black/60 border border-cyan-500/50 rounded-lg px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-400"
          >
            {jobs.length === 0 && <option value="">No completed jobs available</option>}
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.filename} ({j.window_seconds}s win) — {j.id.substring(0, 8)}...
              </option>
            ))}
          </select>
          {selectedJobId && (
            <Link
              to={`/jobs/${selectedJobId}/timeline`}
              className="px-3 py-2 text-xs border border-cyan-400/40 rounded-lg text-cyan-300 hover:bg-cyan-500/20 transition-colors"
            >
              Timeline →
            </Link>
          )}
          {selectedJobId && (
            <Link
              to={`/jobs/${selectedJobId}/benchmark`}
              className="px-3 py-2 text-xs border border-purple-400/40 rounded-lg text-purple-300 hover:bg-purple-500/20 transition-colors"
            >
              Benchmark ⚔️
            </Link>
          )}
        </div>
      </div>

      {/* Control Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-cyan-200">
              Sequence Context Window: <span className="font-bold text-cyan-400">{sequenceLength} states</span>
            </span>
            <span className="text-xs text-gray-400">Historical states fed into World Model</span>
          </div>
          <input
            type="range"
            min="3"
            max="30"
            step="1"
            value={sequenceLength}
            onChange={(e) => setSequenceLength(Number(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        <div className="card p-4 border border-purple-500/20 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-purple-200">
              Forecast Horizon (K-Steps): <span className="font-bold text-purple-400">+{forecastSteps} windows</span>
            </span>
            <span className="text-xs text-gray-400">Future temporal states projected</span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            step="1"
            value={forecastSteps}
            onChange={(e) => setForecastSteps(Number(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
          />
        </div>
      </div>

      {loading && (
        <div className="card p-12 text-center border border-cyan-500/30">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-200 text-lg">Running Temporal World Model Inference...</p>
          <p className="text-xs text-gray-400 mt-1">Projecting latent risk states across +{forecastSteps} future windows</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/40 border border-red-500 rounded-xl text-red-200 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0 text-red-400" />
          <div>
            <p className="font-semibold">Inference Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {prediction && !loading && (
        <>
          {/* Executive Risk Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Risk Gauge */}
            <div className="card p-5 border border-cyan-500/30 flex flex-col justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Current Risk Score
              </div>
              <div className="my-3 flex items-baseline gap-2">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-red-400">
                  {Math.round(prediction.current_risk * 100)}%
                </span>
                <span className="text-xs text-gray-400">({prediction.current_risk.toFixed(2)})</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${prediction.current_risk * 100}%`,
                    backgroundColor: getStageColor(prediction.current_stage)
                  }}
                />
              </div>
            </div>

            {/* MITRE ATT&CK Stage */}
            <div className="card p-5 border border-cyan-500/30 flex flex-col justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Predicted Attack Stage
              </div>
              <div className="my-3">
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm font-bold border"
                  style={{
                    color: getStageColor(prediction.current_stage),
                    borderColor: `${getStageColor(prediction.current_stage)}66`,
                    backgroundColor: `${getStageColor(prediction.current_stage)}18`
                  }}
                >
                  Stage {prediction.current_stage}: {prediction.current_stage_label || prediction.stage_label}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Confidence: <span className="text-cyan-300 font-semibold">{Math.round(prediction.stage_confidence * 100)}%</span>
              </div>
            </div>

            {/* Attack Trajectory Trend */}
            <div className="card p-5 border border-cyan-500/30 flex flex-col justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Trajectory Trend
              </div>
              <div className="my-3 flex items-center gap-2">
                {prediction.forecast && prediction.forecast.length > 0 && (
                  prediction.forecast[prediction.forecast.length - 1].risk > prediction.current_risk ? (
                    <>
                      <ArrowTrendingUpIcon className="w-7 h-7 text-red-400" />
                      <span className="text-lg font-bold text-red-400">Escalating</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-7 h-7 text-green-400" />
                      <span className="text-lg font-bold text-green-400">Stable / Subsiding</span>
                    </>
                  )
                )}
              </div>
              <div className="text-xs text-gray-400">
                Projected +{forecastSteps * (prediction.window_seconds || 60)}s horizon
              </div>
            </div>

            {/* Processed Windows */}
            <div className="card p-5 border border-cyan-500/30 flex flex-col justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Sequence Telemetry
              </div>
              <div className="my-3">
                <span className="text-3xl font-bold text-cyan-200">
                  {prediction.context_states || prediction.sequence_length_used}
                </span>
                <span className="text-xs text-gray-400 ml-2">/ {prediction.total_states} total windows</span>
              </div>
              <div className="text-xs text-gray-400">
                Resolution: {prediction.window_seconds}s per window
              </div>
            </div>
          </div>

          {/* Interactive Trajectory Forecast Chart */}
          <div className="card p-6 border border-cyan-500/30">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-cyan-100 flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="w-5 h-5 text-cyan-400" />
                  K-Step Attack Risk Trajectory & Forecast
                </h3>
                <p className="text-xs text-gray-400">
                  Solid cyan: observed state sequence · Dotted magenta: predicted future states [t+1 … t+{forecastSteps}]
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block"></span> Observed History
                </span>
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-3 h-3 rounded-full bg-purple-400 inline-block"></span> Predicted Future
                </span>
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="w-3 h-0.5 bg-red-400 inline-block"></span> Critical Alert Level (70%)
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="observedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#00f5ff" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff00d4" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#ff00d4" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 15, 25, 0.95)',
                      borderColor: 'rgba(0, 245, 255, 0.4)',
                      borderRadius: '8px',
                      color: '#e2e8f0'
                    }}
                  />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Critical Threshold', fill: '#ef4444', fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="observedRisk"
                    name="Observed Risk"
                    stroke="#00f5ff"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#observedGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="forecastRisk"
                    name="Forecasted Risk"
                    stroke="#ff00d4"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ fill: '#ff00d4', r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MITRE ATT&CK Progression Pipeline */}
          <div className="card p-6 border border-cyan-500/30">
            <h3 className="text-xl font-bold text-cyan-100 mb-4 flex items-center gap-2">
              <ShieldExclamationIcon className="w-5 h-5 text-cyan-400" />
              MITRE ATT&CK Stage Progression Pathway
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {STAGE_NAMES.map((name, idx) => {
                const isCurrent = prediction.current_stage === idx;
                const isPast = prediction.current_stage > idx;
                const isFuturePredicted = prediction.forecast?.some(f => f.stage === idx) && !isCurrent && !isPast;
                const color = getStageColor(idx);

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-2 scale-105 shadow-[0_0_20px_rgba(0,245,255,0.3)] bg-cyan-950/40'
                        : isPast
                        ? 'border-gray-700 bg-black/40 opacity-70'
                        : isFuturePredicted
                        ? 'border-dashed border-purple-400/80 bg-purple-950/20'
                        : 'border-gray-800 bg-black/30 opacity-40'
                    }`}
                    style={{ borderColor: isCurrent ? color : undefined }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/60 text-gray-300">
                        Phase {idx}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-cyan-500 text-black">
                          ACTIVE
                        </span>
                      )}
                      {isFuturePredicted && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-purple-500/40 text-purple-200">
                          PREDICTED
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm text-gray-100 mb-1">{name}</div>
                    <div className="text-[11px] text-gray-400">
                      {idx === 0 && "Normal baseline activity, standard port & volume distributions."}
                      {idx === 1 && "Port scanning, IP sweeping, elevated SYN packets, high port entropy."}
                      {idx === 2 && "Brute force attempts, active connection flooding, anomalous RSTs."}
                      {idx === 3 && "Internal reconnaissance, east-west host probing, asymmetric flows."}
                      {idx === 4 && "Large outbound transfers, anomalous beaconing on C2 high ports."}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explainability & Feature Attribution + Mitigation Playbook */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Explainability */}
            <div className="card p-6 border border-cyan-500/30">
              <h3 className="text-xl font-bold text-cyan-100 mb-2 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-cyan-400" />
                Feature Attribution & Explainability (XAI)
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Telemetry features with highest attribution weight contributing to the forecast.
              </p>

              <div className="space-y-3">
                {prediction.contributing_features && prediction.contributing_features.length > 0 ? (
                  prediction.contributing_features.map((feat, idx) => (
                    <div key={idx} className="bg-black/40 p-3 rounded-lg border border-gray-800">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-cyan-200">{feat.feature}</span>
                        <span className="text-purple-300 font-bold">{Math.round(feat.contribution * 100)}% Weight</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                          style={{ width: `${Math.min(feat.contribution * 100, 100)}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        Observed value: <span className="text-gray-200 font-mono">{typeof feat.value === 'number' ? feat.value.toFixed(4) : feat.value}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">All features within nominal baseline bounds.</p>
                )}
              </div>

              {prediction.model_note && (
                <div className="mt-4 p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-lg text-xs text-cyan-200/80">
                  ℹ️ {prediction.model_note}
                </div>
              )}
            </div>

            {/* Defensive Countermeasures */}
            <div className="card p-6 border border-cyan-500/30">
              <h3 className="text-xl font-bold text-cyan-100 mb-2 flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                Recommended Defensive Countermeasures
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Automated response playbook generated for Phase {prediction.current_stage} ({prediction.current_stage_label}).
              </p>

              <div className="space-y-3">
                {getMitigationPlan(prediction.current_stage).map((item, idx) => (
                  <div key={idx} className="bg-black/40 p-3 rounded-lg border border-gray-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-cyan-200">{item.action}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.detail}</div>
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
