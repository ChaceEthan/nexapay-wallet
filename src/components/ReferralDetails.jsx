import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Users, Gift, Copy, Check, ExternalLink, ShieldCheck, History } from "lucide-react";
import { showToast } from "@/toastSlice";
import { claimTestnetRewards } from "@/referralSlice";
import { shareReferralLink } from "@/utils/referralUtils";

export default function ReferralDetails() {
  const dispatch = useDispatch();
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const { 
    referralCode, 
    referralsCount, 
    pendingRewardsXLM, 
    claimedRewardsXLM,
    testnetRewardsHistory 
  } = useSelector((state) => state.referral);
  
  const { network } = useSelector((state) => state.auth);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    dispatch(showToast({ message: "Referral Code Copied", type: "success" }));
    setTimeout(() => setCopied(false), 2000);
  };

  const onShare = async () => {
    setIsSharing(true);
    await shareReferralLink(referralCode, () => setIsSharing(false));
  };

  const handleClaim = () => {
    if (pendingRewardsXLM <= 0) {
      dispatch(showToast({ message: "No rewards to claim", type: "info" }));
      return;
    }
    
    dispatch(claimTestnetRewards());
    dispatch(showToast({ 
      message: network === 'testnet' ? "Testnet rewards recorded to history" : "Mainnet rewards claimed successfully", 
      type: "success" 
    }));
  };

  return (
    <div className="bg-[#1e2329] border border-[#2b3139] rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      <div className="p-8 border-b border-white/5 bg-gradient-to-br from-[#181a20] to-[#1e2329]">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Gift className="text-cyan-500" size={24} /> Referral Engine
            </h2>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mt-1">Institutional Growth Program</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-2xl">
            <p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest text-center">Referrals</p>
            <p className="text-xl font-black text-white text-center">{referralsCount}</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* REWARD BREAKDOWN */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-yellow-500" /> Pending (Testnet)
            </p>
            <p className="text-xl font-black text-white font-mono">{pendingRewardsXLM.toFixed(4)} <span className="text-xs text-gray-600">XLM</span></p>
          </div>
          <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <History size={12} className="text-blue-500" /> Testnet History
            </p>
            <p className="text-xl font-black text-white font-mono">{testnetRewardsHistory.toFixed(4)} <span className="text-xs text-gray-600">XLM</span></p>
          </div>
          <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <ExternalLink size={12} className="text-green-500" /> Claimed (Mainnet)
            </p>
            <p className="text-xl font-black text-green-400 font-mono">{claimedRewardsXLM.toFixed(4)} <span className="text-xs text-gray-600">XLM</span></p>
          </div>
        </div>

        {/* REFERRAL CODE BOX */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Your Permanent Referral Code</p>
          <div className="flex items-center bg-black/60 rounded-2xl border border-white/10 p-2 shadow-inner">
            <div className="flex-1 px-4 text-cyan-400 font-mono font-black text-lg tracking-wider">
              {referralCode}
            </div>
            <button
              onClick={handleCopy}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all active:scale-95"
            >
              {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
            </button>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onShare}
            disabled={isSharing}
            className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 active:scale-95"
          >
            {isSharing ? "Generating..." : "Invite Friends"}
            <Users size={16} />
          </button>
          <button
            onClick={handleClaim}
            disabled={pendingRewardsXLM <= 0}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 disabled:bg-white/2 disabled:text-gray-700 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Claim Rewards
            <ShieldCheck size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}