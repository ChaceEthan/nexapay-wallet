import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { connectWallet, addWallet, clearWallet, setActiveWallet } from "@/walletSlice";
import { setHasWallet, updateLastActivity, setUnlocked, lockWallet } from "../authSlice.js";
import { connectFreighterWallet } from "@/utils/freighterUtils";
import { v4 as uuidv4 } from "uuid";

export default function useWallet() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const address = useSelector((s) => s.wallet.address);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const connectFreighter = async () => {
    try {
      setLoading(true);
      setError("");

      // ✅ Use proper Freighter utilities with correct detection
      const publicKey = await connectFreighterWallet();

      if (!publicKey) {
        throw new Error("Failed to get public key from Freighter");
      }

      // Check if this Freighter wallet already exists in our list
      const wallets = JSON.parse(localStorage.getItem("nexa_wallets") || "[]");
      const existingFreighterWallet = wallets.find(w => w.address === publicKey && w.walletType === "FREIGHTER");

      let walletId;
      if (existingFreighterWallet) {
        walletId = existingFreighterWallet.id;
      } else {
        walletId = uuidv4();
        const walletMeta = {
          id: walletId,
          name: `Freighter Wallet`,
          address: publicKey,
          walletType: "FREIGHTER",
          createdAt: Date.now()
        };
        // Just dispatch addWallet; it handles localStorage sync internally
        dispatch(addWallet(walletMeta)); 
      }

      dispatch(setActiveWallet(walletId)); 
      dispatch(setUnlocked(true));

      dispatch(updateLastActivity());

      // connectWallet is primarily for setting the active address in Redux,
      // but the multi-wallet system now manages the list.
      dispatch(connectWallet({ address: publicKey, walletType: "FREIGHTER" }));

      // STEP 5: Navigate to dashboard
      navigate("/dashboard");

      return publicKey;

    } catch (err) {
      setError(err.message || "Failed to connect Freighter wallet");
      console.error("Freighter connection error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    dispatch(setActiveWallet(null));
    dispatch(lockWallet());
    navigate("/select-wallet");
  };

  return {
    address,
    connectWallet: connectFreighter,
    disconnectWallet,
    loading,
    error,
  };
}