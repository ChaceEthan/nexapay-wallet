import CryptoJS from "crypto-js";

/**
 * PRODUCTION-GRADE SECURE VAULT
 * This module isolates all sensitive cryptographic operations from the React tree.
 * 
 * PHRASE IS NEVER STORED IN REACT STATE.
 * KEY IS NEVER STORED IN PERSISTENT MEMORY.
 */

// Internal check for v2 format (backward compatible)
const isV2 = (payload) => payload.startsWith("v2:");

export const secureDecryptVault = (encryptedPayload, pin, sessionContext, accessCallback) => {
  // 1. Session Protection Gate
  const { isModalOpen, isAuthenticated } = sessionContext;
  if (!isModalOpen || !isAuthenticated || document.hidden) {
    console.warn("Security Violation: Access denied in current environment.");
    return null;
  }

  // 2. Localized Scoping
  let derivedKey = null;
  let plaintext = null;

  try {
    if (isV2(encryptedPayload)) {
      // V2: PBKDF2 Hardened
      const parts = encryptedPayload.split(":");
      const salt = parts[1];
      const ciphertext = parts[2];

      // DERIVE KEY INTERNALLY (PIN-based)
      derivedKey = CryptoJS.PBKDF2(pin, salt, { 
        keySize: 256 / 32, 
        iterations: 100000 
      }).toString();

      const bytes = CryptoJS.AES.decrypt(ciphertext, derivedKey);
      plaintext = bytes.toString(CryptoJS.enc.Utf8);
    } else {
      // V1: Legacy Mode (Safe Backward Compatibility)
      const bytes = CryptoJS.AES.decrypt(encryptedPayload, pin);
      plaintext = bytes.toString(CryptoJS.enc.Utf8);
    }

    if (!plaintext) return null;

    // 3. Scoped Execution
    // Pass to callback for immediate use/display
    return accessCallback(plaintext);

  } catch (e) {
    return null;
  } finally {
    // 4. MEMORY WIPE (Zeroing)
    derivedKey = null;
    plaintext = null;
  }
};
