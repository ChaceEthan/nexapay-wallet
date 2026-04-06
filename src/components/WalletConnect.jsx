import React, { useState, useEffect } from "react";
import { isConnected, getPublicKey, setAllowed } from "@stellar/freighter-api";
import { Wallet } from "lucide-react";

export default function WalletConnect({ onConnect }) {
  const [address, setAddress] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Optionally auto-reconnect logic could go here
  }, []);

  const handleConnect = async () => {
    try {
      const connected = await isConnected();
      if (!connected) {
        setError("Freighter not installed!");
        return;
      }
      
      await setAllowed();
      const publicKey = await getPublicKey();
      setAddress(publicKey);
      if (onConnect) onConnect(publicKey);
    } catch (err) {
      console.error(err);
      setError("Failed to connect wallet.");
    }
  };

  if (address) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg shadow-sm">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm text-slate-300 font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-end">
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition-colors border border-cyan-500 hover:border-cyan-400 shadow-lg shadow-cyan-500/20"
      >
        <Wallet size={18} />
        Connect Wallet
      </button>
      {error && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 right-0 whitespace-nowrap">{error}</p>}
    </div>
  );
}
