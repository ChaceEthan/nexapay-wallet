import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldAlert, CheckCircle2, Copy, ArrowRight } from "lucide-react";

export default function BackupPhrase() {
  const navigate = useNavigate();
  const location = useLocation();

  const secretKey = location.state?.secretKey;
  const incomingMnemonic = location.state?.mnemonic;

  const [mnemonic, setMnemonic] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!secretKey) {
      navigate("/create-wallet", { replace: true });
      return;
    }

    if (incomingMnemonic) {
      setMnemonic(incomingMnemonic);
    }
  }, [secretKey, incomingMnemonic, navigate]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    navigate("/confirm-phrase", {
      state: { mnemonic, secretKey },
    });
  };

  if (!mnemonic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center p-4 text-white">

      <div className="max-w-2xl w-full bg-[#1e2329] p-8 rounded-2xl border border-[#2b3139] text-center">

        {/* ICON */}
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={40} className="text-amber-500" />
        </div>

        <h1 className="text-2xl font-bold mb-2">
          Backup Recovery Phrase
        </h1>

        <p className="text-gray-400 mb-6">
          This is your ONLY backup. Store it safely offline.
        </p>

        {/* WORDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {mnemonic.split(" ").map((word, i) => (
            <div
              key={i}
              className="bg-[#0b0e11] border border-[#2b3139] p-2 rounded text-cyan-400 text-sm"
            >
              <span className="text-gray-500 mr-1">{i + 1}.</span>
              {word}
            </div>
          ))}
        </div>

        {/* WARNING */}
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded mb-6 text-left text-sm text-red-300">
          ⚠ Never share this phrase. Anyone with it can control your wallet.
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3">

          <button
            onClick={handleCopy}
            className="flex-1 bg-gray-700 p-3 rounded flex justify-center gap-2"
          >
            {copied ? <CheckCircle2 /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </button>

          <button
            onClick={handleContinue}
            className="flex-1 bg-cyan-500 p-3 rounded flex justify-center gap-2"
          >
            Continue <ArrowRight />
          </button>

        </div>

      </div>
    </div>
  );
}