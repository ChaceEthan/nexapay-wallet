import React from "react";
import ReferralDetails from "@/components/ReferralDetails";
import { Gift } from "lucide-react";

export default function Referrals() {
  return (
    <div className="p-8 md:p-12 max-w-[1200px] mx-auto space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col items-start gap-4">
        <div className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full">
           <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Growth Protocol</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">Referral Rewards</h1>
        <p className="text-gray-500 font-medium max-w-2xl leading-relaxed">
          Earn XLM rewards by inviting institutional partners and friends to the NexaPay ecosystem. 
          Rewards are distributed automatically based on network activity.
        </p>
      </header>

      <ReferralDetails />
    </div>
  );
}