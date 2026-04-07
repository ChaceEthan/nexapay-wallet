// @ts-nocheck
import React, { useEffect, useState } from "react";
import { getTransactionHistory } from "../services/stellar";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function TransactionHistory({ publicKey, refreshTrigger }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const records = await getTransactionHistory(publicKey);
        setHistory(records);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [publicKey, refreshTrigger]);

  if (!publicKey) {
    return <div className="text-sm text-slate-500 italic">Connect wallet to view history.</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (history.length === 0) {
    return <div className="text-sm text-slate-500">No transactions found.</div>;
  }

  return (
    <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {history.map((tx) => {
        const isReceived = tx.to === publicKey;
        const Icon = isReceived ? ArrowDownLeft : ArrowUpRight;
        
        return (
          <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isReceived ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                <Icon size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-200">
                  {isReceived ? 'Received XLM' : 'Sent XLM'}
                </span>
                <span className="text-xs text-slate-500 font-mono truncate w-32 md:w-48" title={isReceived ? tx.from : tx.to}>
                  {isReceived ? tx.from : tx.to}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-bold ${isReceived ? 'text-emerald-400' : 'text-slate-200'}`}>
                {isReceived ? '+' : '-'}{tx.amount}
              </span>
              <a 
                href={`https://stellar.expert/explorer/testnet/tx/${tx.transaction_hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-500 hover:text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded transition-colors"
              >
                View
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}