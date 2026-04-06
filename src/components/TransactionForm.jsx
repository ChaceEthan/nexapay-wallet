import React, { useState } from "react";
import { sendTransaction } from "../services/stellar";
import { Send } from "lucide-react";

export default function TransactionForm({ publicKey, onSuccess }) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!publicKey) {
      setError("Connect wallet first!");
      return;
    }

    setError(""); setSuccess(""); setLoading(true);
    try {
      await sendTransaction({ publicKey, destination, amount });
      setSuccess("Transaction successful!");
      setDestination(""); setAmount("");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="p-3 text-red-400 bg-red-500/10 rounded-lg">{error}</div>}
      {success && <div className="p-3 text-green-400 bg-green-500/10 rounded-lg">{success}</div>}
      <input type="text" placeholder="Destination Address" value={destination} onChange={e => setDestination(e.target.value)} required />
      <input type="number" step="0.0000001" placeholder="Amount XLM" value={amount} onChange={e => setAmount(e.target.value)} required />
      <button disabled={!publicKey || loading} type="submit">
        {loading ? "Sending..." : "Send XLM"}
      </button>
    </form>
  );
}