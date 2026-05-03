import { signTransaction } from "@stellar/freighter-api";
import { Keypair } from "@stellar/stellar-sdk";

/**
 * resolveActiveWallet
 * Unified resolver to determine the current signing authority.
 * Handles state checks for both Internal (Local) and Freighter wallets.
 */
export const resolveActiveWallet = (state) => {
  const walletState = state.wallet || { wallets: [], activeWalletId: null };
  const authState = state.auth || {};

  const activeWallet = walletState.wallets.find(w => w.id === walletState.activeWalletId);
  
  if (!activeWallet) {
    return { type: "none", isConnected: false, address: null, signer: null };
  }

  // 1. Freighter Wallet Logic
  if (activeWallet.walletType === "FREIGHTER") {
    return {
      type: "freighter",
      isConnected: true,
      address: activeWallet.address,
      signer: async (tx) => {
        try {
          // Freighter API expects XDR string and returns signed XDR string
          const network = authState.network?.toUpperCase() || "TESTNET";
          const result = await signTransaction(tx.toXDR(), { network });
          if (!result) throw new Error("No signature received from Freighter.");
          return result;
        } catch (err) {
          console.error("Freighter signing error:", err);
          if (err.message?.includes("User rejected") || err.message?.includes("declined")) {
            throw new Error("Transaction signing rejected by user.");
          }
          throw new Error(err.message || "An unexpected error occurred while signing with Freighter.");
        }
      }
    };
  }

  // 2. Local Wallet Logic (Internal)
  // Check if PIN is unlocked and master key is available in memory
  const decryptedSecretKey = authState.decryptedSecretKey || walletState.decryptedSecretKey;
  const isUnlocked = authState.isWalletUnlocked !== false; // Default to true if not explicitly locked

  if (activeWallet.walletType === "INTERNAL" && isUnlocked && decryptedSecretKey) {
    return {
      type: "local",
      isConnected: true,
      address: activeWallet.address,
      signer: async (tx) => {
        try {
          const kp = Keypair.fromSecret(decryptedSecretKey);
          tx.sign(kp);
          return tx.toXDR();
        } catch (err) {
          console.error("Local signing error:", err);
          throw new Error("Internal signing failure. Ensure the wallet is properly unlocked.");
        }
      }
    };
  }

  // Fallback: Wallet is selected but not ready (locked or key cleared)
  return { type: "local", isConnected: false, address: activeWallet.address, signer: null };
};