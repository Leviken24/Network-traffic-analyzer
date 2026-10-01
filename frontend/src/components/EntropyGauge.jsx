import React from 'react';

const GaugeBar = ({ label, value, max = 16 }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  let barColor = 'bg-[#0EA5A8]';
  if (value > max * 0.7) barColor = 'bg-rose-500';
  else if (value > max * 0.4) barColor = 'bg-amber-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-[#0F3D56] font-mono font-semibold">{Number(value).toFixed(2)}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-1.5 rounded-full ${barColor} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default function EntropyGauge({ features }) {
  if (!features) return null;

  return (
    <div className="card p-4 h-full flex flex-col justify-between">
      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Information Entropy</h3>
      <div className="space-y-3 my-auto">
        <GaugeBar label="Destination Port Entropy" value={features.dst_port_entropy || 0} />
        <GaugeBar label="Source IP Entropy" value={features.src_ip_entropy || 0} />
        <GaugeBar label="Destination IP Entropy" value={features.dst_ip_entropy || 0} />
      </div>
      <div className="text-[10px] text-slate-400 mt-2">
        Higher port entropy indicates distributed scanning or reconnaissance.
      </div>
    </div>
  );
}
