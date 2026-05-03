import CryptoJS from "crypto-js";

// ================= ENCRYPT =================
export const encrypt = (data, password) => {
  if (!data || !password) return null;

  try {
    return CryptoJS.AES.encrypt(data, password).toString();
  } catch (err) {
    console.error("Encryption failed:", err);
    return null;
  }
};

// ================= DECRYPT =================
export const decrypt = (ciphertext, password) => {
  if (!ciphertext || !password) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const result = bytes.toString(CryptoJS.enc.Utf8);

    return result || null;
  } catch (err) {
    console.error("Decryption failed:", err);
    return null;
  }
};