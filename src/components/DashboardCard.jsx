import React from "react";
import { ShieldCheck, CreditCard, Wallet, Send, ArrowDownCircle } from "lucide-react";

/**
 * DashboardCard - Binance-Grade Asset Hub
 * - Balanced typography and spacing
 * - Unified Actions: Send / Receive moved inside the card
 */
export default function DashboardCard({ balances, address, loading, portfolioValue, onSend, onReceive }) {
  const short = address && `${address.slice(0, 8)}...${address.slice(-8)}`;
  const nativeBalance = balances.find(b => b.asset_type === 'native')?.balance || "0.00";
  const usdcBalance = balances.find(b => b.asset_code === 'USDC')?.balance || "0.00";

  if (loading && !balances.length) {
    return <div className="bg-[#1e2329] p-5 rounded-2xl h-64 animate-pulse border border-white/5" />;
  }

  return (
    <div className="bg-gradient-to-br from-[#1e2329] to-[#12161a] p-5 rounded-2xl shadow-2xl border border-white/5 relative overflow-hidden group">
      {/* Subtle Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
      
      <div className="relative z-10">
        {/* VALUE & IDENTITY */}
        <div className="mb-6">
          <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
            <ShieldCheck size={10} className="text-cyan-500" /> Secure Vault Value
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-gray-400 text-lg font-bold">$</span>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              {portfolioValue}
            </h1>
          </div>
          <p className="text-cyan-500/60 font-mono text-[10px] font-black mt-1 tracking-wider">
            {short}
          </p>
        </div>

        {/* BALANCES LIST */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <Wallet size={16} className="text-cyan-400" />
              <div>
                <p className="text-[10px] font-black text-white uppercase">Stellar Lumens</p>
                <p className="text-[9px] font-bold text-gray-500 uppercase">Native</p>
              </div>
            </div>
            <p className="text-sm font-black text-white">
              {parseFloat(nativeBalance).toLocaleString()} <span className="text-[10px] text-gray-600">XLM</span>
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <CreditCard size={16} className="text-blue-400" />
              <div>
                <p className="text-[10px] font-black text-white uppercase">USD Coin</p>
                <p className="text-[9px] font-bold text-gray-500 uppercase">Stable</p>
              </div>
            </div>
            <p className="text-sm font-black text-white">
              {parseFloat(usdcBalance).toLocaleString()} <span className="text-[10px] text-gray-600">USDC</span>
            </p>
          </div>
        </div>

        {/* QUICK ACTIONS ROW */}
        <div className="flex gap-2">
          <button 
            onClick={onSend}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl transition-all active:scale-95"
          >
            <Send size={14} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-widest">Send</span>
          </button>
          <button 
            onClick={onReceive}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all active:scale-95"
          >
            <ArrowDownCircle size={14} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-widest">Receive</span>
          </button>
        </div>
      </div>
    </div>
  );
}