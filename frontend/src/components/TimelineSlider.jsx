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
    <div className="bg-transparent p-4 rounded-lg shadow-sm border border-green-100 mb-6">
      <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Network Timeline</h3>
      <div 
        ref={containerRef}
        className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar"
        style={{ scrollbarWidth: 'thin' }}
      >
        {states.map((state) => {
          const isSelected = state.id === selectedStateId;
          const barHeight = `${Math.max(10, ((state.packet_count || 0) / maxPackets) * 100)}%`;
          
          return (
            <div
              key={state.id}
              id={`state-card-${state.id}`}
              onClick={() => onSelectState(state.id)}
              className={`flex-shrink-0 w-32 cursor-pointer snap-center rounded-lg border-2 p-3 transition-all ${
                isSelected 
                  ? 'border-brand-500 bg-brand-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-xs font-bold text-gray-400 mb-1">Win #{state.window_index}</div>
              <div className="text-xs text-gray-600 mb-2 font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                {state.window_start.substring(11, 19)}
              </div>
              <div className="h-16 flex items-end mb-2 bg-gray-50 rounded-sm">
                <div 
                  className={`w-full rounded-sm ${isSelected ? 'bg-brand-500' : 'bg-gray-300'}`} 
                  style={{ height: barHeight }}
                  title={`${state.packet_count} packets`}
                ></div>
              </div>
              <div className="text-xs font-semibold text-center text-gray-700">
                {state.packet_count?.toLocaleString() || 0} pkts
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
