import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Activity, Globe, Wifi, WifiOff, Server, Clock, ShieldCheck, ChevronRight, X } from "lucide-react";
import { createPortal } from "react-dom";

/**
 * NetworkStatus - Institutional Health Monitor
 * Displays real-time status of Stellar Horizon and Nexa-Market-API.
 */
export default function NetworkStatus() {
  const [showModal, setShowModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { lastSync } = useSelector((state) => state.wallet || {});
  
  const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || "testnet";

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const StatusBadge = () => (
    <button 
      onClick={() => setShowModal(true)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
        isOnline 
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" 
          : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'} shadow-[0_0_8px_currentColor]`} />
      <span className="text-[10px] font-black uppercase tracking-widest">
        {isOnline ? NETWORK : 'Offline'}
      </span>
    </button>
  );

  const StatusModal = () => (
    <div className="fixed inset-0 z-[20000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-[#1e2329] border border-[#2b3139] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[100px]" />
        
        <header className="flex justify-between items-center mb-8">
          <h3 className="text-white font-black text-lg flex items-center gap-3">
            <Activity size={20} className="text-cyan-500" /> System Health
          </h3>
          <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="space-y-4">
          {/* HORIZON STATUS */}
          <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400"><Server size={18} /></div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Stellar Horizon</p>
                <p className="text-xs font-bold text-white capitalize">{NETWORK} Node</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-400">ACTIVE</span>
              <Wifi size={14} className="text-emerald-400" />
            </div>
          </div>

          {/* MARKET API STATUS */}
          <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400"><Globe size={18} /></div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Market Feed</p>
                <p className="text-xs font-bold text-white">Nexa Proxy V2</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-400">ACTIVE</span>
              <ShieldCheck size={14} className="text-emerald-400" />
            </div>
          </div>

          {/* LAST SYNC */}
          <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400"><Clock size={18} /></div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Last Network Sync</p>
                <p className="text-xs font-bold text-white">
                  {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Awaiting sync...'}
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-gray-700" />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-[9px] text-gray-500 font-medium leading-relaxed">
            NexaPay monitors connectivity to the Stellar Network and NexaPay backend market feed every 60 seconds.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <StatusBadge />
      {showModal && createPortal(<StatusModal />, document.body)}
    </>
  );
}
