import React from 'react';

const GaugeBar = ({ label, value, max = 16 }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  let color = 'bg-green-500';
  if (value > max * 0.5) color = 'bg-yellow-500';
  if (value > max * 0.8) color = 'bg-red-500';

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500 font-mono">{Number(value).toFixed(2)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>0</span>
        <span>16 bits</span>
      </div>
    </div>
  );
};

export default function EntropyGauge({ features }) {
  if (!features) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Entropy Metrics</h3>
      <div className="flex-1 flex flex-col justify-center space-y-2">
        <GaugeBar label="Dst Port Entropy" value={features.dst_port_entropy || 0} />
        <GaugeBar label="Src IP Entropy" value={features.src_ip_entropy || 0} />
        <GaugeBar label="Dst IP Entropy" value={features.dst_ip_entropy || 0} />
      </div>
    </div>
  );
}
