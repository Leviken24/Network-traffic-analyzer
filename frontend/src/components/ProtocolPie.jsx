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
    TCP: '#0F3D56',    // Navy
    UDP: '#0EA5A8',    // Teal
    ICMP: '#F59E0B',   // Amber
    Other: '#94A3B8'   // Slate
  };

  const formatTooltip = (value) => `${value.toFixed(1)}%`;

  return (
    <div className="card p-4 h-full flex flex-col">
      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Protocol Distribution</h3>
      <div className="flex-1 w-full min-h-[220px]">
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
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Legend verticalAlign="bottom" height={30} iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
