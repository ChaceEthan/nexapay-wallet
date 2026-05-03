import React from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Rocket, Wallet, TrendingUp, ShieldCheck, Lock, Globe } from "lucide-react";


export default function DeFi() {
  const navigate = useNavigate();

  const opportunities = [
    { name: "Liquidity Pool v3", asset: "XLM/USDC", yield: "12.4% APY", icon: Layers, color: "text-cyan-400" },
    { name: "Stellar Staking", asset: "XLM", yield: "4.2% APY", icon: Rocket, color: "text-purple-400" },
    { name: "Stable Vault", asset: "USDC", yield: "8.1% APY", icon: ShieldCheck, color: "text-emerald-400" },
  ];

  return (
    <div className="p-8 md:p-12 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col items-start">
        <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-4">
           <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Yield Engine Alpha</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">Decentralized Finance</h1>
        <p className="text-gray-500 font-medium mt-2 uppercase text-[10px] tracking-[0.3em]">Institutional Staking • Automated Market Making • Liquid Yield</p>
      </header>

      {/* DEFI PROTOCOLS */}
      <div className="grid lg:grid-cols-3 gap-8">
        {opportunities.map((item, i) => (
          <div key={i} className="bg-[#1e2329] border border-[#2b3139] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
                <item.icon size={120} />
             </div>
             <div className="relative z-10">
                <div className={`p-4 rounded-2xl bg-white/5 inline-block mb-8 ${item.color}`}><item.icon size={32} /></div>
                <h3 className="text-white font-black text-xl mb-1">{item.name}</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">{item.asset}</p>
                <div className="flex items-baseline gap-2 mb-8">
                   <span className="text-4xl font-black text-white">{item.yield}</span>
                </div>
                <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl border border-white/10 transition-all">
                   Manage Position
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* SYSTEM SECURITY */}
      <div className="grid md:grid-cols-2 gap-8">
         <div className="bg-[#1e2329] border border-[#2b3139] p-10 rounded-[3rem] flex items-center gap-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500"><Lock size={32} /></div>
            <div>
               <h4 className="text-white font-black text-lg mb-1">Non-Custodial Staking</h4>
               <p className="text-gray-500 text-xs font-medium">Your assets never leave your vault. You maintain 100% ownership while earning yield.</p>
            </div>
         </div>
         <div className="bg-[#1e2329] border border-[#2b3139] p-10 rounded-[3rem] flex items-center gap-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Globe size={32} /></div>
            <div>
               <h4 className="text-white font-black text-lg mb-1">Global Liquidity</h4>
               <p className="text-gray-500 text-xs font-medium">Direct access to multi-billion dollar liquidity pools via the Stellar Network protocol.</p>
            </div>
         </div>
      </div>

      {/* DASHBOARD PREVIEW */}
      <div className="bg-gradient-to-br from-[#1e2329] to-[#0b0e11] border border-white/5 p-12 rounded-[3.5rem] text-center shadow-2xl space-y-6">
         <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mx-auto border border-cyan-500/20 shadow-xl shadow-cyan-500/10">
            <TrendingUp size={40} />
         </div>
         <h2 className="text-white font-black text-3xl tracking-tight">Launch Your DeFi Journey</h2>
         <p className="text-gray-500 text-sm font-medium max-w-xl mx-auto leading-relaxed">Connect your active vault to start generating real-time yield from automated market makers and liquidity providers across the globe.</p>
         <button 
            onClick={() => navigate("/defi/staking")}
            className="px-10 py-5 bg-cyan-500 hover:bg-cyan-600 text-black font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-cyan-500/20 active:scale-95"
         >
            ACCESS STAKING PROTOCOL
         </button>

      </div>
    </div>
  );
}