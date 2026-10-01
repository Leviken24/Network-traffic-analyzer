import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FeatureChart({ title, data }) {
  return (
    <div className="card p-4 h-full flex flex-col">
      <h3 className="text-xs font-semibold text-[#F8FAFC] uppercase tracking-wider mb-3">{title}</h3>
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#242943" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#71717A', fontSize: 11 }}
              axisLine={{ stroke: '#242943' }}
              tickLine={false}
              angle={-35}
              textAnchor="end"
            />
            <YAxis 
              tick={{ fill: '#71717A', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: '#14182A' }}
              contentStyle={{
                backgroundColor: '#0F1220',
                borderColor: '#242943',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            />
            <Bar dataKey="value" fill="#6366F1" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
