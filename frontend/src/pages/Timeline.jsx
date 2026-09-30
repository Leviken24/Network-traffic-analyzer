import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTimeline } from '../api/client';
import TimelineSlider from '../components/TimelineSlider';
import FeatureChart from '../components/FeatureChart';
import ProtocolPie from '../components/ProtocolPie';
import EntropyGauge from '../components/EntropyGauge';
import { SparklesIcon, ScaleIcon, ClockIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Timeline() {
  const { jobId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStateId, setSelectedStateId] = useState(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const result = await getTimeline(jobId);
        setData(result);
        if (result?.states?.length > 0) {
          setSelectedStateId(result.states[0].id);
        }
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [jobId]);

  if (loading) return <div className="text-center py-12 text-cyan-300">Loading timeline telemetry...</div>;
  if (error) return <div className="text-red-400 text-center py-12">Error: {error}</div>;
  if (!data) return <div className="text-center py-12 text-gray-400">No data found</div>;

  const { timeline, states } = data;
  const selectedState = states.find(s => s.id === selectedStateId) || states[0];

  const volumeData = selectedState ? [
    { name: 'Packets', value: selectedState.features.total_packets },
    { name: 'Flows', value: selectedState.features.active_flows },
    { name: 'Src IPs', value: selectedState.features.unique_src_ips },
    { name: 'Dst IPs', value: selectedState.features.unique_dst_ips },
  ] : [];

  const tcpFlagData = selectedState ? [
    { name: 'SYN', value: selectedState.features.syn_rate },
    { name: 'FIN', value: selectedState.features.fin_rate },
    { name: 'RST', value: selectedState.features.rst_rate },
  ] : [];

  const serviceData = selectedState ? [
    { name: 'WEB', value: selectedState.features.web_ratio * 100 },
    { name: 'DNS', value: selectedState.features.dns_ratio * 100 },
    { name: 'SSH', value: selectedState.features.ssh_ratio * 100 },
    { name: 'SMTP', value: selectedState.features.smtp_ratio * 100 },
    { name: 'FTP', value: selectedState.features.ftp_ratio * 100 },
  ] : [];

  const formatNumber = (num) => num ? num.toLocaleString(undefined, {maximumFractionDigits: 2}) : '0';
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <Link to="/jobs" className="text-xs text-cyan-400 hover:text-cyan-300 mb-3 inline-flex items-center gap-1 font-semibold">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Jobs
        </Link>
        <div className="card p-6 border border-cyan-500/30 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Network State Timeline
            </h1>
            <p className="text-gray-400 text-xs font-mono mt-0.5">Job ID: {jobId}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/jobs/${jobId}/predict`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600/30 text-purple-300 border border-purple-500/50 hover:bg-purple-600/40 text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            >
              <SparklesIcon className="w-4 h-4 text-purple-400" />
              Attack Forecast 🔮
            </Link>
            <Link
              to={`/jobs/${jobId}/benchmark`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-black/60 text-gray-300 border border-gray-700 hover:bg-black/80 text-xs font-bold transition-all"
            >
              <ScaleIcon className="w-4 h-4 text-gray-400" />
              Benchmark ⚔️
            </Link>
          </div>

          <div className="flex gap-6 text-xs border-t border-gray-800 pt-3 sm:border-0 sm:pt-0 w-full sm:w-auto">
            <div className="text-center">
              <div className="text-gray-400">Total Packets</div>
              <div className="font-bold text-cyan-300 text-base">{timeline.total_packets?.toLocaleString() || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Total Flows</div>
              <div className="font-bold text-purple-300 text-base">{timeline.total_flows?.toLocaleString() || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">States</div>
              <div className="font-bold text-pink-300 text-base">{states.length}</div>
            </div>
          </div>
        </div>
      </div>

      <TimelineSlider 
        states={states} 
        selectedStateId={selectedStateId} 
        onSelectState={setSelectedStateId} 
      />

      {selectedState && (
        <div className="space-y-6">
          <div className="flex justify-between items-end flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-cyan-200">
                Extracted State Telemetry (Window #{selectedState.window_index})
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                {selectedState.window_start?.substring(0, 19).replace('T', ' ')} &rarr; {selectedState.window_end?.substring(0, 19).replace('T', ' ')}
              </p>
            </div>
            <Link 
              to={`/states/${selectedState.id}`}
              className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-950/50"
            >
              View Full Raw JSON &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5 border border-cyan-500/25 text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Window Packets</div>
              <div className="text-3xl font-extrabold text-cyan-400">{formatNumber(selectedState.features.total_packets)}</div>
              <div className="text-xs text-gray-500 mt-1">{formatNumber(selectedState.features.packets_per_second)} pkts/s</div>
            </div>
            <div className="card p-5 border border-purple-500/25 text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Window Bytes</div>
              <div className="text-3xl font-extrabold text-purple-400">{formatBytes(selectedState.features.total_bytes)}</div>
              <div className="text-xs text-gray-500 mt-1">{formatBytes(selectedState.features.bytes_per_second)}/s</div>
            </div>
            <div className="card p-5 border border-pink-500/25 text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Active Flows</div>
              <div className="text-3xl font-extrabold text-pink-400">{formatNumber(selectedState.features.active_flows)}</div>
              <div className="text-xs text-gray-500 mt-1">{formatNumber(selectedState.features.flows_per_second)} flows/s</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 h-80 card p-4 border border-cyan-500/25">
              <ProtocolPie features={selectedState.features} />
            </div>
            <div className="lg:col-span-2 h-80 card p-4 border border-cyan-500/25">
              <FeatureChart title="Volume Metrics" data={volumeData} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-80 card p-4 border border-cyan-500/25">
              <EntropyGauge features={selectedState.features} />
            </div>
            <div className="h-80 card p-4 border border-cyan-500/25">
              <FeatureChart title="TCP Flag Rates" data={tcpFlagData} />
            </div>
            <div className="h-80 card p-4 border border-cyan-500/25">
              <FeatureChart title="Service Mix (%)" data={serviceData} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4 border border-cyan-500/25">
              <h3 className="text-xs font-bold text-cyan-300 mb-3 uppercase tracking-wider">Top Source IPs</h3>
              <div className="flex flex-wrap gap-2">
                {(selectedState.features.top_src_ips || []).map((ip, i) => (
                  <span key={i} className="px-2.5 py-1 bg-black/60 text-cyan-200 text-xs font-mono rounded border border-cyan-800">
                    {ip}
                  </span>
                ))}
                {(!selectedState.features.top_src_ips || selectedState.features.top_src_ips.length === 0) && (
                  <span className="text-gray-500 text-xs">None recorded</span>
                )}
              </div>
            </div>
            <div className="card p-4 border border-purple-500/25">
              <h3 className="text-xs font-bold text-purple-300 mb-3 uppercase tracking-wider">Top Dest IPs</h3>
              <div className="flex flex-wrap gap-2">
                {(selectedState.features.top_dst_ips || []).map((ip, i) => (
                  <span key={i} className="px-2.5 py-1 bg-black/60 text-purple-200 text-xs font-mono rounded border border-purple-800">
                    {ip}
                  </span>
                ))}
                {(!selectedState.features.top_dst_ips || selectedState.features.top_dst_ips.length === 0) && (
                  <span className="text-gray-500 text-xs">None recorded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
