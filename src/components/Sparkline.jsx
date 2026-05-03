import React, { useState } from "react";

export default function Sparkline({ data = [] }) {
  const [hovered, setHovered] = useState(false);

  if (!Array.isArray(data) || data.length < 2) return <div className="w-[120px] h-[40px] bg-white/5 rounded animate-pulse" />;

  const width = 120;
  const height = 40;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const trendUp = data[data.length - 1] >= data[0];

  // Calculate percentage change
  const initialValue = data[0];
  const currentValue = data[data.length - 1];
  const percentageChange = initialValue !== 0 
    ? (((currentValue - initialValue) / initialValue) * 100).toFixed(2)
    : "0.00";

  return (
    <div 
      className="relative cursor-help"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg width={width} height={height}>
        <polyline
          fill="none"
          stroke={trendUp ? "#00ffb3" : "#ff4d4f"}
          strokeWidth="2"
          points={points}
        />
      </svg>

      {hovered && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 rounded-lg px-2 py-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
          <p className={`text-[10px] font-black whitespace-nowrap ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trendUp ? '↑' : '↓'} {Math.abs(percentageChange)}% <span className="text-gray-500 font-bold ml-1">24H</span>
          </p>
        </div>
      )}
    </div>
  );
}