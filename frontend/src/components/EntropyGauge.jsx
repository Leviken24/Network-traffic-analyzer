import React from 'react';

const GaugeBar = ({ label, value, max = 16 }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  let barColor = 'bg-[#A1A1A1]';
  if (value > max * 0.7) barColor = 'bg-[#D64545]';
  else if (value > max * 0.4) barColor = 'bg-[#C9A227]';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-[#A1A1A1]">{label}</span>
        <span className="text-[#F5F5F5]">{Number(value).toFixed(2)}</span>
      </div>
      <div className="w-full bg-[rgba(255,255,255,0.06)] rounded-full h-1 overflow-hidden">
        <div 
          className={`h-1 rounded-full ${barColor} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default function EntropyGauge({ features }) {
  if (!features) return null;

  return (
    <div className="glass-panel p-4 h-full flex flex-col justify-between">
      <h3 className="text-xs font-mono text-[#A1A1A1] uppercase tracking-wider mb-3">Information Entropy</h3>
      <div className="space-y-3.5 my-auto">
        <GaugeBar label="Destination Port Entropy" value={features.dst_port_entropy || 0} />
        <GaugeBar label="Source IP Entropy" value={features.src_ip_entropy || 0} />
        <GaugeBar label="Destination IP Entropy" value={features.dst_ip_entropy || 0} />
      </div>
      <div className="text-[10px] text-[#666666] font-mono mt-2">
        High port entropy indicates distributed scanning or reconnaissance.
      </div>
    </div>
  );
}
