import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Wallet, Upload, Plug } from "lucide-react";
import useWallet from "../hooks/useWallet";
import { setHasWallet } from "@/authSlice";
import { addWallet, setActiveWallet } from "@/walletSlice";
import { trackActiveWallet } from "@/utils/analytics";
import { isFreighterAvailable } from "@/utils/freighterUtils";

// Simple spinner component
const LoadingSpinner = ({ size = 16 }) => (
  <svg
    className="animate-spin"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

export default function WalletChoice() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, connectWallet } = useWallet();
  const [freighterError, setFreighterError] = useState("");

  const handleFreighter = async () => {
    setFreighterError("");

    try {
      // ✅ Check if Freighter is available using proper API
      const available = await isFreighterAvailable();
      if (!available) {
        setFreighterError("Freighter extension not detected. Please install it from: https://www.freighter.app");
        return;
      }

      // ✅ Use the useWallet hook which handles all the connection logic properly
      const publicKey = await connectWallet();
      if (publicKey) {
        // 📊 Track active user (Stellar Analytics)
        trackActiveWallet(publicKey);
      }
    } catch (err) {
      setFreighterError(err.message || "Failed to connect Freighter wallet");
      console.error("Freighter connection error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center p-4 text-white">

      <div className="max-w-md w-full bg-[#1e2329] p-8 rounded-2xl border border-[#2b3139] text-center">

        <h1 className="text-2xl font-bold mb-2">NexaPay Wallet</h1>
        <p className="text-gray-400 mb-6">
          Choose how you want to continue
        </p>

        {(error || freighterError) && (
          <div className="w-full mb-4 px-4 py-3 bg-red-900/30 border border-red-500/50 rounded-lg">
            <p className="text-red-300 text-sm font-medium">{error || freighterError}</p>
          </div>
        )}

        {/* CREATE */}
        <button
          onClick={() => navigate("/create-wallet")}
          className="w-full mb-3 px-4 py-3 text-sm bg-cyan-500 hover:bg-cyan-600 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors"
        >
          <Wallet size={20} />
          Create Wallet
        </button>

        {/* IMPORT */}
        <button
          onClick={() => navigate("/import-wallet")}
          className="w-full mb-3 px-4 py-3 text-sm bg-[#2b3139] hover:bg-[#353d4a] rounded-xl flex items-center justify-center gap-2 font-bold transition-colors"
        >
          <Upload size={20} />
          Import Wallet
        </button>

        {/* FREIGHTER */}
        <button
          disabled={loading}
          onClick={handleFreighter}
          className="w-full px-4 py-3 text-sm bg-green-500 hover:bg-green-600 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <LoadingSpinner size={20} />
              Connecting...
            </>
          ) : (
            <>
              <Plug size={20} />
              Connect Freighter
            </>
          )}
        </button>

      </div>
    </div>
  );
}