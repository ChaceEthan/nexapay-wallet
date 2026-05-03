import CryptoJS from "crypto-js";

/**
 * Primitives for salted AES encryption/decryption.
 * Format: "v2:salt:ciphertext"
 * PBKDF2 iterations: 100,000
 */

export const encrypt = (text, pin) => {
  if (!text) return "";
  try {
    // Generate a 128-bit random salt
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();

    // Derive a 256-bit key using PBKDF2 (matching secureVault standards)
    const key = CryptoJS.PBKDF2(pin, salt, {
      keySize: 256 / 32,
      iterations: 100000
    }).toString();

    const ciphertext = CryptoJS.AES.encrypt(text, key).toString();
    return `v2:${salt}:${ciphertext}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to secure sensitive data.");
  }
};

export const decrypt = (encryptedPayload, pin) => {
  if (!encryptedPayload || !pin) return null;

  try {
    if (encryptedPayload.startsWith("v2:")) {
      const parts = encryptedPayload.split(":");
      const salt = parts[1];
      const ciphertext = parts[2];

      const key = CryptoJS.PBKDF2(pin, salt, {
        keySize: 256 / 32,
        iterations: 100000
      }).toString();

      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const plaintext = bytes.toString(CryptoJS.enc.Utf8);
      return plaintext || null;
    } else {
      // Legacy V1 decryption (safe backward compatibility)
      const bytes = CryptoJS.AES.decrypt(encryptedPayload, pin);
      return bytes.toString(CryptoJS.enc.Utf8) || null;
    }
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};