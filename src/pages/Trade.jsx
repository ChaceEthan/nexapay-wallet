import React from "react";
import { Zap, ShieldCheck, Info } from "lucide-react";
import SwapCard from "@/components/SwapCard";

export default function Trade() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight text-left">Capital Market Exchange</h1>
          <p className="text-gray-500 font-medium mt-2 uppercase text-[10px] tracking-[0.2em] text-left">Atomic Swaps • Zero Slippage Optimized</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl inline-flex items-center gap-2 self-start sm:self-auto">
          <Zap size={14} className="text-emerald-400" />
          <span className="text-[10px] font-black uppercase text-emerald-400">High Liquidity</span>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-5 lg:gap-6">
        <div className="lg:col-span-2">
          <SwapCard />
        </div>

        <div className="space-y-5">
          <div className="bg-[#1e2329] border border-[#2b3139] p-5 rounded-2xl shadow-xl">
            <h3 className="text-white font-black text-base mb-4 flex items-center gap-3">
              <ShieldCheck size={20} className="text-cyan-500" /> Secure Route
            </h3>
            <p className="text-gray-500 text-xs leading-relaxed font-medium">
              Your trade is routed through NexaPay's high-liquidity SDEX pools for the best available price on the Stellar network.
            </p>
          </div>

          <div className="bg-[#1e2329] border border-[#2b3139] p-5 rounded-2xl shadow-xl">
            <h3 className="text-white font-black text-base mb-4 flex items-center gap-3 text-left">
              <Info size={20} className="text-blue-500" /> Information
            </h3>
            <div className="space-y-3 text-left">
              <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Price Impact</p>
                <p className="text-xs font-bold text-emerald-400">{"<"} 0.01%</p>
              </div>
              <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Slippage Tolerance</p>
                <p className="text-xs font-bold text-white">0.5% (Auto)</p>
              </div>
              <div className="p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10">
                <p className="text-[10px] font-black uppercase text-cyan-500 mb-1">Protocol Version</p>
                <p className="text-xs font-bold text-gray-300 tracking-widest">NEXA-SIM-V1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
