// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import WalletConnect from "./WalletConnect";
import TransactionForm from "./TransactionForm";
import TransactionHistory from "./TransactionHistory";
import { getAccountDetails } from "../services/stellar";
import { Wallet, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const [publicKey, setPublicKey] = useState(null);
  const [balance, setBalance] = useState("0");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchBalance = useCallback(async (key) => {
    if (!key) return;
    try {
      const data = await getAccountDetails(key);
      const native = data?.balances?.find(b => b.asset_type === "native");
      setBalance(native ? native.balance : "0");
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setBalance("0");
    }
  }, []);

  useEffect(() => {
    if (publicKey) {
      fetchBalance(publicKey);
    }
  }, [publicKey, refreshTrigger, fetchBalance]);

  const handleConnect = (key) => setPublicKey(key);
  const handleTransactionSuccess = () => setRefreshTrigger(prev => prev + 1);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-5 mb-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
              <Wallet size={20} className="text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">NexaPay</h1>
          </div>
          <WalletConnect onConnect={handleConnect} />
        </header>

        {/* Balance & Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* Balance */}
          <section className="p-6 md:p-8 bg-slate-800 rounded-3xl border border-slate-700 lg:col-span-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Available Balance</span>
                {publicKey && (
                  <button onClick={handleTransactionSuccess} className="text-cyan-500 hover:text-cyan-400 transition-colors p-1 bg-cyan-500/10 rounded-md">
                    <RefreshCw size={14} />
                  </button>
                )}
              </h2>
              <p className="text-4xl md:text-5xl font-extrabold text-white mt-2 tracking-tight overflow-hidden break-all">
                {balance} <span className="text-cyan-400 text-2xl font-bold ml-1">XLM</span>
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <p className="text-sm text-slate-400 leading-relaxed">
                Send and receive XLM instantly with low fees on the Stellar Testnet.
              </p>
            </div>
          </section>

          {/* Transaction Form */}
          <section className="p-6 md:p-8 bg-slate-800 rounded-3xl border border-slate-700 lg:col-span-2">
            <h2 className="text-lg font-bold text-white mb-6">Send Payment</h2>
            <TransactionForm publicKey={publicKey} onSuccess={handleTransactionSuccess} />
          </section>

        </div>

        {/* Transaction History */}
        <section className="mt-6 lg:mt-8 p-6 md:p-8 bg-slate-800 rounded-3xl border border-slate-700">
          <h2 className="text-lg font-bold text-white mb-6">Recent Activity</h2>
          <TransactionHistory publicKey={publicKey} refreshTrigger={refreshTrigger} />
        </section>

      </div>
    </div>
  );
}
