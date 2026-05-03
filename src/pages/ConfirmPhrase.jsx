import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import BackButton from "../components/BackButton";

/**
 * ConfirmPhrase
 * Verification layer for the newly generated recovery phrase.
 * Forces the user to paste or type the phrase to ensure they've saved it.
 */
export default function ConfirmPhrase() {
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const rawData = sessionStorage.getItem("wallet_setup");
  const walletData = rawData ? JSON.parse(rawData) : null;

  useEffect(() => {
    if (!walletData || !walletData.mnemonic) {
      navigate("/create-wallet", { replace: true });
    }
  }, [navigate, walletData]);

  if (!walletData) return null;

  const handleConfirm = () => {
    if (loading || isSuccess) return;

    setError("");
    setLoading(true);

    const cleanedInput = input.trim().replace(/\s+/g, " ").toLowerCase();
    const originalPhrase = walletData.mnemonic.trim().replace(/\s+/g, " ").toLowerCase();

    // Small delay for UX feel
    setTimeout(() => {
      if (cleanedInput !== originalPhrase) {
        setError("The phrase you entered does not match your recovery phrase. Please check for typos or extra spaces.");
        setLoading(false);
        return;
      }

      // ✅ SUCCESS
      setIsSuccess(true);
      
      // Update session data to mark as confirmed
      const updatedData = { ...walletData, confirmed: true };
      sessionStorage.setItem("wallet_setup", JSON.stringify(updatedData));

      // Redirect to PIN setup after a brief success state
      setTimeout(() => {
        navigate("/set-pin", { replace: true });
      }, 1500);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] text-white p-6 relative">
      <div className="absolute top-6 left-6">
        <BackButton />
      </div>

      <div className="w-full max-w-lg bg-[#1e2329] border border-[#2b3139] rounded-[3rem] p-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className={`inline-flex p-5 rounded-[2rem] mb-6 transition-colors ${isSuccess ? 'bg-green-500/10' : 'bg-cyan-500/10'}`}>
            {isSuccess ? (
              <CheckCircle2 className="text-green-400 animate-in zoom-in duration-300" size={42} />
            ) : (
              <ShieldCheck className="text-cyan-400" size={42} />
            )}
          </div>
          <h2 className="text-3xl font-black mb-3">Verify Recovery Phrase</h2>
          <p className="text-gray-400 text-sm leading-relaxed px-4">
            To ensure your assets are protected, please paste or type your 12-word recovery phrase exactly as it was shown.
          </p>
        </div>

        <div className="space-y-6">
          <textarea
            placeholder="Paste your 12 words here..."
            className={`w-full p-6 bg-black border rounded-2xl text-sm font-mono outline-none transition-all resize-none shadow-inner h-32 ${
              error ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-cyan-500/50'
            } ${isSuccess ? 'border-green-500/50 text-green-400' : 'text-white'}`}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError("");
            }}
            disabled={loading || isSuccess}
          />

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-500/5 p-4 rounded-xl border border-red-500/10 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {isSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-xs font-bold bg-green-500/5 p-4 rounded-xl border border-green-500/10 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={14} className="shrink-0" />
              Phrase verified successfully. Proceeding to PIN setup...
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={loading || isSuccess || !input.trim()}
            className={`w-full p-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl active:scale-95 ${
              isSuccess 
                ? "bg-green-500 text-black shadow-green-500/20" 
                : "bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-500/20"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (isSuccess ? "Verified" : "Verifying...") : "Verify & Continue"}
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">
            Security Protocol Active
          </p>
        </div>
      </div>
    </div>
  );
}
