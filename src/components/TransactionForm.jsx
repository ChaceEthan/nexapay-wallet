// @ts-nocheck
import React, { useState } from "react";
import { sendTransaction } from "../services/stellar";
import { QRCodeSVG } from "qrcode.react"; // ✅ named export

export default function TransactionForm({ publicKey, onSuccess }) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isMobile = typeof navigator !== "undefined" &&
    /Android|iPhone|iPad/i.test(navigator.userAgent);

  const paymentLink =
    destination && amount
      ? `web+stellar:pay?destination=${destination}&amount=${amount}&asset_code=XLM`
      : "";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!destination || !amount) {
      setError("Fill all fields");
      return;
    }

    setError("");
    setSuccess("");

    if (isMobile) {
      window.location.href = paymentLink;
      return;
    }

    if (!publicKey) {
      setError("Connect wallet first!");
      return;
    }

    setLoading(true);
    try {
      await sendTransaction({ publicKey, destination, amount });
      setSuccess("Transaction successful!");
      setDestination("");
      setAmount("");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <div className="p-3 text-red-400 bg-red-500/10 rounded-lg">{error}</div>}
      {success && <div className="p-3 text-green-400 bg-green-500/10 rounded-lg">{success}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Destination Address"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
        />
        <input
          type="number"
          step="0.0000001"
          placeholder="Amount XLM"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg"
        >
          {isMobile
            ? "Pay with Mobile Wallet"
            : loading
            ? "Sending..."
            : "Send XLM"}
        </button>
      </form>

      {paymentLink && (
        <div className="flex flex-col items-center mt-4">
          <p className="text-sm text-slate-400 mb-2">Scan QR to pay</p>
          <div className="bg-white p-3 rounded-xl">
            <QRCodeSVG value={paymentLink} size={180} />
          </div>
        </div>
      )}
    </div>
  );
}