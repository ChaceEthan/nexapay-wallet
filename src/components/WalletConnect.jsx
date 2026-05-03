import React, { useState, useEffect } from "react";
import useWallet from "@hooks/useWallet.js";
import { AlertTriangle, X, Key, Eye, EyeOff, Copy, Check, ShieldAlert, Fingerprint, Loader2 } from "lucide-react";
import { authenticateBiometric, isWebAuthnSupported } from "@/utils/webauthn";

export default function WalletConnect({ onConnect }) {
  const {
    address,
    connectWallet,
    disconnectWallet,
    loading,
    error
  } = useWallet();

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [showPlainSecret, setShowPlainSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  // PIN security states
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");

  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const [isBioLoading, setIsBioLoading] = useState(false);

  useEffect(() => {
    const enrolled = !!localStorage.getItem("nexa_biometric_id");
    setCanUseBiometrics(isWebAuthnSupported() && enrolled);
  }, []);

  const handleExportKey = () => {
    const wallets = JSON.parse(localStorage.getItem("nexa_wallets") || "[]");
    const wallet = wallets.find((w) => w.address === address);
    if (wallet && wallet.secretKey) {
      setSecretKey(wallet.secretKey);
      setShowPinConfirm(true);
      setConfirmPin("");
      setPinError("");
    } else {
      alert("Secret key export is only available for local NexaPay wallets. Freighter manages its own keys.");
    }
  };

  const handleVerifyPin = (e) => {
    if (e) e.preventDefault();
    const storedPin = localStorage.getItem("nexa_pin");
    if (String(confirmPin).trim() === String(storedPin).trim()) {
      setShowPinConfirm(false);
      setShowSecretModal(true);
    } else {
      setPinError("Incorrect PIN");
    }
  };

  const handleBiometricVerify = async () => {
    if (isBioLoading) return;
    setPinError("");
    setIsBioLoading(true);
    try {
      const success = await authenticateBiometric();
      if (success) {
        setShowPinConfirm(false);
        setShowSecretModal(true);
      }
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        setPinError("Biometric scan failed.");
      }
    } finally {
      setIsBioLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    const publicKey = await connectWallet();
    if (publicKey && onConnect) {
      onConnect(publicKey);
    }
  };
 
  return (
    <div className="bg-[#1e2329] border border-[#2b3139] p-4 rounded-xl text-white">

      {error && (
        <p className="text-red-400 text-sm mb-2">{error}</p>
      )}

      {!address ? (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-cyan-500 text-black font-bold py-2 rounded"
        >
          {loading
            ? "Connecting..."
            : "Connect Freighter"} 
        </button>
      ) : (
        <div>
          <p className="text-cyan-400 break-all text-xs">{address}</p>

          <button
            onClick={handleExportKey}
            className="w-full bg-[#2b3139] hover:bg-[#363c44] text-gray-300 mt-3 py-2 rounded flex items-center justify-center gap-2 text-xs font-bold transition-colors"
          >
            <Key size={14} /> Export Secret Key
          </button>

          <button
            onClick={() => setShowConfirm(true)}
            className="w-full bg-red-600 mt-2 py-2 rounded text-xs font-bold"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e2329] w-full max-w-sm rounded-2xl border border-[#2b3139] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle size={20} />
                <h3 className="font-bold">Disconnect Wallet?</h3>
              </div>
              <button onClick={() => setShowConfirm(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to disconnect? Your current session will be cleared, and you will need to re-authorize to access this vault.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  disconnectWallet();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Confirmation Modal */}
      {showPinConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#1e2329] w-full max-w-sm rounded-[2rem] border border-[#2b3139] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3 text-cyan-400">
                <ShieldAlert size={24} />
                <h3 className="text-xl font-bold">Verify PIN</h3>
              </div>
              <button onClick={() => setShowPinConfirm(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-6 text-center">
              Please enter your security PIN to view the secret key.
            </p>

            <form onSubmit={handleVerifyPin} className="space-y-6">
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="w-full p-4 bg-black/50 border border-gray-800 rounded-xl text-center text-2xl tracking-[0.5em] focus:border-cyan-500/50 outline-none transition-all placeholder:tracking-normal placeholder:text-gray-700 font-mono text-white"
                placeholder="••••••"
              />

              {pinError && (
                <p className="text-red-500 text-xs text-center font-bold animate-pulse">{pinError}</p>
              )}

              <button
                type="submit"
                disabled={confirmPin.length < 4}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-black py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
              >
                Confirm PIN
              </button>

              {canUseBiometrics && (
                <div className="pt-4 border-t border-gray-800/50">
                  <button
                    type="button"
                    onClick={handleBiometricVerify}
                    disabled={isBioLoading}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-cyan-500/30 transition-all text-gray-500 hover:text-cyan-400 group"
                  >
                    {isBioLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Fingerprint size={20} className="group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-xs font-black uppercase tracking-widest">
                      {isBioLoading ? "Scanning..." : "Biometric Verify"}
                    </span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Export Secret Key Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e2329] w-full max-w-md rounded-3xl border border-[#2b3139] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3 text-amber-500">
                <ShieldAlert size={24} />
                <h3 className="text-xl font-bold">Secret Key</h3>
              </div>
              <button onClick={() => { setShowSecretModal(false); setShowPlainSecret(false); }} className="text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
              <p className="text-xs text-red-400 leading-relaxed font-bold uppercase tracking-wider">
                ⚠️ Warning: Never share your Secret Key. Anyone with this key can access your funds permanently.
              </p>
            </div>

            <div className="relative mb-6">
              <div className="w-full bg-black border border-[#2b3139] rounded-xl p-5 text-sm font-mono break-all leading-relaxed text-gray-300 pr-12">
                {showPlainSecret ? secretKey : "•".repeat(secretKey.length || 56)}
              </div>
              <button 
                onClick={() => setShowPlainSecret(!showPlainSecret)}
                className="absolute right-4 top-5 text-gray-500 hover:text-cyan-400 transition-colors"
              >
                {showPlainSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 bg-[#2b3139] hover:bg-[#363c44] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                {copied ? "Copied!" : "Copy Key"}
              </button>
              <button
                onClick={() => { setShowSecretModal(false); setShowPlainSecret(false); }}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-4 rounded-2xl transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}