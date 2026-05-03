/**
 * Freighter Utilities
 * Proper wrapper around @stellar/freighter-api with correct detection and error handling
 */

import {
  isConnected,
  requestAccess,
  getPublicKey,
  signMessage,
} from "@stellar/freighter-api";

/**
 * Detect if Freighter extension is installed and available
 * Uses the official Freighter API, not window injection
 */
export const isFreighterAvailable = async () => {
  try {
    return await isConnected();
  } catch (error) {
    console.error("🚨 Freighter detection error:", error);
    return false;
  }
};

/**
 * Request access to Freighter wallet
 * Shows a popup in the browser for user permission
 */
export const requestFreighterAccess = async () => {
  try {
    await requestAccess();
    return true;
  } catch (error) {
    console.error("🚨 Freighter access request failed:", error);
    throw new Error("User rejected Freighter access or extension not available");
  }
};

/**
 * Get the public key from Freighter wallet
 * Must call requestFreighterAccess first
 */
export const getFreighterPublicKey = async () => {
  try {
    const publicKey = await getPublicKey();

    if (!publicKey) {
      throw new Error("Failed to retrieve public key from Freighter");
    }

    return publicKey;
  } catch (error) {
    console.error("🚨 Failed to get Freighter public key:", error);
    throw error;
  }
};

/**
 * Sign a message using Freighter wallet
 * Used for wallet ownership verification
 */
export const signFreighterMessage = async (message) => {
  try {
    if (!message) {
      throw new Error("Message is required for signing");
    }

    // signMessage expects a string message and returns the signature
    const signature = await signMessage(message);

    if (!signature) {
      throw new Error("Failed to sign message - no signature returned");
    }

    return signature;
  } catch (error) {
    console.error("🚨 Freighter message signing failed:", error);
    throw error;
  }
};

/**
 * Complete Freighter connection flow
 * 1. Check if available
 * 2. Request access
 * 3. Get public key
 */
export const connectFreighterWallet = async () => {
  try {
    // Step 1: Check if Freighter is available
    const available = await isFreighterAvailable();
    if (!available) {
      throw new Error(
        "Freighter extension not detected. Please install it from: https://www.freighter.app"
      );
    }

    // Step 2: Request user permission
    await requestFreighterAccess();

    // Step 3: Get public key
    const publicKey = await getFreighterPublicKey();

    return publicKey;
  } catch (error) {
    console.error("🚨 Freighter connection failed:", error);
    throw error;
  }
};

export default {
  isFreighterAvailable,
  requestFreighterAccess,
  getFreighterPublicKey,
  signFreighterMessage,
  connectFreighterWallet,
};
