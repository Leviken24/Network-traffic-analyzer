import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FeatureChart({ title, data }) {
  return (
    <div className="card p-4 h-full flex flex-col">
      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">{title}</h3>
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#64748B', fontSize: 11 }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
              angle={-35}
              textAnchor="end"
            />
            <YAxis 
              tick={{ fill: '#64748B', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                borderRadius: '6px',
                fontSize: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            />
            <Bar dataKey="value" fill="#0F3D56" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
