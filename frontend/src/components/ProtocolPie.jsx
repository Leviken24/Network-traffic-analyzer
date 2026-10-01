import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function ProtocolPie({ features }) {
  if (!features) return null;

  const data = [
    { name: 'TCP', value: (features.tcp_ratio || 0) * 100 },
    { name: 'UDP', value: (features.udp_ratio || 0) * 100 },
    { name: 'ICMP', value: (features.icmp_ratio || 0) * 100 },
    { name: 'Other', value: (features.other_proto_ratio || 0) * 100 },
  ].filter(d => d.value > 0);

  const COLORS = {
    TCP: '#6366F1',    // Primary Indigo
    UDP: '#06B6D4',    // Cyan accent
    ICMP: '#3B82F6',   // Secondary Blue
    Other: '#71717A'   // Muted text color
  };

  const formatTooltip = (value) => `${value.toFixed(1)}%`;

  return (
    <div className="glass-panel p-4 h-full flex flex-col">
      <h3 className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider mb-3">Protocol Distribution</h3>
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.Other} />
              ))}
            </Pie>
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: '#0F1220',
                borderColor: '#242943',
                borderRadius: '4px',
                color: '#F8FAFC',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}
            />
            <Legend verticalAlign="bottom" height={30} iconSize={7} wrapperStyle={{ fontSize: '10px', color: '#71717A', fontFamily: 'monospace' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
