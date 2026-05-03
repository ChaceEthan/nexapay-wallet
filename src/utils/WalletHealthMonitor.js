import { clearSession, clearWalletStorage } from './storage';

/**
 * WalletHealthMonitor
 * Production-grade audit utility to verify state integrity and storage health.
 */

export const WALLET_KEYS = {
  PUB: "nexa_wallet_pub",
  ENC: "nexa_wallet_enc",
  MNEMONIC_ENC: "nexa_mnemonic_enc",
  HAS_PIN: "nexa_has_pin"
};

/**
 * Verifies if the core wallet data is present and consistent.
 * Returns: VALID, MISSING, or CORRUPTED.
 */
export const verifyWalletIntegrity = () => {
  try {
    const rawWallets = localStorage.getItem("nexa_wallets");
    if (!rawWallets || rawWallets === "[]") {
      return { status: "EMPTY", isHealthy: true, hasMnemonic: false };
    }
    const wallets = JSON.parse(rawWallets);
    if (!Array.isArray(wallets)) throw new Error("Format Mismatch");
    
    return { status: "VALID", isHealthy: true, hasMnemonic: wallets.length > 0 };
  } catch (e) {
    return { status: "CORRUPTED", isHealthy: false, error: e.message };
  }
};

/**
 * Performs a safe, read-only health check.
 * Strictly logging only. NEVER deletes data automatically.
 */
export const performHealthCheck = (dispatch, navigate) => {
  const health = verifyWalletIntegrity();
  
  if (health.status === "CORRUPTED") {
    console.warn("🛡️ Health Monitor: Storage state is INVALID. Manual review required.");
    return "INVALID_FORMAT";
  }

  if (health.status === "VALID") {
    return "VALID";
  }

  return "MISSING";
};

/**
 * Validates session vs disk state
 */
export const validateSessionSync = (reduxAuth, reduxWallet) => {
  // Multi-wallet aware address validation
  let wallets = [];
  try { wallets = JSON.parse(localStorage.getItem("nexa_wallets") || "[]"); } catch (e) { return false; }
  
  // Sync logic must match authSlice hydration fallback
  let selectedId = localStorage.getItem("nexa_selected_wallet") || localStorage.getItem("nexa_active_wallet");
  if (!selectedId && wallets.length > 0) selectedId = wallets[0].id;

  const activeWalletOnDisk = wallets.find(w => w.id === selectedId);
  const expectedAddress = activeWalletOnDisk?.address || null; // If no wallet selected, expected is null
  
  // 2. Address Match: Redux must match the specific wallet selected on disk
  const addressMatches = (reduxWallet.address || null) === expectedAddress;
  
  return addressMatches; // Only check address match, token is removed
};
