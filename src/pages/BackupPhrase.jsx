import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BackButton from "../components/BackButton";

export default function BackupPhrase() {
  const navigate = useNavigate(); 
  const location = useLocation();

  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Read from secure memory
  const rawData = sessionStorage.getItem("wallet_setup");
  const walletData = rawData ? JSON.parse(rawData) : null;

  useEffect(() => {
    if (!walletData) {
      navigate("/create-wallet", { replace: true });
    }
  }, [walletData, navigate]);

  if (!walletData) return null;

  const { mnemonic } = walletData;

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] text-white p-4 relative">
      <div className="absolute top-6 left-6"><BackButton /></div>

      <div className="w-full max-w-md bg-[#1e2329] p-6 rounded-xl">

        <h1 className="text-xl font-bold mb-4 text-center">
          Backup Your Recovery Phrase
        </h1>

        {/* 🔥 GRID WORDS */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {mnemonic.split(" ").map((word, i) => (
            <div key={i} className="bg-black p-2 rounded flex justify-between">
              <span className="text-gray-400">{i + 1}.</span>
              <span className="text-cyan-400">{word}</span>
            </div>
          ))}
        </div>

        {/* COPY BUTTON */}
        <button
          onClick={handleCopy}
          className="w-full mb-3 bg-gray-700 p-2 rounded"
        >
          {copied ? "Copied!" : "Copy Phrase"}
        </button>

        {/* ✅ CONFIRM CHECKBOX */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={() => setConfirmed(!confirmed)}
          />
          <span className="text-sm text-gray-400">
            I have saved my recovery phrase
          </span>
        </div>

        {/* CONTINUE BUTTON */}
        <button
          onClick={() => navigate("/confirm-phrase", { replace: true })}
          disabled={!confirmed}
          className={`w-full p-3 rounded font-bold transition-all ${
            confirmed
              ? "bg-cyan-500 hover:bg-cyan-600"
              : "bg-gray-600 cursor-not-allowed"
          }`}
        >
          Continue
        </button>

      </div>
    </div>
  );
}