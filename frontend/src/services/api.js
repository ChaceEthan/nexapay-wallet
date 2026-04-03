import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://nexapay-wallet.onrender.com",
});

export const getAccountDetails = async (address) => {
  const res = await API.get(`/account/${address}`);
  return res.data;
};

export const getTransactionHistory = async (address) => {
  const res = await API.get(`/account/${address}/history`);
  return res.data;
};

export const fundAccount = async (address) => {
  const res = await API.post(`/account/fund`, { address });
  return res.data;
};

export const submitTransaction = async (xdr) => {
  const res = await API.post("/transactions/submit", { xdr });
  return res.data;
};