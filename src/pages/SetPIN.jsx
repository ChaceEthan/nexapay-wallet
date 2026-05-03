import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";
import { encrypt } from "@/utils/crypto";

import { addWallet, setActiveWallet, syncWalletState } from "@/walletSlice";
import {
  setHasWallet,
  setHasPin,
  setAppUnlocked,
  setUnlocked,
} from "@/authSlice";

import { trackActiveWallet } from "@/utils/analytics";
import { fundTestnetAccount } from "@/services/stellar";
import BackButton from "../components/BackButton";

export default function SetPIN() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const network = useSelector((state) => state.auth.network || "testnet");

  const [isActivating, setIsActivating] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  // ✅ Guard: redirect if no confirmed setup data
  useEffect(() => {
    const rawData = sessionStorage.getItem("wallet_setup");
    if (!rawData) {
      navigate("/welcome", { replace: true });
      return;
    }
    const data = JSON.parse(rawData);
    if (!data.confirmed) {
      navigate("/welcome", { replace: true });
    }
  }, [navigate]);

  const handleSetPin = async () => {
    if (isActivating) return;
    setError("");

    // Validation
    if (!walletName.trim()) {
      setError("Enter a wallet name.");
      return;
    }

    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN must be 4–6 digits.");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }

    const rawData = sessionStorage.getItem("wallet_setup");
    if (!rawData) {
      navigate("/welcome", { replace: true });
      return;
    }
    const data = JSON.parse(rawData);

    if (!data.confirmed) {
      setError("Wallet setup not confirmed. Please restart.");
      navigate("/welcome", { replace: true });
      return;
    }

    if (!data.address || !data.secretKey) {
      setError("Wallet setup data is corrupted. Please start over.");
      navigate("/welcome", { replace: true });
      return;
    }

    try {
      setIsActivating(true);

      // ✅ Use the id from setup data or generate a fresh one
      const walletId = data.id || uuidv4();

      // 🔐 Hash PIN per wallet
      const pinHash = CryptoJS.SHA256(pin).toString();

      // 🔒 Encrypt secret and mnemonic
      const encryptedSecret = encrypt(data.secretKey, pin);
      const encryptedMnemonic = data.mnemonic
        ? encrypt(data.mnemonic, pin)
        : null;

      const walletMeta = {
        id: walletId,
        address: data.address,
        name: walletName.trim(),
        mnemonic: encryptedMnemonic,
        secretKey: encryptedSecret,
        walletType: "INTERNAL",
        isImported: !!data.isImported,
        confirmed: true, // ✅ Confirm before storage
        createdAt: Date.now(),
      };


      // 🔥 Store per-wallet PIN hash and encrypted keys
      localStorage.setItem(`nexa_pin_hash_${walletId}`, pinHash);
      localStorage.setItem(`nexa_secret_enc_${walletId}`, encryptedSecret);
      if (encryptedMnemonic) {
        localStorage.setItem(`nexa_mnemonic_enc_${walletId}`, encryptedMnemonic);
      }

      // 📊 Track
      trackActiveWallet(walletMeta.address);

      // 🔄 Update Redux (addWallet handles localStorage sync)
      dispatch(setHasWallet(true));
      dispatch(setHasPin(true));
      dispatch(addWallet(walletMeta));
      dispatch(setActiveWallet(walletId));
      dispatch(setAppUnlocked(true));
      dispatch(setUnlocked(true));


      // 💸 Fund testnet if applicable
      if (network === "testnet") {
        try {
          await fundTestnetAccount(walletMeta.address);
        } catch {
          // Funding is optional, do not block
        }
      }

      // 🔄 Sync on-chain data
      await dispatch(syncWalletState(walletMeta.address));

      // 🧹 Clean temp data from memory
      sessionStorage.removeItem("wallet_setup");

      // 🚀 Navigate to dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("Setup failed. Please try again.");
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] text-white p-6 relative">
      <div className="absolute top-6 left-6">
        <BackButton />
      </div>

      <div className="w-full max-w-md bg-[#1e2329] p-10 rounded-3xl border border-[#2b3139] shadow-xl">
        <h2 className="text-2xl font-black text-center text-blue-400 mb-2">
          Wallet PIN Setup
        </h2>
        <p className="text-gray-400 text-sm text-center mb-8">
          Name your wallet and choose a PIN to secure it.
        </p>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        <input
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          placeholder="Wallet Name (e.g. My Main Wallet)"
          className="w-full p-4 mb-3 bg-black border border-gray-800 rounded-xl text-center outline-none focus:border-cyan-500/50 transition-all"
        />

        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="PIN (4–6 digits)"
          maxLength={6}
          className="w-full p-4 mb-3 bg-black border border-gray-800 rounded-xl text-center text-xl tracking-widest outline-none focus:border-cyan-500/50 transition-all"
        />

        <input
          type="password"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
          placeholder="Confirm PIN"
          maxLength={6}
          className="w-full p-4 mb-6 bg-black border border-gray-800 rounded-xl text-center text-xl tracking-widest outline-none focus:border-cyan-500/50 transition-all"
        />

        <button
          onClick={handleSetPin}
          disabled={isActivating}
          className={`w-full p-4 rounded-xl font-bold transition-all ${
            isActivating
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isActivating ? "Activating..." : "Activate Wallet"}
        </button>
      </div>
    </div>
  );
}