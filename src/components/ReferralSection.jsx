import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Users, Gift, Copy, Check } from "lucide-react";
import { showToast } from "@/toastSlice";

/**
 * ReferralSection - Compact Referral Widget
 * Displays referral stats and a copyable link in a compact, professional layout.
 */
export default function ReferralSection() {
  const dispatch = useDispatch();

  // Mock data for demonstration. In a real app, these would come from props or Redux.
  const referralCount = 5;
  const rewardsEarned = 12.5; // XLM
  const totalEarned = 25.0; // XLM
  const referralLink = "https://nexapay.app/ref/YOUR_CODE_HERE"; // Replace with actual referral link

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    dispatch(showToast({ message: "Referral Link Copied", type: "success" }));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#1e2329] p-6 rounded-xl border border-white/5 shadow-xl">
      <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
        <Gift size={20} className="text-cyan-500" /> Referral Program
      </h3>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-black/40 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Referrals</p>
          <p className="text-lg font-black text-white">{referralCount}</p>
        </div>
        <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Rewards</p>
          <p className="text-lg font-black text-white">{rewardsEarned} XLM</p>
        </div>
        <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Earned</p>
          <p className="text-lg font-black text-white">{totalEarned} XLM</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Your Referral Link</p>
        <div className="flex items-center bg-black/40 rounded-xl border border-white/5 pr-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 bg-transparent text-white text-xs font-mono px-3 py-2 outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-colors active:scale-95"
            title="Copy Referral Link"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>
        </div>
        <button className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-cyan-500/20 transition-all active:scale-95">
          Invite Friends
        </button>
      </div>
    </div>
  );
}