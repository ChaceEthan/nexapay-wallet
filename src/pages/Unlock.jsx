import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUnlocked, resetPinAttempts } from "../authSlice.js";
import { setDecryptedSecretKey, syncWalletState } from "../walletSlice.js";
import CryptoJS from "crypto-js";
import { decrypt } from "@/utils/crypto";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export default function Unlock() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const loadingRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { activeWalletId } = useSelector((state) => state.wallet);

  // ⏱ Countdown for lockout
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setTimeLeft(0);
        setLockoutUntil(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // 🔑 Redirect to set-pin if no PIN found for this wallet
  useEffect(() => {
    if (!activeWalletId) return;
    const walletPin = localStorage.getItem(`nexa_pin_hash_${activeWalletId}`);
    if (!walletPin) {
      navigate("/set-pin", { replace: true });
    }
  }, [activeWalletId, navigate]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (loadingRef.current) return;

    setError("");

    // Lockout check
    if (lockoutUntil && Date.now() < lockoutUntil) {
      setError(`Too many attempts. Wait ${timeLeft}s.`);
      return;
    }

    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN must be 4–6 digits.");
      return;
    }

    loadingRef.current = true;
    setLoading(true);

    try {
      const storedHash = localStorage.getItem(
        `nexa_pin_hash_${activeWalletId}`
      );
      if (!storedHash) {
        setError("No PIN found. Please set PIN again.");
        return;
      }

      const enteredHash = CryptoJS.SHA256(pin).toString();

      if (enteredHash !== storedHash) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_DURATION_MS;
          setLockoutUntil(until);
          setFailedAttempts(0);
          setError("Too many attempts. Locked for 5 minutes.");
        } else {
          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt(s) left.`);
        }
        return;
      }

      // ✅ PIN correct — decrypt secret key
      const encryptedSecret = localStorage.getItem(
        `nexa_secret_enc_${activeWalletId}`
      );

      if (!encryptedSecret) {
        setError("Wallet data missing. Please re-import.");
        return;
      }

      const decryptedSecret = decrypt(encryptedSecret, pin);

      if (!decryptedSecret || !decryptedSecret.startsWith("S")) {
        setError("Decryption failed. Check your PIN.");
        return;
      }

      // ✅ Store secret key in Redux ONLY (never in localStorage)
      dispatch(setDecryptedSecretKey(decryptedSecret));

      // ✅ Load wallet blockchain data
      const wallets = JSON.parse(
        localStorage.getItem("nexa_wallets") || "[]"
      );
      const currentWallet = wallets.find((w) => w.id === activeWalletId);
      if (currentWallet?.address) {
        dispatch(syncWalletState(currentWallet.address));
      }

      dispatch(resetPinAttempts());
      dispatch(setUnlocked(true));

      setFailedAttempts(0);

      const from = location.state?.from || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setError("Unlock failed. Try again.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const handleForgotPin = () => {
    const ok = window.confirm(
      "This will clear all app data.\nMake sure you have your recovery phrase before continuing."
    );
    if (ok) {
      localStorage.clear();
      dispatch({ type: "auth/APP_RESET" });
      navigate("/", { replace: true });
    }
  };


  const isLocked = lockoutUntil > 0 && Date.now() < lockoutUntil;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] text-white px-4">
      <form
        onSubmit={handleUnlock}
        className="bg-[#1e2329] p-8 rounded-2xl w-full max-w-md border border-[#2b3139] shadow-xl"
      >
        <h1 className="text-2xl font-black text-center mb-2">Unlock Wallet</h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          Enter your PIN to continue
        </p>

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        {isLocked && (
          <p className="text-yellow-400 text-sm mb-4 text-center">
            Locked for {timeLeft}s
          </p>
        )}

        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          type="password"
          placeholder="Enter PIN"
          maxLength={6}
          disabled={isLocked || loading}
          autoFocus
          className="w-full p-4 bg-black border border-gray-700 rounded-xl mb-4 text-center text-xl tracking-widest outline-none focus:border-cyan-500 transition-all"
        />

        <button
          type="submit"
          disabled={loading || isLocked}
          className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold p-4 rounded-xl transition-all"
        >
          {loading ? "Unlocking..." : "Unlock"}
        </button>

        <button
          type="button"
          onClick={handleForgotPin}
          className="w-full text-gray-500 text-xs mt-5 hover:text-cyan-400 transition-colors"
        >
          Forgot PIN? (Reset App)
        </button>
      </form>
    </div>
  );
}