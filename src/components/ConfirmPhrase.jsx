import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, ArrowLeft, RotateCcw, AlertTriangle } from "lucide-react";

export default function ConfirmPhrase() {
  const navigate = useNavigate();
  const location = useLocation();

  const rawData = sessionStorage.getItem("wallet_setup");
  const walletData = rawData ? JSON.parse(rawData) : null;
  const mnemonic = walletData?.mnemonic;
  const secretKey = walletData?.secretKey;

  const originalWords = useMemo(() => {
    return mnemonic ? mnemonic.split(" ") : [];
  }, [mnemonic]);

  const [pool, setPool] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [showPhrase, setShowPhrase] = useState(false);

  useEffect(() => {
    if (!mnemonic) {
      navigate("/create-wallet", { replace: true });
      return;
    }

    setPool(shuffle([...originalWords]));
  }, [mnemonic]);

  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const addWord = (word, index) => {
    setSelected([...selected, word]);
    setPool(pool.filter((_, i) => i !== index));
    setError("");
  };

  const removeWord = (word, index) => {
    setPool([...pool, word]);
    setSelected(selected.filter((_, i) => i !== index));
  };

  const reset = () => {
    setSelected([]);
    setPool(shuffle([...originalWords]));
    setError("");
  };

  const verify = () => {
    if (selected.join(" ") === mnemonic) {
      const updatedData = { ...walletData, confirmed: true };
      sessionStorage.setItem("wallet_setup", JSON.stringify(updatedData));
      navigate("/set-pin", { replace: true });
    } else {
      setError("Incorrect order. Try again.");
    }
  };

  if (!mnemonic) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] text-white p-4">

      <div className="max-w-2xl w-full bg-[#1e2329] p-8 rounded-2xl border border-[#2b3139]">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <h1 className="text-xl font-bold">Verify Recovery Phrase</h1>
          <button onClick={reset} className="p-2 hover:bg-white/5 rounded-full transition-colors" title="Reset">
            <RotateCcw size={20} className="text-gray-400" />
          </button>
        </div>

        <p className="text-[#848e9c] text-sm text-center mb-6">
          Tap the words to put them next to each other in the correct order.
          {!walletData?.isImported && (
            <button 
              onClick={() => setShowPhrase(!showPhrase)}
              className="block mx-auto mt-2 text-cyan-400 hover:underline"
            >
              {showPhrase ? "Hide Phrase" : "Show Phrase (Write it down!)"}
            </button>
          )}
        </p>

        {showPhrase && !walletData?.isImported && (
          <div className="bg-black p-4 rounded-xl mb-6 border border-cyan-500/30 text-cyan-400 font-mono text-center">
            {mnemonic}
          </div>
        )}

        {/* SELECTED / SLOTS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 min-h-[160px] p-4 bg-[#0b0e11] rounded-xl border border-[#2b3139]">
          {originalWords.map((_, i) => (
            <div
              key={i}
              className={`h-10 flex items-center px-3 rounded-lg border text-sm transition-all ${
                selected[i]
                  ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 cursor-pointer hover:bg-cyan-500/20"
                  : "bg-transparent border-[#2b3139] border-dashed text-gray-600"
              }`}
              onClick={() => selected[i] && removeWord(selected[i], i)}
            >
              <span className="w-5 text-gray-500 text-xs font-mono">{i + 1}.</span>
              {selected[i] || ""}
            </div>
          ))}
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center justify-center gap-2 text-rose-400 bg-rose-500/10 p-2 rounded-lg mb-4 text-sm border border-rose-500/20">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* POOL */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {pool.map((word, i) => (
            <button
              key={i}
              onClick={() => addWord(word, i)}
              className="bg-[#2b3139] hover:bg-[#363c44] text-gray-200 px-4 py-2 rounded-xl text-sm transition-colors active:scale-95 shadow-sm"
            >
              {word}
            </button>
          ))}
        </div>

        {/* BUTTON */}
        <button
          disabled={selected.length !== originalWords.length}
          onClick={verify}
          className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-[#2b3139] disabled:text-[#848e9c] p-4 rounded-xl text-black font-bold flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
        >
          <ShieldCheck />
          Finish Verification
        </button>

      </div>
    </div>
  );
}