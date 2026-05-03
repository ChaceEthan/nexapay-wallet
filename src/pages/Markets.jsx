import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { getFullMarketList, safeNumber, safeArray, safePrice } from '@/services/api';
import { showToast } from '@/toastSlice';
import { MarketRowSkeleton } from '@/components/Skeleton';

export default function Markets() {
  const dispatch = useDispatch();
  const [marketList, setMarketList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);

  const fetchMarkets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getFullMarketList();
      const validated = safeArray(data).filter(m => m && m.id);
      setMarketList(validated);
      setIsCached(validated.length <= 5 && validated[0]?.current_price === 0.165);
    } catch (err) {
      setError("Market sync interrupted.");
      dispatch(showToast({ message: "Using failover market data", type: "error" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchMarkets();
    const t = setInterval(() => fetchMarkets(true), 30000);
    return () => clearInterval(t);
  }, [fetchMarkets]);

  return (
    <div className="text-white space-y-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-black">Market Overview</h1>
        {isCached && (
          <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
            Failover Protocol Active
          </div>
        )}
      </div>

      <div className="bg-[#1e2329] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="w-full overflow-x-auto">
        <table className="min-w-[760px] w-full divide-y divide-white/5">
          <thead className="bg-black/20">
            <tr>
              <th scope="col" className="px-8 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Asset</th>
              <th scope="col" className="px-8 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Price (USD)</th>
              <th scope="col" className="px-8 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Change (24h)</th>
              <th scope="col" className="px-8 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Volume (24h)</th>
              <th scope="col" className="px-8 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Visual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [...Array(6)].map((_, i) => <MarketRowSkeleton key={i} />)
            ) : error && marketList.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-8 py-20 text-center text-rose-400 font-bold uppercase tracking-widest">{error}</td>
              </tr>
            ) : (
              marketList.map((market) => {
                const price = safePrice(market.current_price, 0.0001);
                const change = safeNumber(market.price_change_percentage_24h, 0);
                const volume = safePrice(market.total_volume, 1);

                return (
                <tr key={market.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <img src={market.image} alt="" className="w-8 h-8 rounded-full bg-black/40" 
                           onError={(e) => e.target.src = 'https://via.placeholder.com/32'} />
                      <div>
                        <div className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">{market.name}</div>
                        <div className="text-xs text-gray-500 uppercase font-mono">{market.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-mono text-white">
                    ${price.toFixed(price < 1 ? 4 : 2)}
                  </td>
                  <td className={`px-8 py-6 whitespace-nowrap text-right text-sm font-mono ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {change.toFixed(2)}%
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-mono text-white">
                    ${volume.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-right">
                    <div className="w-20 h-8 bg-white/5 rounded-md ml-auto group-hover:bg-cyan-500/10 transition-colors" />
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
