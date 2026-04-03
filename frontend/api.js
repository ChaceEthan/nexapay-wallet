import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://nexapay-wallet.onrender.com";

const api = axios.create({
  baseURL: API_URL,
});

export const getAccountDetails = async (address) => {
  const res = await api.get(`/account/${address}`);
  return res.data;
};

export const getTransactionHistory = async (address) => {
  const res = await api.get(`/account/${address}/history`);
  return res.data;
};

export const fundAccount = async (address) => {
  const res = await api.post(`/account/fund`, { address });
  return res.data;
};

export const submitTransaction = async (xdr) => {
  const res = await api.post(`/transactions/submit`, { xdr });
  return res.data;
};

export default api;