import React from 'react';

/**
 * ChartSkeleton
 * Renders a placeholder for market charts to prevent layout shifts.
 */
export const ChartSkeleton = () => (
  <div className="w-full bg-[#1e2329] border border-white/5 rounded-[2.5rem] p-8 h-[400px] animate-pulse">
    <div className="flex justify-between items-start mb-8">
      <div className="space-y-3">
        <div className="h-5 bg-gray-700 rounded-lg w-32" />
        <div className="h-3 bg-gray-800 rounded-md w-48" />
      </div>
      <div className="h-10 bg-gray-700 rounded-xl w-24" />
    </div>
    <div className="w-full h-40 bg-gray-800/40 rounded-2xl mb-8" />
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-gray-800/20 rounded-xl" />)}
    </div>
  </div>
);

/** 
 * MarketRowSkeleton
 * Renders a skeleton row for the market table, ensuring correct DOM structure.
 */
export const MarketRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-8 py-6 whitespace-nowrap">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-gray-700 rounded-full" />
        <div>
          <div className="h-4 bg-gray-700 rounded w-24 mb-1" />
          <div className="h-3 bg-gray-600 rounded w-16" />
        </div>
      </div>
    </td>
    <td className="px-8 py-6 whitespace-nowrap text-right">
      <div className="h-4 bg-gray-700 rounded w-20 ml-auto" />
    </td>
    <td className="px-8 py-6 whitespace-nowrap text-right">
      <div className="h-4 bg-gray-700 rounded w-16 ml-auto" />
    </td>
    <td className="px-8 py-6 whitespace-nowrap text-right">
      <div className="h-4 bg-gray-700 rounded w-28 ml-auto" />
    </td>
    <td className="px-8 py-6 whitespace-nowrap text-right">
      <div className="w-20 h-8 bg-gray-700 rounded-md ml-auto" />
    </td>
  </tr>
);

export default MarketRowSkeleton;