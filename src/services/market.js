import { getMarketData, getXlmMarketData, safeArray, safePrice } from "./api";

const CACHE_KEY = "nexa_market_backup";

const cacheMarketData = (data) => {
  if (typeof window === "undefined" || !data?.xlm) return;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Cache writes are best-effort only.
  }
};

const getCachedMarketData = () => {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

export const getMarketPrices = async () => {
  try {
    const data = await getMarketData();
    const xlm = await getXlmMarketData();
    const market = {
      ...data,
      xlm: {
        ...data.xlm,
        ...xlm,
      },
    };

    cacheMarketData(market);
    return market;
  } catch (error) {
    console.warn("Market fallback from cache:", error.message);
    return getCachedMarketData();
  }
};

export const getPriceHistory = async () => {
  const data = await getMarketData();
  const fallbackPrice = safePrice(data?.xlm?.price, 0.165);

  return safeArray(data?.history).map((point, index) => {
    if (typeof point === "number" || typeof point === "string") {
      return {
        time: index,
        price: safePrice(point, fallbackPrice),
      };
    }

    return {
      time: point?.time ?? point?.timestamp ?? index,
      price: safePrice(point?.price ?? point?.value ?? point?.close, fallbackPrice),
    };
  });
};
