import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import BackButton from "./BackButton";

export default function RecoveryMode() {
  const navigate = useNavigate();

  const handleFullReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] text-white p-6">
      <div className="absolute top-6 left-6"><BackButton /></div>
      <div className="w-full max-w-md bg-[#1e2329] border border-red-500/20 rounded-[2.5rem] p-10 shadow-2xl text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-red-500" size={40} />
        </div>
        
        <h1 className="text-2xl font-black mb-4">Forgot PIN?</h1>
        
        <div className="bg-black/30 p-4 rounded-2xl mb-8 border border-white/5">
          <p className="text-gray-400 text-sm leading-relaxed text-left">
            Since NexaPay is a <span className="text-white font-bold">self-custodial wallet</span>, we cannot recover or reset your PIN.
            <br /><br />
            To regain access, you must reset the application and use your <span className="text-cyan-400 font-bold">12-word recovery phrase</span> to restore your wallet.
          </p>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={handleFullReset}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold p-5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <RotateCcw size={20} />
            Wipe App Data & Reset
          </button>
          
          <button 
            onClick={() => navigate(-1)}
            className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold p-5 rounded-2xl transition-all flex items-center justify-center gap-3"
          >
            Cancel
          </button>
        </div>
        
        <p className="mt-8 text-[10px] text-gray-600 uppercase tracking-widest font-black">
          ⚠️ Warning: This will delete all local vaults.
        </p>
      </div>
    </div>
  );
}