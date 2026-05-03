/**
 * vaultStatus.js
 * Single source of truth for the Hybrid PIN multi-wallet architecture.
 */

export const getVaultStatus = () => {
  const wallets = JSON.parse(localStorage.getItem("nexa_wallets") || "[]");
  const hasMaster = !!localStorage.getItem("nexa_master_pin_hash");
  
  // STABILITY FIX: Detect corruption vs empty state
  let exists = false;
  try {
    const raw = localStorage.getItem("nexa_wallets");
    exists = raw && JSON.parse(raw).length > 0;
  } catch (e) {
    console.error("Vault Registry Corrupted");
  }
  
  const isLocked = localStorage.getItem("nexa_wallet_locked") !== "false";
  const isAppLocked = localStorage.getItem("nexa_app_locked") !== "false";
  
  return {
    exists,
    hasMaster,
    isLocked,
    isAppLocked,
    wallets
  };
};

export const setVaultLocked = (locked) => {
  localStorage.setItem("nexa_wallet_locked", locked ? "true" : "false");
};

export const setAppLocked = (locked) => {
  localStorage.setItem("nexa_app_locked", locked ? "true" : "false");
};

/**
 * Verifies if a specific wallet has its encrypted secrets present.
 */
export const verifyWalletVault = (walletId) => {
  if (!walletId) return false;
  const hasEnc = !!localStorage.getItem(`nexa_wallet_enc_${walletId}`);
  const hasPin = !!localStorage.getItem(`nexa_pin_hash_${walletId}`);
  return hasEnc && hasPin;
};
