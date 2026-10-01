import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTimeline } from '../api/client';
import TimelineSlider from '../components/TimelineSlider';
import FeatureChart from '../components/FeatureChart';
import ProtocolPie from '../components/ProtocolPie';
import EntropyGauge from '../components/EntropyGauge';
import { ArrowLeftIcon, ArrowTrendingUpIcon, ScaleIcon } from '@heroicons/react/24/outline';

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

  if (loading) return <div className="text-center py-12 text-xs text-[#71717A]">Loading timeline telemetry...</div>;
  if (error) return <div className="text-[#EF4444] text-center py-12 text-xs">Error: {error}</div>;
  if (!data) return <div className="text-center py-12 text-xs text-[#71717A]">No data found</div>;

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
    <div className="space-y-6">
      {/* Back and Title Header */}
      <div>
        <Link to="/jobs" className="text-xs text-[#A1A1AA] hover:text-[#F8FAFC] mb-2 inline-flex items-center gap-1 font-medium">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Jobs
        </Link>
        <div className="card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#F8FAFC]">
              Network State Timeline
            </h1>
            <p className="text-xs text-[#71717A] font-mono mt-0.5">Session ID: {jobId}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/jobs/${jobId}/predict`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#6366F1] text-white text-xs font-medium hover:bg-[#4F46E5] transition-colors"
            >
              <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-white" />
              Attack Forecast
            </Link>
            <Link
              to={`/jobs/${jobId}/benchmark`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#14182A] border border-[#242943] text-[#F8FAFC] text-xs font-medium hover:bg-[#1E2337] transition-colors"
            >
              <ScaleIcon className="w-3.5 h-3.5 text-[#A1A1AA]" />
              Benchmark
            </Link>
          </div>

          <div className="flex gap-6 text-xs border-t border-[#242943] pt-3 md:border-0 md:pt-0">
            <div>
              <div className="text-[#A1A1AA]">Total Packets</div>
              <div className="font-semibold text-[#F8FAFC] text-sm">{timeline.total_packets?.toLocaleString() || 0}</div>
            </div>
            <div>
              <div className="text-[#A1A1AA]">Total Flows</div>
              <div className="font-semibold text-[#F8FAFC] text-sm">{timeline.total_flows?.toLocaleString() || 0}</div>
            </div>
            <div>
              <div className="text-[#A1A1AA]">Time Windows</div>
              <div className="font-semibold text-[#F8FAFC] text-sm">{states.length}</div>
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-[#F8FAFC] uppercase tracking-wider">
                Window #{selectedState.window_index} Telemetry
              </h2>
              <p className="text-xs text-[#71717A] font-mono mt-0.5">
                {selectedState.window_start?.substring(11, 19)} &rarr; {selectedState.window_end?.substring(11, 19)}
              </p>
            </div>
            <Link 
              to={`/states/${selectedState.id}`}
              className="text-xs text-[#818CF8] hover:text-[#6366F1] border border-[#242943] px-3 py-1.5 rounded bg-[#14182A] hover:bg-[#1E2337] font-medium"
            >
              Raw State Dump &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">Window Packets</div>
              <div className="text-2xl font-bold text-[#F8FAFC] mt-1">{formatNumber(selectedState.features.total_packets)}</div>
              <div className="text-xs text-[#71717A] mt-0.5">{formatNumber(selectedState.features.packets_per_second)} pkts/sec</div>
            </div>
            <div className="card p-4">
              <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">Window Bytes</div>
              <div className="text-2xl font-bold text-[#F8FAFC] mt-1">{formatBytes(selectedState.features.total_bytes)}</div>
              <div className="text-xs text-[#71717A] mt-0.5">{formatBytes(selectedState.features.bytes_per_second)}/sec</div>
            </div>
            <div className="card p-4">
              <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">Active Flows</div>
              <div className="text-2xl font-bold text-[#F8FAFC] mt-1">{formatNumber(selectedState.features.active_flows)}</div>
              <div className="text-xs text-[#71717A] mt-0.5">{formatNumber(selectedState.features.flows_per_second)} flows/sec</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 min-h-[280px]">
              <ProtocolPie features={selectedState.features} />
            </div>
            <div className="lg:col-span-2 min-h-[280px]">
              <FeatureChart title="Volume Metrics" data={volumeData} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="min-h-[280px]">
              <EntropyGauge features={selectedState.features} />
            </div>
            <div className="min-h-[280px]">
              <FeatureChart title="TCP Flag Rates" data={tcpFlagData} />
            </div>
            <div className="min-h-[280px]">
              <FeatureChart title="Service Mix (%)" data={serviceData} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-[#F8FAFC] mb-2 uppercase tracking-wider">Top Source IPs</h3>
              <div className="flex flex-wrap gap-1.5">
                {(selectedState.features.top_src_ips || []).map((ip, i) => (
                  <span key={i} className="px-2 py-0.5 bg-[#14182A] text-[#F8FAFC] text-xs font-mono rounded border border-[#242943]">
                    {ip}
                  </span>
                ))}
                {(!selectedState.features.top_src_ips || selectedState.features.top_src_ips.length === 0) && (
                  <span className="text-[#71717A] text-xs">None recorded</span>
                )}
              </div>
            </div>
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-[#F8FAFC] mb-2 uppercase tracking-wider">Top Destination IPs</h3>
              <div className="flex flex-wrap gap-1.5">
                {(selectedState.features.top_dst_ips || []).map((ip, i) => (
                  <span key={i} className="px-2 py-0.5 bg-[#14182A] text-[#F8FAFC] text-xs font-mono rounded border border-[#242943]">
                    {ip}
                  </span>
                ))}
                {(!selectedState.features.top_dst_ips || selectedState.features.top_dst_ips.length === 0) && (
                  <span className="text-[#71717A] text-xs">None recorded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
