import React, { useState } from "react";
import { X, Lock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setDecryptedSecretKey } from "@/walletSlice";
import CryptoJS from "crypto-js";
import { decrypt } from "@/utils/crypto";

/**
 * UnlockModal - Reusable PIN unlock modal for transactions
 * Shows when user tries to perform action requiring unlocked wallet
 * 
 * @param {Function} onUnlock - Callback when unlock is successful
 * @param {Function} onClose - Callback to close modal
 * @param {string} title - Modal title (default: "Unlock Wallet")
 */
export default function UnlockModal({ onUnlock, onClose, title = "Unlock Wallet" }) {
  const dispatch = useDispatch();
  const { activeWalletId } = useSelector((state) => state.wallet);
  
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN must be 4-6 digits.");
      return;
    }

    setLoading(true);

    try {
      const stored = localStorage.getItem(`nexa_pin_hash_${activeWalletId}`);
      const hashed = CryptoJS.SHA256(pin).toString();

      if (hashed !== stored) {
        setError("Incorrect PIN");
        setLoading(false);
        return;
      }

      // 🔓 DECRYPT SECRET KEY
      const encryptedSecretKey = localStorage.getItem(`nexa_secret_enc_${activeWalletId}`);

      if (encryptedSecretKey) {
        try {
          const decryptedSecretKey = decrypt(encryptedSecretKey, pin);

          if (!decryptedSecretKey) {
            setError("Wallet decryption failed");
            setLoading(false);
            return;
          }

          // Store the decrypted secret key in Redux
          dispatch(setDecryptedSecretKey(decryptedSecretKey));

          // Clear form and call callback
          setPin("");
          if (onUnlock) {
            onUnlock(decryptedSecretKey);
          }
        } catch (decryptErr) {
          console.error("Decryption failed:", decryptErr);
          setError("Failed to decrypt wallet. Incorrect PIN?");
        }
      } else {
        console.warn("⚠️ No encrypted secret key found for wallet:", activeWalletId);
        setError("Wallet data corrupted. Please recover from backup phrase.");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock size={20} className="text-cyan-400" />
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Enter your PIN to continue with this transaction
        </p>

        {/* Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded">
              {error}
            </div>
          )}

          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            type="password"
            placeholder="Enter PIN (4-6 digits)"
            className="w-full bg-black/50 border border-[#2b3139] rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition"
            disabled={loading}
            autoFocus
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black py-2 rounded-lg font-semibold transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Unlocking..." : "Unlock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
