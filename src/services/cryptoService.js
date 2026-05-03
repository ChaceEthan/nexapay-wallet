import {
  getFullMarketList,
  getMarketData,
  getXlmMarketData,
  safeArray,
} from "./api";

export const getStellarPrices = async () => {
  const xlm = await getXlmMarketData();
  return xlm.price;
};

export const getAllPrices = async () => {
  const data = await getMarketData();
  return {
    XLM: data.xlm.price,
    USDC: data.usdc.price,
    USDT: data.usdt.price,
  };
};

export const getMarketList = async () => getFullMarketList();

export const getStellarPriceHistory = async () => {
  const data = await getMarketData();
  return safeArray(data.history);
};
