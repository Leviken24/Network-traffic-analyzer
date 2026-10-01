import React, { useRef, useEffect } from 'react';

export default function TimelineSlider({ states, onSelectState, selectedStateId }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (selectedStateId && containerRef.current) {
      const selectedEl = document.getElementById(`state-card-${selectedStateId}`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedStateId]);

  if (!states || states.length === 0) return null;

  const maxPackets = Math.max(...states.map(s => s.packet_count || 1));

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-mono tracking-wider text-[#A1A1A1] uppercase">
          Observed Time Windows
        </h3>
        <span className="text-[10px] text-[#666666] font-mono">Select window interval to inspect telemetry</span>
      </div>

      <div 
        ref={containerRef}
        className="flex overflow-x-auto gap-2 pb-2 snap-x"
      >
        {states.map((state) => {
          const isSelected = state.id === selectedStateId;
          const barHeight = `${Math.max(10, ((state.packet_count || 0) / maxPackets) * 100)}%`;
          
          return (
            <div
              key={state.id}
              id={`state-card-${state.id}`}
              onClick={() => onSelectState(state.id)}
              className={`flex-shrink-0 w-28 cursor-pointer rounded-sm border p-2.5 transition-all ${
                isSelected 
                  ? 'border-[#C9A227] bg-[#C9A227]/10' 
                  : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.015)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.04)]'
              }`}
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-[#666666] mb-1">
                <span className={`font-semibold ${isSelected ? 'text-[#C9A227]' : 'text-[#F5F5F5]'}`}>W{state.window_index}</span>
                <span>{state.window_start?.substring(11, 19) || '00:00:00'}</span>
              </div>
              <div className="h-10 flex items-end mb-1.5 bg-[#050505] rounded-sm p-0.5 border border-[rgba(255,255,255,0.04)]">
                <div 
                  className={`w-full rounded-xs transition-all duration-200 ${isSelected ? 'bg-[#C9A227]' : 'bg-[rgba(255,255,255,0.18)]'}`} 
                  style={{ height: barHeight }}
                  title={`${state.packet_count} packets`}
                ></div>
              </div>
              <div className="text-[10px] font-mono text-center text-[#A1A1A1]">
                {state.packet_count?.toLocaleString() || 0} pkts
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
