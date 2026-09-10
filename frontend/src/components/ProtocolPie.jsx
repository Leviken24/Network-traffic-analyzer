import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function ProtocolPie({ features }) {
  if (!features) return null;

  const data = [
    { name: 'TCP', value: (features.tcp_ratio || 0) * 100 },
    { name: 'UDP', value: (features.udp_ratio || 0) * 100 },
    { name: 'ICMP', value: (features.icmp_ratio || 0) * 100 },
    { name: 'OTHER', value: (features.other_proto_ratio || 0) * 100 },
  ].filter(d => d.value > 0);

  const COLORS = {
    TCP: '#3b82f6', // blue
    UDP: '#22c55e', // green
    ICMP: '#f97316', // orange
    OTHER: '#9ca3af' // gray
  };

  const formatTooltip = (value) => `${value.toFixed(2)}%`;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Protocol Mix</h3>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.OTHER} />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltip} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
