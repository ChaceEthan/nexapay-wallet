import React, { useState, useEffect } from "react";
import { TrendingUp, Globe, Zap, Megaphone } from "lucide-react";
import { getFullMarketList } from "@/services/api"; // Import getFullMarketList for trending items

export default function NewsBanner({ wsActive }) {
  const [trending, setTrending] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const announcements = [
    { name: "Protocol Update", symbol: "V2.4", price_btc: "LIVE", type: "system" },
    { name: "Referral Bonus", symbol: "XLM", price_btc: "+10%", type: "promo" }
  ];

  useEffect(() => {
    const fetchTrending = async () => {
      // Use getFullMarketList which is designed to return an array of market items
      const data = await getFullMarketList(); 
      if (Array.isArray(data) && data.length > 0) {
        setTrending([...announcements, ...data]); // Assuming the full market list items are suitable for trending
      } else {
        setTrending(announcements);
      }
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    if (trending.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trending.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [trending]);

  if (trending.length === 0) {
    return <div className="h-10" />; // Empty placeholder to prevent layout shift
  }

  const current = trending[currentIndex];
  const priceText = current.price_btc || (current.current_price ? `$${Number(current.current_price).toFixed(current.current_price < 1 ? 4 : 2)}` : "LIVE");
  const isPositive = String(priceText).includes("+") || priceText === "LIVE" || (current.price_change_percentage_24h ?? 0) >= 0;

  return (
    <div className="w-full bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-2xl py-2.5 px-4 relative overflow-hidden h-10 flex items-center">
      <div key={currentIndex} className="flex items-center gap-4 w-full animate-in slide-in-from-right-2 fade-in duration-500 will-change-transform">
        <div className="flex items-center gap-2 shrink-0">
          <Megaphone size={14} className="text-cyan-500" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-500/80">Bulletin</span>
        </div>
        
        <div className="h-3 w-[1px] bg-white/10 shrink-0" />

        <div className="flex items-center gap-3 overflow-hidden">
          {(current.thumb || current.image) && <img src={current.thumb || current.image} alt="" className="w-4 h-4 rounded-full shadow-lg" />}
          <span className="text-white font-bold text-[11px] truncate">{current.name}</span>
          <span className="text-cyan-500/60 font-mono text-[10px] uppercase font-black shrink-0">{current.symbol}</span>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-white/40 text-[9px] uppercase font-black tracking-tighter">
              {current.type === 'system' ? 'Status' : 'Market'}
            </span>
            <span className={`${isPositive ? 'text-emerald-400' : 'text-white'} font-mono text-[11px] font-black`}>
              {priceText}
            </span>
          </div>
        </div>

        <div className="ml-auto hidden sm:flex items-center gap-4 text-gray-600">
           <span className="text-[8px] font-black uppercase tracking-widest">Vault Engine Secure</span>
           <Zap size={10} />
        </div>
      </div>
    </div>
  );
}
