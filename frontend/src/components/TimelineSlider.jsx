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
    <div className="card p-4 border border-cyan-500/25 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Sequential Time Windows</h3>
        <span className="text-[11px] text-gray-400">Click a window to inspect extracted features</span>
      </div>
      <div 
        ref={containerRef}
        className="flex overflow-x-auto gap-3 pb-3 snap-x hide-scrollbar"
        style={{ scrollbarWidth: 'thin' }}
      >
        {states.map((state) => {
          const isSelected = state.id === selectedStateId;
          const barHeight = `${Math.max(12, ((state.packet_count || 0) / maxPackets) * 100)}%`;
          
          return (
            <div
              key={state.id}
              id={`state-card-${state.id}`}
              onClick={() => onSelectState(state.id)}
              className={`flex-shrink-0 w-32 cursor-pointer snap-center rounded-xl border-2 p-3 transition-all ${
                isSelected 
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,245,255,0.3)] scale-105' 
                  : 'border-gray-800 bg-black/40 hover:border-cyan-500/50 hover:bg-black/60'
              }`}
            >
              <div className="text-[11px] font-bold text-gray-400 mb-0.5">Win #{state.window_index}</div>
              <div className="text-[11px] text-cyan-300 mb-2 font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                {state.window_start?.substring(11, 19) || '00:00:00'}
              </div>
              <div className="h-16 flex items-end mb-2 bg-gray-900/60 rounded p-0.5">
                <div 
                  className={`w-full rounded-sm transition-all duration-300 ${isSelected ? 'bg-cyan-400' : 'bg-gray-700'}`} 
                  style={{ height: barHeight }}
                  title={`${state.packet_count} packets`}
                ></div>
              </div>
              <div className="text-[11px] font-mono text-center text-gray-300">
                {state.packet_count?.toLocaleString() || 0} pkts
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
