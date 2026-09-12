import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getState } from '../api/client';

export default function StateDetail() {
  const { stateId } = useParams();
  const navigate = useNavigate();
  const [stateData, setStateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const result = await getState(stateId);
        setStateData(result);
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchState();
  }, [stateId]);

  if (loading) return <div className="text-center py-12">Loading state data...</div>;
  if (error) return <div className="text-red-500 text-center py-12">Error: {error}</div>;
  if (!stateData) return <div className="text-center py-12">No data found</div>;

  const f = stateData.features || {};

  const formatNum = (val) => typeof val === 'number' ? val.toLocaleString(undefined, {maximumFractionDigits: 4}) : 'N/A';

  const DataRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className="text-gray-900 font-mono text-sm">{value}</span>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-white-200">
      <h3 className="text-md font-semibold text-white-800 mb-4 pb-2 border-b border-white-200">{title}</h3>
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-brand-600 hover:text-brand-800 mb-2">
            &larr; Back to Timeline
          </button>
          <h1 className="text-2xl font-bold text-white-900">Network State Dump</h1>
          <p className="text-gray-500 text-sm font-mono mt-1">ID: {stateId}</p>
        </div>
        <div className="bg-gray-100 px-4 py-2 rounded-lg text-right">
          <div className="text-xs text-gray-500 uppercase">Window {stateData.window_index}</div>
          <div className="text-sm font-medium text-gray-900">{stateData.window_start}</div>
          <div className="text-sm font-medium text-gray-900">{stateData.window_end}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Section title="Volume Metrics">
          <DataRow label="Total Packets" value={formatNum(f.total_packets)} />
          <DataRow label="Total Bytes" value={formatNum(f.total_bytes)} />
          <DataRow label="Unique Src IPs" value={formatNum(f.unique_src_ips)} />
          <DataRow label="Unique Dst IPs" value={formatNum(f.unique_dst_ips)} />
          <DataRow label="Unique Src Ports" value={formatNum(f.unique_src_ports)} />
          <DataRow label="Unique Dst Ports" value={formatNum(f.unique_dst_ports)} />
        </Section>

        <Section title="Throughput">
          <DataRow label="Bytes/sec" value={formatNum(f.bytes_per_second)} />
          <DataRow label="Packets/sec" value={formatNum(f.packets_per_second)} />
          <DataRow label="Flows/sec" value={formatNum(f.flows_per_second)} />
        </Section>

        <Section title="Protocol Mix (Ratio)">
          <DataRow label="TCP" value={formatNum(f.tcp_ratio)} />
          <DataRow label="UDP" value={formatNum(f.udp_ratio)} />
          <DataRow label="ICMP" value={formatNum(f.icmp_ratio)} />
          <DataRow label="Other" value={formatNum(f.other_proto_ratio)} />
        </Section>

        <Section title="Flow Statistics">
          <DataRow label="Active Flows" value={formatNum(f.active_flows)} />
          <DataRow label="Avg Flow Duration (ms)" value={formatNum(f.avg_flow_duration_ms)} />
          <DataRow label="Avg Bytes/Flow" value={formatNum(f.avg_bytes_per_flow)} />
          <DataRow label="Avg Pkts/Flow" value={formatNum(f.avg_pkts_per_flow)} />
          <DataRow label="Max Flow Bytes" value={formatNum(f.max_flow_bytes)} />
          <DataRow label="Max Flow Pkts" value={formatNum(f.max_flow_pkts)} />
          <DataRow label="Avg Asymmetry" value={formatNum(f.avg_bidirectional_asymmetry)} />
        </Section>

        <Section title="TCP Features">
          <DataRow label="TCP Packet Count" value={formatNum(f.tcp_packet_count)} />
          <DataRow label="SYN Rate" value={formatNum(f.syn_rate)} />
          <DataRow label="FIN Rate" value={formatNum(f.fin_rate)} />
          <DataRow label="RST Rate" value={formatNum(f.rst_rate)} />
          <DataRow label="ACK Ratio" value={formatNum(f.ack_ratio)} />
        </Section>

        <Section title="Entropy Metrics">
          <DataRow label="Dst Port Entropy" value={formatNum(f.dst_port_entropy)} />
          <DataRow label="Src IP Entropy" value={formatNum(f.src_ip_entropy)} />
          <DataRow label="Dst IP Entropy" value={formatNum(f.dst_ip_entropy)} />
        </Section>

        <Section title="Service Mix (Ratio)">
          <DataRow label="Web (HTTP/S)" value={formatNum(f.web_ratio)} />
          <DataRow label="DNS" value={formatNum(f.dns_ratio)} />
          <DataRow label="SSH" value={formatNum(f.ssh_ratio)} />
          <DataRow label="SMTP" value={formatNum(f.smtp_ratio)} />
          <DataRow label="FTP" value={formatNum(f.ftp_ratio)} />
          <DataRow label="Email (Other)" value={formatNum(f.email_ratio)} />
          <DataRow label="Other Services" value={formatNum(f.other_ratio)} />
        </Section>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Section title="Top Source IPs">
            <div className="flex flex-col gap-1">
              {(f.top_src_ips || []).map((ip, i) => (
                <div key={i} className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">{i+1}. {ip}</div>
              ))}
              {(!f.top_src_ips || f.top_src_ips.length === 0) && <div className="text-sm text-gray-400">None</div>}
            </div>
          </Section>
          <Section title="Top Destination IPs">
            <div className="flex flex-col gap-1">
              {(f.top_dst_ips || []).map((ip, i) => (
                <div key={i} className="text-sm font-mono bg-brand-50 text-brand-900 px-2 py-1 rounded">{i+1}. {ip}</div>
              ))}
              {(!f.top_dst_ips || f.top_dst_ips.length === 0) && <div className="text-sm text-gray-400">None</div>}
            </div>
          </Section>
        </div>

      </div>
    </div>
  );
}
