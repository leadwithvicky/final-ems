import React from 'react';

interface HeatmapProps {
  days: Array<{ date: string; present: number; absent: number }>;
}

const Heatmap: React.FC<HeatmapProps> = ({ days }) => {
  // Simple grid heat intensity by present count
  const maxVal = Math.max(1, ...days.map(d => d.present));
  return (
    <div className="grid grid-cols-14 gap-1 p-2 bg-white rounded" style={{ maxHeight: 220, overflow: 'auto' }}>
      {days.map((d) => {
        const intensity = d.present / maxVal; // 0..1
        const bg = `rgba(34,197,94,${0.15 + 0.7 * intensity})`;
        return (
          <div key={d.date} title={`${d.date}: P ${d.present} / A ${d.absent}`} className="w-5 h-5 rounded" style={{ backgroundColor: bg }} />
        );
      })}
    </div>
  );
};

export default Heatmap;


