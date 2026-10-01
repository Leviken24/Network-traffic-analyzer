import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FeatureChart({ title, data }) {
  return (
    <div className="glass-panel p-4 h-full flex flex-col">
      <h3 className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider mb-3">{title}</h3>
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#242943" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#242943' }}
              tickLine={false}
              angle={-35}
              textAnchor="end"
            />
            <YAxis 
              tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
              contentStyle={{
                backgroundColor: '#0F1220',
                borderColor: '#242943',
                borderRadius: '4px',
                color: '#F8FAFC',
                fontSize: '11px',
                fontFamily: 'monospace',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
            />
            <Bar dataKey="value" fill="#6366F1" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
