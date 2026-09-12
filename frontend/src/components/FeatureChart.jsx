import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FeatureChart({ title, data }) {
  return (
    <div className="bg-transparent p-4 rounded-lg red-sm border border-gray-100 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-green mb-4">{title}</h3>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#10e09e" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#142d60', fontSize: 12 }}
              axisLine={{ stroke: '#c6d1e7' }}
              tickLine={false}
              angle={-45}
              textAnchor="end"
            />
            <YAxis 
              tick={{ fill: '#c5d2ed', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="value" fill="#fb049496" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
