/**
 * Centralized Storage Utility
 * Separates temporary session data from persistent wallet data.
 */

// 1. SESSION KEYS: Cleared on Logout/Session Timeout
const SESSION_KEYS = [
  "wallet_setup"
];

// 2. PERSISTENT WALLET KEYS: Only cleared on Disconnect/Create New
const PERSISTENT_WALLET_KEYS = [
  "nexa_wallet_pub",
  "nexa_wallet_type",
  "nexa_wallet_enc",
  "nexa_mnemonic_enc",
  "nexa_wallets",
  "nexa_active_wallet",
  "nexa_has_pin"
];

/**
 * Clears only session-related data.
 * The wallet remains encrypted on the device.
 */
export const clearSession = () => {
  try {
    SESSION_KEYS.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
  } catch (err) {
    console.error("Session cleanup failed:", err);
  }
};

/**
 * Clears only wallet-related data.
 */
export const clearWalletStorage = () => {
  try {
    PERSISTENT_WALLET_KEYS.forEach(key => localStorage.removeItem(key));
  } catch (err) {
    console.error("Wallet storage cleanup failed:", err);
  }
};

/**
 * Full cleanup (Session + Wallet).
 */
export const clearAllNexaData = () => {
  clearSession();
  clearWalletStorage();
};

// Backward compatibility (deprecated)
export const clearAppStorage = clearAllNexaData;
