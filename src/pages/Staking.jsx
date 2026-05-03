import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  Layers, 
  Rocket, 
  Lock, 
  TrendingUp, 
  ShieldCheck, 
  Timer, 
  ArrowRight,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { addStake, claimStake, unstake, calculateStakeRewards } from "@/stakingSlice";
import { showToast } from "@/toastSlice";
import { addNotification } from "@/notificationSlice";

export default function Staking() {
  const dispatch = useDispatch();
  const { activeStakes, totalRewardsEarned } = useSelector((state) => state.staking);
  const { wallets, activeWalletId, balances } = useSelector((state) => state.wallet);
  
  const activeWallet = wallets?.find(w => w?.id === activeWalletId);
  const xlmBalance = parseFloat(balances?.find(b => b?.asset_type === 'native')?.balance || "0");

  
  const [stakeAmount, setStakeAmount] = useState("");
  const [duration, setDuration] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(calculateStakeRewards());
    }, 10000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    if (parseFloat(stakeAmount) > xlmBalance - 1) {
      dispatch(showToast({ message: "Insufficient balance (leave 1 XLM for fees)", type: "error" }));
      return;
    }

    setIsSubmitting(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1500));
    
    dispatch(addStake({
      walletId: activeWalletId,
      amount: stakeAmount,
      durationDays: duration
    }));

    dispatch(addNotification({
      type: "staking",
      title: "Stake Successful",
      message: `Locked ${stakeAmount} XLM for ${duration} days.`,
      walletId: activeWalletId, // Pass walletId
    }));

    dispatch(showToast({ message: "Assets Locked in Vault", type: "success" }));
    setStakeAmount("");
    setIsSubmitting(false);
  };

  return (
    <div className="p-8 md:p-12 max-w-[1200px] mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col items-start gap-4">
        <div className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full">
           <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Institutional Yield Engine</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">Vault Staking</h1>
        <p className="text-gray-500 font-medium max-w-2xl leading-relaxed">
          Lock your assets in NexaPay’s high-security vaults to generate automated yield. 
          Assets are protected by hardware-grade encryption and protocol-level security.
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* STAKING INTERFACE */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-[#1e2329] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-white font-black text-xl mb-8 flex items-center gap-3">
              <Lock size={20} className="text-cyan-500" /> Create New Position
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Amount to Lock (XLM)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black border border-white/5 p-5 rounded-2xl text-2xl font-black text-white outline-none focus:border-cyan-500/50 transition-all"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-xs font-black text-gray-500">XLM</span>
                    <button 
                      onClick={() => setStakeAmount((xlmBalance - 1).toString())}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black text-cyan-500 uppercase tracking-widest border border-white/5"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-gray-600 font-bold uppercase">Available: {xlmBalance.toLocaleString()} XLM</p>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Duration (Days)</label>
                <div className="grid grid-cols-4 gap-3">
                  {[7, 30, 90, 365].map(d => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`p-4 rounded-xl border text-[11px] font-black transition-all ${
                        duration === d 
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' 
                        : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/10'
                      }`}
                    >
                      {d}D
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-cyan-500/60 uppercase tracking-widest mb-1">Estimated APY</p>
                   <p className="text-2xl font-black text-cyan-400">12.00%</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-cyan-500/60 uppercase tracking-widest mb-1">Monthly Yield</p>
                   <p className="text-xl font-black text-white">
                     {stakeAmount ? ((parseFloat(stakeAmount) * 0.12) / 12).toFixed(2) : "0.00"} <span className="text-xs opacity-40">XLM</span>
                   </p>
                </div>
              </div>

              <button 
                onClick={handleStake}
                disabled={isSubmitting || !stakeAmount}
                className="w-full py-5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-800 disabled:text-gray-500 text-black font-black rounded-2xl text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-3"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />}
                {isSubmitting ? "Initiating Protocol..." : "Execute Stake Operation"}
              </button>
            </div>
          </div>
        </div>

        {/* REWARDS & ACTIVE POSITIONS */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-gradient-to-br from-[#1e2329] to-[#12161a] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Accumulated Yield</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">{(totalRewardsEarned || 0).toFixed(4)}</span>
              <span className="text-sm font-black text-cyan-500">XLM</span>
            </div>

            <button className="mt-8 w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest border border-white/5 transition-all">
              Claim All Rewards
            </button>
          </div>

          <div className="bg-[#1e2329] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-white font-black text-lg mb-6 tracking-tight">Active Positions</h3>
            <div className="space-y-4">
              {(!activeStakes || activeStakes.length === 0) ? (
                <div className="py-12 flex flex-col items-center gap-4 opacity-20">
                  <Layers size={40} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Active Stakes</p>
                </div>
              ) : (
                activeStakes.map(stake => (

                  <div key={stake.id} className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                             <ShieldCheck size={20} />
                          </div>
                          <div>
                             <p className="text-sm font-black text-white">{stake.amount.toLocaleString()} XLM</p>
                             <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{stake.duration} Days Lock</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-black text-cyan-400">+{stake.currentReward?.toFixed(5)}</p>
                          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Rewards</p>
                       </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Timer size={12} className="text-gray-500" />
                          <span className="text-[10px] font-bold text-gray-500">Expires {new Date(stake.expiryTime).toLocaleDateString()}</span>
                       </div>
                       <button 
                         onClick={() => dispatch(claimStake(stake.id))}
                         className="text-[9px] font-black text-cyan-500 uppercase tracking-widest hover:underline"
                       >
                         Claim
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DISCLAIMER */}
      <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] flex items-start gap-6">
         <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle size={24} />
         </div>
         <div>
            <h4 className="text-amber-500 font-black text-lg mb-1 uppercase tracking-tight">Institutional Disclosure</h4>
            <p className="text-gray-500 text-xs font-medium leading-relaxed">
              Staking rewards on testnet are simulated for demonstration purposes. APY is subject to protocol adjustments. 
              Always ensure your vault phrase is securely backed up before initiating high-value lock operations.
            </p>
         </div>
      </div>
    </div>
  );
}
