import axios from "axios";

export const getAccountDetails = async (address) => {
  const res = await axios.get(`https://horizon-testnet.stellar.org/accounts/${address}`);
  return res.data;
};

export const getTransactionHistory = async (address) => {
  const res = await axios.get(`https://horizon-testnet.stellar.org/accounts/${address}/transactions?limit=10&order=desc`);
  return res.data._embedded.records;
};

export const fundAccount = async (address) => {
  return axios.get(`https://friendbot.stellar.org?addr=${address}`);
};

export const submitTransaction = async (xdr) => {
  const params = new URLSearchParams();
  params.append("tx", xdr);
  const res = await axios.post(`https://horizon-testnet.stellar.org/transactions`, params);
  return res.data;
};