/**
 * WebAuthn Utility for Biometric Authentication
 */

const bufferToBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const base64ToBuffer = (base64) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

export const isWebAuthnSupported = () => !!(window.PublicKeyCredential && navigator.credentials);

/**
 * Registration: To be called during PIN setup to link biometrics.
 */
export const registerBiometric = async (username = "NexaPay User") => {
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const userID = new Uint8Array(16);
  window.crypto.getRandomValues(userID);

  const publicKeyOptions = {
    challenge,
    rp: { name: "NexaPay Wallet", id: window.location.hostname },
    user: {
      id: userID,
      name: username,
      displayName: username,
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
    authenticatorSelection: { userVerification: "required" },
    timeout: 60000,
  };

  const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
  const credentialId = bufferToBase64(credential.rawId);
  
  // Store the Credential ID to use it during the 'get' (authentication) phase
  localStorage.setItem("nexa_biometric_id", credentialId);
  return credentialId;
};

/**
 * Authentication: Called on the LockScreen.
 */
export const authenticateBiometric = async () => {
  const credentialIdBase64 = localStorage.getItem("nexa_biometric_id");
  if (!credentialIdBase64) throw new Error("Biometrics not enrolled");

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const publicKeyOptions = {
    challenge,
    allowCredentials: [{
      id: base64ToBuffer(credentialIdBase64),
      type: "public-key",
    }],
    userVerification: "required",
    timeout: 60000,
  };

  // This triggers the native FaceID/TouchID/Windows Hello prompt
  const assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });
  
  return !!assertion; // Success indicates user successfully scanned biometrics
};