import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTimeline } from '../api/client';
import TimelineSlider from '../components/TimelineSlider';
import FeatureChart from '../components/FeatureChart';
import ProtocolPie from '../components/ProtocolPie';
import EntropyGauge from '../components/EntropyGauge';
import { ArrowLeftIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

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

  if (loading) return <div className="text-center py-16 text-xs text-[#71717A] font-mono">Loading timeline telemetry...</div>;
  if (error) return <div className="text-[#EF4444] text-center py-16 text-xs font-mono">Error: {error}</div>;
  if (!data) return <div className="text-center py-16 text-xs text-[#71717A] font-mono">No data found</div>;

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

  const formatNumber = (num) => num ? num.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '0';
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Back and Title Header */}
      <div>
        <Link to="/jobs" className="text-xs text-[#71717A] hover:text-[#818CF8] mb-2 inline-flex items-center gap-1 font-mono transition-colors">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Jobs
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#242943] pb-4">
          <div>
            <div className="text-[10px] font-mono tracking-wider text-[#6366F1] uppercase mb-1">
              Temporal Window Inspection
            </div>
            <h1 className="text-xl font-light text-[#F8FAFC] tracking-tight">
              Network State Timeline
            </h1>
            <p className="text-xs text-[#71717A] font-mono mt-0.5">Session: {jobId}</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono border-t border-[#242943] pt-3 md:border-0 md:pt-0">
            <div>
              <span className="text-[#71717A]">Packets:</span>{' '}
              <span className="text-[#F8FAFC] font-mono">{timeline.total_packets?.toLocaleString() || 0}</span>
            </div>
            <div>
              <span className="text-[#71717A]">Flows:</span>{' '}
              <span className="text-[#F8FAFC] font-mono">{timeline.total_flows?.toLocaleString() || 0}</span>
            </div>
            <div>
              <span className="text-[#71717A]">Windows:</span>{' '}
              <span className="text-[#F8FAFC] font-mono">{states.length}</span>
            </div>
            <Link
              to={`/jobs/${jobId}/predict`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#6366F1]/10 hover:bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30 transition-all font-mono"
            >
              <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
              Forecast
            </Link>
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
          <div className="flex justify-between items-center border-b border-[#242943] pb-3">
            <div>
              <h2 className="text-xs font-mono tracking-wider text-[#A1A1AA] uppercase">
                Window #{selectedState.window_index} Telemetry
              </h2>
              <p className="text-[11px] text-[#71717A] font-mono mt-0.5">
                {selectedState.window_start?.substring(11, 19)} &rarr; {selectedState.window_end?.substring(11, 19)}
              </p>
            </div>
            <Link 
              to={`/states/${selectedState.id}`}
              className="text-[11px] text-[#818CF8] hover:underline font-mono"
            >
              Raw State Dump &rarr;
            </Link>
          </div>

          {/* Window Metrics Row: Directly on page with hairline dividers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-2 border-b border-[#242943]">
            <div>
              <div className="text-[10px] font-mono text-[#71717A] uppercase">Window Volume</div>
              <div className="text-2xl font-light text-[#F8FAFC] font-mono mt-1">{formatNumber(selectedState.features.total_packets)} <span className="text-xs text-[#71717A]">pkts</span></div>
              <div className="text-[11px] text-[#A1A1AA] font-mono mt-0.5">{formatNumber(selectedState.features.packets_per_second)} pkts/sec</div>
            </div>
            <div className="sm:border-l sm:border-[#242943] sm:pl-6">
              <div className="text-[10px] font-mono text-[#71717A] uppercase">Throughput Bandwidth</div>
              <div className="text-2xl font-light text-[#F8FAFC] font-mono mt-1">{formatBytes(selectedState.features.total_bytes)}</div>
              <div className="text-[11px] text-[#A1A1AA] font-mono mt-0.5">{formatBytes(selectedState.features.bytes_per_second)}/sec</div>
            </div>
            <div className="sm:border-l sm:border-[#242943] sm:pl-6">
              <div className="text-[10px] font-mono text-[#71717A] uppercase">Active Concurrency</div>
              <div className="text-2xl font-light text-[#F8FAFC] font-mono mt-1">{formatNumber(selectedState.features.active_flows)} <span className="text-xs text-[#71717A]">flows</span></div>
              <div className="text-[11px] text-[#A1A1AA] font-mono mt-0.5">{formatNumber(selectedState.features.flows_per_second)} flows/sec</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 min-h-[260px]">
              <ProtocolPie features={selectedState.features} />
            </div>
            <div className="lg:col-span-2 min-h-[260px]">
              <FeatureChart title="Volume Metrics" data={volumeData} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="min-h-[260px]">
              <EntropyGauge features={selectedState.features} />
            </div>
            <div className="min-h-[260px]">
              <FeatureChart title="TCP Flag Rates" data={tcpFlagData} />
            </div>
            <div className="min-h-[260px]">
              <FeatureChart title="Service Mix (%)" data={serviceData} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-4">
              <h3 className="text-xs font-mono text-[#A1A1AA] mb-2 uppercase tracking-wider">Top Source IPs</h3>
              <div className="flex flex-wrap gap-1.5">
                {(selectedState.features.top_src_ips || []).map((ip, i) => (
                  <span key={i} className="px-2 py-0.5 bg-[#0B0D16] text-[#F8FAFC] text-xs font-mono rounded-sm border border-[#242943]">
                    {ip}
                  </span>
                ))}
                {(!selectedState.features.top_src_ips || selectedState.features.top_src_ips.length === 0) && (
                  <span className="text-[#71717A] text-xs font-mono">None recorded</span>
                )}
              </div>
            </div>
            <div className="glass-panel p-4">
              <h3 className="text-xs font-mono text-[#A1A1AA] mb-2 uppercase tracking-wider">Top Destination IPs</h3>
              <div className="flex flex-wrap gap-1.5">
                {(selectedState.features.top_dst_ips || []).map((ip, i) => (
                  <span key={i} className="px-2 py-0.5 bg-[#0B0D16] text-[#F8FAFC] text-xs font-mono rounded-sm border border-[#242943]">
                    {ip}
                  </span>
                ))}
                {(!selectedState.features.top_dst_ips || selectedState.features.top_dst_ips.length === 0) && (
                  <span className="text-[#71717A] text-xs font-mono">None recorded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
