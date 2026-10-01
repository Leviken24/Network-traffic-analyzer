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
    <div className="card p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Observed Time Windows
        </h3>
        <span className="text-[11px] text-slate-500">Select window to inspect state telemetry</span>
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
              className={`flex-shrink-0 w-28 cursor-pointer rounded border p-2.5 transition-colors ${
                isSelected 
                  ? 'border-[#0EA5A8] bg-[#F0FDFA]' 
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                <span className="font-semibold text-slate-700">W{state.window_index}</span>
                <span className="font-mono">{state.window_start?.substring(11, 19) || '00:00:00'}</span>
              </div>
              <div className="h-12 flex items-end mb-1.5 bg-slate-50 rounded p-0.5">
                <div 
                  className={`w-full rounded-sm transition-all duration-200 ${isSelected ? 'bg-[#0EA5A8]' : 'bg-slate-300'}`} 
                  style={{ height: barHeight }}
                  title={`${state.packet_count} packets`}
                ></div>
              </div>
              <div className="text-[11px] font-mono font-medium text-center text-slate-700">
                {state.packet_count?.toLocaleString() || 0} pkts
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
