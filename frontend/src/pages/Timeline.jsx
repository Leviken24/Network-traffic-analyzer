import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTimeline } from '../api/client';
import TimelineSlider from '../components/TimelineSlider';
import FeatureChart from '../components/FeatureChart';
import ProtocolPie from '../components/ProtocolPie';
import EntropyGauge from '../components/EntropyGauge';

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

  if (loading) return <div className="text-center py-12">Loading timeline...</div>;
  if (error) return <div className="text-red-500 text-center py-12">Error: {error}</div>;
  if (!data) return <div className="text-center py-12">No data found</div>;

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
    <div>
      <div className="mb-6">
        <Link to="/jobs" className="text-sm text-brand-600 hover:text-brand-800 mb-2 inline-block">
          &larr; Back to Jobs
        </Link>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Network Timeline</h1>
            <p className="text-gray-500 text-sm">Job: {jobId}</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <div className="text-gray-500">Total Packets</div>
              <div className="font-semibold text-gray-900">{timeline.total_packets?.toLocaleString() || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Total Flows</div>
              <div className="font-semibold text-gray-900">{timeline.total_flows?.toLocaleString() || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">States</div>
              <div className="font-semibold text-gray-900">{states.length}</div>
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
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold text-gray-800">State Details (Win #{selectedState.window_index})</h2>
              <p className="text-sm text-gray-500">
                {selectedState.window_start.substring(0, 19).replace('T', ' ')} &rarr; {selectedState.window_end.substring(0, 19).replace('T', ' ')}
              </p>
            </div>
            <Link 
              to={`/states/${selectedState.id}`}
              className="text-sm text-brand-600 hover:text-brand-800 border border-brand-200 px-3 py-1.5 rounded-md hover:bg-brand-50"
            >
              View Full State Data &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Packets</div>
              <div className="text-3xl font-bold text-brand-600">{formatNumber(selectedState.features.total_packets)}</div>
              <div className="text-xs text-gray-400 mt-2">{formatNumber(selectedState.features.packets_per_second)} pkts/s</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Bytes</div>
              <div className="text-3xl font-bold text-green-600">{formatBytes(selectedState.features.total_bytes)}</div>
              <div className="text-xs text-gray-400 mt-2">{formatBytes(selectedState.features.bytes_per_second)}/s</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <div className="text-sm font-medium text-gray-500 mb-1">Active Flows</div>
              <div className="text-3xl font-bold text-purple-600">{formatNumber(selectedState.features.active_flows)}</div>
              <div className="text-xs text-gray-400 mt-2">{formatNumber(selectedState.features.flows_per_second)} flows/s</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 h-80">
              <ProtocolPie features={selectedState.features} />
            </div>
            <div className="lg:col-span-2 h-80">
              <FeatureChart title="Volume Metrics" data={volumeData} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-80">
              <EntropyGauge features={selectedState.features} />
            </div>
            <div className="h-80">
              <FeatureChart title="TCP Flag Rates" data={tcpFlagData} />
            </div>
            <div className="h-80">
              <FeatureChart title="Service Mix (%)" data={serviceData} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Top Source IPs</h3>
              <div className="flex flex-wrap gap-2">
                {(selectedState.features.top_src_ips || []).map((ip, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-sm font-mono rounded border border-gray-200">
                    {ip}
                  </span>
                ))}
                {(!selectedState.features.top_src_ips || selectedState.features.top_src_ips.length === 0) && (
                  <span className="text-gray-400 text-sm">None recorded</span>
                )}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Top Dest IPs</h3>
              <div className="flex flex-wrap gap-2">
                {(selectedState.features.top_dst_ips || []).map((ip, i) => (
                  <span key={i} className="px-2.5 py-1 bg-brand-50 text-brand-700 text-sm font-mono rounded border border-brand-200">
                    {ip}
                  </span>
                ))}
                {(!selectedState.features.top_dst_ips || selectedState.features.top_dst_ips.length === 0) && (
                  <span className="text-gray-400 text-sm">None recorded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
