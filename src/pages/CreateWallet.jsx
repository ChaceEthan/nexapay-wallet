import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as bip39 from "bip39";
import { Copy, Check, ShieldCheck, AlertTriangle } from "lucide-react";
import { deriveKeypairFromMnemonic } from "@/services/stellar";
import BackButton from "../components/BackButton";

export default function CreateWallet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("create"); // 'create' or 'recover'
  const [step, setStep] = useState(1); // 1: Select/Input, 2: Show Phrase
  const [generatedPhrase, setGeneratedPhrase] = useState("");
  const [importPhrase, setImportPhrase] = useState("");
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const mnemonic = bip39.generateMnemonic();
      setGeneratedPhrase(mnemonic);
      setStep(2);
    } catch (err) {
      setError("Failed to generate phrase.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToConfirmation = () => {
    const keys = deriveKeypairFromMnemonic(generatedPhrase);
    
    const newWallet = {
      id: Date.now().toString(),
      address: keys.publicKey,
      mnemonic: generatedPhrase,
      secretKey: keys.secretKey,
      walletType: "INTERNAL",
      createdAt: Date.now(),
      isImported: false,
      confirmed: false
    };

    sessionStorage.setItem("wallet_setup", JSON.stringify(newWallet));
    navigate("/confirm-phrase");
  };

  const handleRecover = () => {
    const cleanedInput = importPhrase.trim().replace(/\s+/g, " ");
    if (!cleanedInput) return setError("Enter your recovery phrase.");

    const words = cleanedInput.split(" ");
    if (words.length !== 12 && words.length !== 24) {
      return setError("Recovery phrase must be 12 or 24 words.");
    }

    if (!bip39.validateMnemonic(cleanedInput)) {
      return setError("Invalid recovery phrase. Check spelling.");
    }

    const keys = deriveKeypairFromMnemonic(cleanedInput);
    
    const newWallet = {
      id: Date.now().toString(),
      address: keys.publicKey,
      mnemonic: cleanedInput,
      secretKey: keys.secretKey,
      walletType: "INTERNAL",
      createdAt: Date.now(),
      isImported: true,
      confirmed: false 
    };

    sessionStorage.setItem("wallet_setup", JSON.stringify(newWallet));
    navigate("/confirm-phrase");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] text-white px-4 relative">
      <div className="absolute top-6 left-6">
        <BackButton />
      </div>

      <div className="w-full max-w-md bg-[#1e2329] border border-[#2b3139] rounded-[2rem] p-8 shadow-2xl">
        
        {step === 1 ? (
          <>
            <div className="flex gap-2 mb-8 bg-black p-1.5 rounded-2xl border border-white/5">
              <button
                onClick={() => { setMode("create"); setError(""); }}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                  mode === "create" ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20" : "text-gray-500 hover:text-white"
                }`}
              >
                Create New
              </button>
              <button
                onClick={() => { setMode("recover"); setError(""); }}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                  mode === "recover" ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20" : "text-gray-500 hover:text-white"
                }`}
              >
                Recover
              </button>
            </div>

            {mode === "create" ? (
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="text-cyan-400" size={32} />
                </div>
                <h2 className="text-xl font-bold mb-2">New Secure Wallet</h2>
                <p className="text-gray-400 text-sm">Generate a 12-word recovery phrase to secure your account.</p>
              </div>
            ) : (
              <div className="mb-8">
                <p className="text-gray-400 text-sm mb-4 text-center">Paste your 12 or 24-word recovery phrase.</p>
                <textarea
                  placeholder="apple banana cherry..."
                  className="w-full p-5 bg-black border border-gray-800 rounded-2xl text-sm font-mono text-cyan-500 outline-none focus:border-cyan-500 transition-all resize-none shadow-inner"
                  rows={4}
                  value={importPhrase}
                  onChange={(e) => setImportPhrase(e.target.value)}
                />
              </div>
            )}

            {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-6 text-xs font-bold text-center border border-red-500/20">{error}</div>}

            <button
              onClick={mode === "create" ? handleGenerate : handleRecover}
              disabled={loading}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-cyan-500/10"
            >
              {loading ? "Processing..." : mode === "create" ? "Generate Phrase" : "Recover Wallet"}
            </button>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="text-amber-500" size={32} />
              </div>
              <h2 className="text-xl font-bold">Backup Your Phrase</h2>
              <p className="text-gray-400 text-sm mt-2 px-2">Write down these 12 words in order. You'll need them to verify in the next step.</p>
            </div>

            <div className="bg-black p-6 rounded-[1.5rem] border border-gray-800 mb-8 relative group shadow-inner">
              <p className="font-mono text-center text-cyan-400 leading-relaxed text-lg select-all">
                {generatedPhrase}
              </p>
              <button 
                onClick={handleCopy}
                className="absolute -top-3 -right-3 w-10 h-10 bg-[#1e2329] border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-all shadow-xl"
              >
                {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleProceedToConfirmation}
                className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-cyan-500/20"
              >
                I have saved my phrase
              </button>
              <button
                onClick={() => setStep(1)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
              >
                Back to settings
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
