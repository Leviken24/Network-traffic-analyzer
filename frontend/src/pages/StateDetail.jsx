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

  if (loading) return <div className="text-center py-16 text-xs text-[#666666] font-mono">Loading state telemetry vector...</div>;
  if (error) return <div className="text-[#D64545] text-center py-16 text-xs font-mono">Error: {error}</div>;
  if (!stateData) return <div className="text-center py-16 text-xs text-[#666666] font-mono">No data found</div>;

  const f = stateData.features || {};

  const formatNum = (val) => typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 4 }) : 'N/A';

  const DataRow = ({ label, value }) => (
    <div className="flex justify-between py-1.5 border-b border-[rgba(255,255,255,0.04)] last:border-0 text-xs font-mono">
      <span className="text-[#A1A1A1]">{label}</span>
      <span className="text-[#F5F5F5]">{value}</span>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="glass-panel p-4">
      <h3 className="text-xs font-mono text-[#C9A227] uppercase tracking-wider mb-3 pb-2 border-b border-[rgba(255,255,255,0.06)]">{title}</h3>
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="text-xs text-[#666666] hover:text-[#F5F5F5] mb-2 inline-flex items-center gap-1 font-mono transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Timeline
          </button>
          <div className="text-[10px] font-mono tracking-wider text-[#C9A227] uppercase mb-1">
            Raw State Vector
          </div>
          <h1 className="text-xl font-light text-[#F5F5F5] tracking-tight">Window Telemetry Inspector</h1>
          <p className="text-xs text-[#666666] font-mono mt-0.5">ID: {stateId}</p>
        </div>

        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] px-3.5 py-2 rounded-sm text-right text-xs font-mono">
          <div className="text-[#666666]">Window #{stateData.window_index}</div>
          <div className="text-[#F5F5F5]">{stateData.window_start?.substring(0, 19).replace('T', ' ')}</div>
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

        <Section title="Protocol Distribution">
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
                <div key={i} className="text-xs font-mono bg-[rgba(255,255,255,0.02)] px-2 py-1 rounded-sm text-[#F5F5F5] border border-[rgba(255,255,255,0.06)]">
                  {ip}
                </div>
              ))}
              {(!f.top_src_ips || f.top_src_ips.length === 0) && <div className="text-xs text-[#666666] font-mono">None recorded</div>}
            </div>
          </Section>

          <Section title="Top Destination IPs">
            <div className="flex flex-col gap-1">
              {(f.top_dst_ips || []).map((ip, i) => (
                <div key={i} className="text-xs font-mono bg-[rgba(255,255,255,0.02)] px-2 py-1 rounded-sm text-[#F5F5F5] border border-[rgba(255,255,255,0.06)]">
                  {ip}
                </div>
              ))}
              {(!f.top_dst_ips || f.top_dst_ips.length === 0) && <div className="text-xs text-[#666666] font-mono">None recorded</div>}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
