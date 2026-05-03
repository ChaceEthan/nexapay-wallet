import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Lock, Eye, EyeOff, ShieldAlert, KeyRound, Fingerprint, RefreshCcw } from "lucide-react";
import CryptoJS from "crypto-js";
import { useNavigate } from "react-router-dom";
import { 
  setUnlocked, 
  setAppUnlocked,
  recordPinFailure, 
  resetPinAttempts,
  reportSecurityError
} from "@/authSlice";
import { setActiveWallet } from "@/walletSlice";
import { authenticateBiometric, isWebAuthnSupported } from "@/utils/webauthn";

/**
 * LockScreen
 * Dual-mode security gate.
 * MASTER: Unlocks the app shell.
 * WALLET: Unlocks a specific wallet vault.
 */
export default function LockScreen({ mode = "MASTER" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeWalletId } = useSelector((s) => s.wallet);
  
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);

  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
    
    // Check if device supports WebAuthn and user has enrolled
    const enrolled = !!localStorage.getItem("nexa_biometric_id");
    setCanUseBiometrics(isWebAuthnSupported() && enrolled);

    // Safe Auto-trigger Biometrics
    const bioTrigger = async () => {
      if (isWebAuthnSupported() && enrolled && !loading) {
        await handleBiometricUnlock();
      }
    };
    bioTrigger();
  }, [mode]); // Removed unnecessary dependencies to prevent loop

  // Handler 1: PIN Authentication (Strict Normalization)
  const handlePinUnlock = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (loading) return; // FIX: Guard against double submission
    setError("");
    
    if (pin.length < 4) {
      setError("Please enter your complete PIN.");
      return;
    }
    setLoading(true);
 
    const validationTimer = setTimeout(() => {
      try {
        const storedPin = typeof window !== 'undefined' ? localStorage.getItem("nexa_pin") : null;
        
        if (!storedPin) throw new Error("Security PIN not found.");

        // 🛡️ FIXED: Strict validation with normalization
        const isValid = String(pin).trim() === String(storedPin).trim();

        if (isValid) {
          dispatch(resetPinAttempts());
          localStorage.setItem("nexa_app_locked", "false");
          
          if (mode === "MASTER") {
            dispatch(setAppUnlocked(true));
            navigate("/select-wallet");
          } else {
            dispatch(setUnlocked(true));
            navigate("/dashboard");
          }
        } else {
          setError("Incorrect Security PIN");
          setPin("");
        }
      } catch (err) { 
        setError(err.message || "Security Module Error");
      } finally {
        setLoading(false);
      }
    }, 600);
  };

  // Handler 2: Biometric Authentication (Independent Flow)
  const handleBiometricUnlock = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (loading) return; // FIX: Guard against double submission
    
    setError("");
    setLoading(true);

    try {
      const success = await authenticateBiometric();
      if (success) {
        if (mode === "MASTER") {
          localStorage.setItem("nexa_app_locked", "false");
          dispatch(setAppUnlocked(true));
          navigate("/select-wallet");
        } else {
          dispatch(setUnlocked(true));
          navigate("/dashboard");
        }
      }
    } catch (err) { 
      if (err.name !== "NotAllowedError") { 
        setError("Biometric scan failed. Use PIN.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchWallet = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    } 
    dispatch(setActiveWallet(null));
    navigate("/select-wallet");
  };

  const handleForgotPin = (e) => {
    if (e) e.preventDefault();
    navigate("/recovery");
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0b0e11] flex flex-col items-center justify-center p-6 backdrop-blur-3xl">
      <div className="w-full max-w-md bg-[#1e2329] border border-[#2b3139] rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-24 h-24 bg-cyan-500/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner ring-1 ring-cyan-500/20">
            {mode === "MASTER" ? (
              <Lock className="text-cyan-400" size={44} />
            ) : (
              <KeyRound className="text-blue-400" size={44} />
            )}
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            {mode === "MASTER" ? "App Locked" : "Unlock Wallet"}
          </h1>
          <p className="text-gray-400 text-sm font-medium px-4">
            {mode === "MASTER" 
              ? "Enter your Master PIN to access the wallet list." 
              : "Enter your Wallet PIN to authorize sessions."}
          </p>
        </div>

        {/* PIN FORM */}
        <form onSubmit={handlePinUnlock} className="space-y-6">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPin ? "text" : "password"}
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full p-6 bg-black/50 border-2 border-gray-800 rounded-[1.5rem] text-center text-4xl tracking-[0.4em] focus:border-cyan-500/50 outline-none transition-all placeholder:tracking-normal placeholder:text-gray-700 font-mono"
              placeholder="••••••"
              autoComplete="off"
            />
            <button 
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
            >
              {showPin ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 justify-center text-red-500 text-sm font-bold animate-pulse">
              <ShieldAlert size={18} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-black font-black p-6 rounded-[1.5rem] transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-3 text-xl"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              mode === "MASTER" ? "Unlock App" : "Authorize Wallet"
            )}
          </button>
        </form>

        {/* BIOMETRIC SIMULATION (Mobile-First UX) - Moved outside form to prevent event collision */}
        <div className="pt-4 mt-6 border-t border-gray-800/30">
          <button
          type="button"
          onClick={handleBiometricUnlock}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-cyan-500/30 transition-all text-gray-500 hover:text-cyan-400 group relative z-[20]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          ) : (
            <Fingerprint size={20} className="group-hover:scale-110 transition-transform" />
          )}
          <span className="text-xs font-black uppercase tracking-widest">
            {loading ? "Scanning..." : "Biometric Unlock"}
          </span>
        </button>
        </div>

          <button
            type="button"
            onClick={handleForgotPin}
            className="w-full text-center text-gray-500 text-xs mt-6 hover:text-cyan-400 transition-colors font-bold uppercase tracking-widest"
          >
            Forgot PIN?
          </button> 
        {/* FOOTER ACTIONS */}
        <div className="mt-10 pt-8 border-t border-gray-800/50 flex flex-col items-center gap-4">
          {mode === "WALLET" || !activeWalletId ? (
            <button 
              onClick={handleSwitchWallet}
              className="text-cyan-500 text-xs font-black uppercase tracking-widest hover:text-cyan-400 transition-colors"
            >
              Switch Wallet
            </button>
          ) : (
            <div className="flex flex-col gap-4 items-center">
              <button 
                onClick={() => navigate("/create-wallet")}
                className="text-cyan-500/80 text-[10px] font-black uppercase tracking-widest hover:text-cyan-400 transition-colors"
              >
                + Create New Wallet
              </button>
              <button 
                onClick={() => {
                  localStorage.clear();
                  dispatch({ type: "auth/APP_RESET" });
                  navigate("/", { replace: true });
                }}
                className="text-red-500/60 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-colors"
              >
                Trouble Unlocking? Reset App
              </button>

            </div>
          )}
          <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.2em]">
            NexaPay Security Engine v4.0
          </p>
        </div>
      </div>
    </div>
  );
}
