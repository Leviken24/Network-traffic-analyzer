import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getState } from '../api/client';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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

  if (loading) return <div className="text-center py-12 text-xs text-slate-500">Loading state telemetry...</div>;
  if (error) return <div className="text-rose-600 text-center py-12 text-xs">Error: {error}</div>;
  if (!stateData) return <div className="text-center py-12 text-xs text-slate-500">No data found</div>;

  const f = stateData.features || {};

  const formatNum = (val) => typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 4 }) : 'N/A';

  const DataRow = ({ label, value }) => (
    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0 text-xs">
      <span className="text-slate-600">{label}</span>
      <span className="text-[#0F3D56] font-mono font-medium">{value}</span>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="card p-4">
      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">{title}</h3>
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="text-xs text-slate-500 hover:text-[#0F3D56] mb-2 inline-flex items-center gap-1 font-medium"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Timeline
          </button>
          <h1 className="text-xl font-bold text-[#0F3D56]">Network State Telemetry</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">State ID: {stateId}</p>
        </div>

        <div className="bg-white border border-slate-200 px-3.5 py-2 rounded text-right text-xs">
          <div className="text-slate-400 font-medium">Window #{stateData.window_index}</div>
          <div className="font-mono text-[#0F3D56] font-medium">{stateData.window_start?.substring(0, 19).replace('T', ' ')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Section title="Volume Metrics">
          <DataRow label="Total Packets" value={formatNum(f.total_packets)} />
          <DataRow label="Total Bytes" value={formatNum(f.total_bytes)} />
          <DataRow label="Unique Src IPs" value={formatNum(f.unique_src_ips)} />
          <DataRow label="Unique Dst IPs" value={formatNum(f.unique_dst_ips)} />
          <DataRow label="Unique Src Ports" value={formatNum(f.unique_src_ports)} />
          <DataRow label="Unique Dst Ports" value={formatNum(f.unique_dst_ports)} />
        </Section>

        <Section title="Throughput Rates">
          <DataRow label="Bytes/sec" value={formatNum(f.bytes_per_second)} />
          <DataRow label="Packets/sec" value={formatNum(f.packets_per_second)} />
          <DataRow label="Flows/sec" value={formatNum(f.flows_per_second)} />
        </Section>

        <Section title="Protocol Distribution (Ratio)">
          <DataRow label="TCP Ratio" value={formatNum(f.tcp_ratio)} />
          <DataRow label="UDP Ratio" value={formatNum(f.udp_ratio)} />
          <DataRow label="ICMP Ratio" value={formatNum(f.icmp_ratio)} />
          <DataRow label="Other Protocols" value={formatNum(f.other_proto_ratio)} />
        </Section>

        <Section title="Flow Statistics">
          <DataRow label="Active Flows" value={formatNum(f.active_flows)} />
          <DataRow label="Avg Flow Duration (ms)" value={formatNum(f.avg_flow_duration_ms)} />
          <DataRow label="Avg Bytes/Flow" value={formatNum(f.avg_bytes_per_flow)} />
          <DataRow label="Avg Pkts/Flow" value={formatNum(f.avg_pkts_per_flow)} />
          <DataRow label="Bidirectional Asymmetry" value={formatNum(f.avg_bidirectional_asymmetry)} />
        </Section>

        <Section title="TCP Flag Statistics">
          <DataRow label="TCP Packet Count" value={formatNum(f.tcp_packet_count)} />
          <DataRow label="SYN Rate" value={formatNum(f.syn_rate)} />
          <DataRow label="FIN Rate" value={formatNum(f.fin_rate)} />
          <DataRow label="RST Rate" value={formatNum(f.rst_rate)} />
          <DataRow label="ACK Ratio" value={formatNum(f.ack_ratio)} />
        </Section>

        <Section title="Information Entropy">
          <DataRow label="Dst Port Entropy" value={formatNum(f.dst_port_entropy)} />
          <DataRow label="Src IP Entropy" value={formatNum(f.src_ip_entropy)} />
          <DataRow label="Dst IP Entropy" value={formatNum(f.dst_ip_entropy)} />
        </Section>

        <Section title="Service Distribution">
          <DataRow label="Web (HTTP/S)" value={formatNum(f.web_ratio)} />
          <DataRow label="DNS" value={formatNum(f.dns_ratio)} />
          <DataRow label="SSH" value={formatNum(f.ssh_ratio)} />
          <DataRow label="SMTP" value={formatNum(f.smtp_ratio)} />
          <DataRow label="FTP" value={formatNum(f.ftp_ratio)} />
          <DataRow label="Other Services" value={formatNum(f.other_ratio)} />
        </Section>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Top Source IPs">
            <div className="flex flex-col gap-1">
              {(f.top_src_ips || []).map((ip, i) => (
                <div key={i} className="text-xs font-mono bg-slate-50 px-2 py-1 rounded text-slate-700 border border-slate-100">
                  {ip}
                </div>
              ))}
              {(!f.top_src_ips || f.top_src_ips.length === 0) && <div className="text-xs text-slate-400">None recorded</div>}
            </div>
          </Section>

          <Section title="Top Destination IPs">
            <div className="flex flex-col gap-1">
              {(f.top_dst_ips || []).map((ip, i) => (
                <div key={i} className="text-xs font-mono bg-slate-50 px-2 py-1 rounded text-slate-700 border border-slate-100">
                  {ip}
                </div>
              ))}
              {(!f.top_dst_ips || f.top_dst_ips.length === 0) && <div className="text-xs text-slate-400">None recorded</div>}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
