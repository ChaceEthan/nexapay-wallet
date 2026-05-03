import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useResolvedPath } from "react-router-dom";
import { Keypair } from "@stellar/stellar-sdk";
import { Download, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import * as bip39 from "bip39";
import * as stellar from "@/services/stellar";
import { setActiveWallet, findWalletByAddress } from "../walletSlice";
import { setUnlocked } from "../authSlice";
import BackButton from "../components/BackButton";

export default function ImportWallet() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const resolvedPath = useResolvedPath(window.location.pathname); // For stable path checks

  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const network = useSelector((state) => state.auth?.network || "testnet");

  // ✅ Auto-fill if redirected from successful confirmation
  React.useEffect(() => {
    const rawData = sessionStorage.getItem("wallet_setup");
    if (rawData) {
      try {
        const data = JSON.parse(rawData);
        if (data.confirmed && data.mnemonic) {
          setInput(data.mnemonic);
        }
      } catch (e) {
        console.error("Failed to parse wallet_setup:", e);
      }
    }
  }, []);


  const handleImport = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    setError("");

    try {
      setLoading(true);

      const cleanedInput = input.trim().replace(/\s+/g, " ");

      if (!cleanedInput) {
        setError("Enter a recovery phrase or secret key.");
        return;
      }

      const words = cleanedInput.split(" ");
      const isMnemonic = words.length >= 12;

      let publicKey, secretKey;

      if (isMnemonic) {
        // ✅ Validate word count (12 or 24 words)
        if (words.length !== 12 && words.length !== 24) {
          setError("Recovery phrase must be 12 or 24 words.");
          return;
        }

        // ✅ Validate using bip39
        const isValid = bip39.validateMnemonic(cleanedInput);
        if (!isValid) {
          setError("Invalid recovery phrase. Check spelling and word order.");
          return;
        }
        const wallet = stellar.deriveKeypairFromMnemonic(cleanedInput);
        publicKey = wallet.publicKey;
        secretKey = wallet.secretKey;

        // ✅ Skip Horizon check if this is a newly created & confirmed wallet from this session
        let skipHorizonCheck = false;
        const setupData = sessionStorage.getItem("wallet_setup");
        if (setupData) {
          try {
            const parsed = JSON.parse(setupData);
            if (parsed.mnemonic === cleanedInput) {
              if (!parsed.confirmed) {
                setError("Finish creating your wallet before importing it.");
                setLoading(false);
                return;
              }
              skipHorizonCheck = true;
            }
          } catch (e) {
            console.error("Failed to parse wallet_setup:", e);
          }
        }

        // ✅ Verify account exists on Stellar network (Horizon check) - Skip if it's a new verified setup
        if (!skipHorizonCheck) {
          try {
            const horizonUrl = network === "public" 
              ? "https://horizon.stellar.org" 
              : "https://horizon-testnet.stellar.org";
            
            const response = await fetch(`${horizonUrl}/accounts/${publicKey}`);
            
            if (response.status === 404) {
              setError(`Wallet not found on ${network}. Ensure the account is funded with at least 1 XLM.`);
              setLoading(false);
              return;
            }

            if (!response.ok) {
              throw new Error("Network verification failed. Please try again.");
            }
          } catch (err) {
            if (err.message.includes("Wallet not found")) throw err;
            console.error("Horizon check error:", err);
          }
        }
      } else {
        // ✅ Secret key path
        if (!cleanedInput.startsWith("S") || cleanedInput.length < 56) {
          setError("Invalid secret key. Should start with 'S' and be 56+ characters.");
          return;
        }

        try {
          const pair = Keypair.fromSecret(cleanedInput);
          publicKey = pair.publicKey();
          secretKey = cleanedInput;
        } catch {
          setError("Invalid Stellar secret key format.");
          return;
        }
      }

      if (isMnemonic) {
        const newWallet = {
          id: uuidv4(),
          address: publicKey,
          mnemonic: cleanedInput,
          secretKey,
          walletType: "INTERNAL",
          isImported: true,
          confirmed: false,
        };

        sessionStorage.setItem("wallet_setup", JSON.stringify(newWallet));
        navigate("/confirm-phrase", { replace: true });
        return;
      }

      // ✅ Check if wallet already exists in localStorage
      const existingWallet = findWalletByAddress(publicKey);

      if (existingWallet) {
        // ✅ CASE 1: Wallet exists → switch to it, go to unlock
        dispatch(setActiveWallet(existingWallet.id));
        navigate("/unlock-wallet", { replace: true });
        return;
      }

      // ✅ CASE 2: New wallet → store temp data in memory, go to SetPIN
      const newWallet = {
        id: uuidv4(),
        address: publicKey,
        mnemonic: null,
        secretKey: secretKey,
        walletType: "INTERNAL",
        isImported: true,
        confirmed: true
      };

      sessionStorage.setItem("wallet_setup", JSON.stringify(newWallet));
      navigate("/set-pin", { replace: true });
    } catch (err) {
      setError(err.message || "Import failed. Check your input.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] text-white p-6">
      <div className="absolute top-6 left-6">
        <BackButton />
      </div>

      <div className="w-full max-w-lg bg-[#1e2329] border border-[#2b3139] rounded-[3rem] p-10 shadow-2xl">
        <div className="space-y-8">
          <div className="text-center">
            <div className="bg-purple-500/10 p-6 rounded-[2rem] mb-6 inline-block">
              <Download className="text-purple-400" size={42} />
            </div>

            <h2 className="text-3xl font-black mb-3">Import Wallet</h2>

            <p className="text-gray-400">
              Paste your 12/24-word recovery phrase or Stellar secret key
            </p>
          </div>

          <textarea
            placeholder="word1 word2 word3 ... or S..."
            className="w-full p-5 bg-black border border-gray-800 rounded-2xl text-sm font-mono outline-none focus:border-cyan-500/50 transition-all resize-none"
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && resolvedPath.pathname === "/import-wallet") { // Ensure handler is scoped to this page
                e.preventDefault();
                handleImport();
              }
            }}
          />

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={loading || !input.trim()}
            className="w-full bg-white text-black p-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-all"
          >
            {loading ? "Processing..." : "Import Wallet"}
          </button>
        </div>
      </div>
    </div>
  );
}
