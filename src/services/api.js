import axios from "axios";

const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || "";
export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = localStorage.getItem("nexapayToken");
  if (token && !config.headers?.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const safeNumber = (value, fallback = 0) => {
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : fallback;
};

export const safePrice = (value, fallback) => {
  const num = safeNumber(value, fallback);
  return num > 0 ? num : fallback;
};

export const safeArray = (value) => (Array.isArray(value) ? value : []);

export const backendPath = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath.startsWith("/api/") ? normalizedPath : `/api${normalizedPath}`;
};

const CACHE_KEY = "nexa_market_cache";
const BACKUP_KEY = "nexa_market_backup";
const MARKET_TTL = 30000;
const ASSET_ICON = "/nexapay-32.png";
const DEFAULT_XLM_PRICE = 0.165;
const BLOCKED_IMAGE_HOSTS = ["coin" + "gecko"];

const DEFAULT_PRICES = {
  XLM: DEFAULT_XLM_PRICE,
  USDC: 1,
  USDT: 1,
  XLM_CHANGE: 0,
  USDC_CHANGE: 0,
  USDT_CHANGE: 0,
};

const fallbackPriceFor = (symbol) => {
  const key = String(symbol || "").toUpperCase();
  return DEFAULT_PRICES[key] || 0.0001;
};

const buildDefaultHistory = (price = DEFAULT_XLM_PRICE) =>
  Array.from({ length: 24 }, (_, index) => ({
    time: index,
    price,
  }));

const DEFAULT_MARKETS = [
  {
    id: "stellar",
    symbol: "xlm",
    name: "Stellar Lumens",
    current_price: DEFAULT_XLM_PRICE,
    price_change_percentage_24h: 0,
    total_volume: 1,
    image: ASSET_ICON,
  },
  {
    id: "usdc",
    symbol: "usdc",
    name: "USD Coin",
    current_price: 1,
    price_change_percentage_24h: 0,
    total_volume: 1,
    image: ASSET_ICON,
  },
  {
    id: "usdt",
    symbol: "usdt",
    name: "Tether USD",
    current_price: 1,
    price_change_percentage_24h: 0,
    total_volume: 1,
    image: ASSET_ICON,
  },
];

let marketCache = {
  prices: { ...DEFAULT_PRICES },
  history: buildDefaultHistory(),
  fullList: DEFAULT_MARKETS,
  timestamp: 0,
  isLive: false,
};

const pick = (source, keys, fallback = undefined) => {
  if (!source || typeof source !== "object") return fallback;

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }

  const entries = Object.entries(source);
  for (const key of keys) {
    const found = entries.find(([entryKey]) => entryKey.toLowerCase() === String(key).toLowerCase());
    if (found && found[1] !== undefined && found[1] !== null) return found[1];
  }

  return fallback;
};

const sanitizeImage = (value) => {
  const image = String(value || "");
  if (!image || BLOCKED_IMAGE_HOSTS.some((host) => image.toLowerCase().includes(host))) return ASSET_ICON;
  return image;
};

export const normalizeMarketData = (item, index = 0) => {
  if (!item || typeof item !== "object") return null;

  const symbol = String(pick(item, ["symbol", "asset", "code"], "asset")).toLowerCase();
  const fallback = fallbackPriceFor(symbol);
  const price = safePrice(
    pick(item, ["current_price", "price", "usd", "last", "value"], fallback),
    fallback
  );

  return {
    id: String(pick(item, ["id"], symbol || `asset-${index}`)),
    symbol,
    name: String(pick(item, ["name", "assetName"], symbol.toUpperCase())),
    current_price: price,
    price_change_percentage_24h: safeNumber(
      pick(item, ["price_change_percentage_24h", "change", "change24h", "percentChange"], 0),
      0
    ),
    total_volume: safePrice(pick(item, ["total_volume", "volume", "volume24h"], 1), 1),
    image: sanitizeImage(pick(item, ["image", "thumb", "icon"], ASSET_ICON)),
  };
};

const normalizeHistory = (value, fallbackHistory, fallbackPrice) => {
  const mapped = safeArray(value)
    .map((point, index) => {
      if (typeof point === "number" || typeof point === "string") {
        return { time: index, price: safePrice(point, fallbackPrice) };
      }

      if (!point || typeof point !== "object") return null;

      return {
        ...point,
        time: pick(point, ["time", "timestamp", "date"], index),
        price: safePrice(pick(point, ["price", "value", "close"], fallbackPrice), fallbackPrice),
      };
    })
    .filter(Boolean);

  if (mapped.length > 0) return mapped;
  if (safeArray(fallbackHistory).length > 0) return fallbackHistory;
  return buildDefaultHistory(fallbackPrice);
};

const normalizePriceMap = (data, previous = DEFAULT_PRICES) => {
  const prices = data?.prices || data?.data?.prices || {};
  const xlm = data?.xlm || data?.XLM || data?.stellar || {};
  const usdc = data?.usdc || data?.USDC || {};
  const usdt = data?.usdt || data?.USDT || {};

  return {
    XLM: safePrice(
      pick(prices, ["XLM", "xlm"], pick(xlm, ["price", "current_price", "usd"], data?.price)),
      safePrice(previous.XLM, DEFAULT_XLM_PRICE)
    ),
    USDC: safePrice(
      pick(prices, ["USDC", "usdc"], pick(usdc, ["price", "current_price", "usd"], previous.USDC)),
      safePrice(previous.USDC, 1)
    ),
    USDT: safePrice(
      pick(prices, ["USDT", "usdt"], pick(usdt, ["price", "current_price", "usd"], previous.USDT)),
      safePrice(previous.USDT, 1)
    ),
    XLM_CHANGE: safeNumber(
      pick(prices, ["XLM_CHANGE", "xlm_change"], pick(xlm, ["change", "price_change_percentage_24h"], data?.change)),
      safeNumber(previous.XLM_CHANGE, 0)
    ),
    USDC_CHANGE: safeNumber(
      pick(prices, ["USDC_CHANGE", "usdc_change"], pick(usdc, ["change", "price_change_percentage_24h"], previous.USDC_CHANGE)),
      safeNumber(previous.USDC_CHANGE, 0)
    ),
    USDT_CHANGE: safeNumber(
      pick(prices, ["USDT_CHANGE", "usdt_change"], pick(usdt, ["change", "price_change_percentage_24h"], previous.USDT_CHANGE)),
      safeNumber(previous.USDT_CHANGE, 0)
    ),
  };
};

const listFromPrices = (prices) =>
  ["XLM", "USDC", "USDT"].map((symbol, index) =>
    normalizeMarketData(
      {
        id: symbol.toLowerCase(),
        symbol,
        name: symbol === "XLM" ? "Stellar Lumens" : symbol,
        current_price: prices[symbol],
        price_change_percentage_24h: prices[`${symbol}_CHANGE`],
        total_volume: 1,
        image: ASSET_ICON,
      },
      index
    )
  );

const normalizeMarketPayload = (payload, live) => {
  const data = payload?.data && !Array.isArray(payload?.data) ? payload.data : payload;
  const previous = marketCache;
  const prices = normalizePriceMap(data, previous.prices);
  const listSource = Array.isArray(data)
    ? data
    : data?.markets || data?.assets || data?.coins || data?.list || data?.fullList || [];
  const fullList = safeArray(listSource).map(normalizeMarketData).filter(Boolean);
  const history = normalizeHistory(data?.history || data?.pricesHistory || data?.sparkline, previous.history, prices.XLM);

  return {
    prices,
    history,
    fullList: fullList.length > 0 ? fullList : listFromPrices(prices),
    timestamp: Date.now(),
    isLive: live,
  };
};

const persistMarketCache = () => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(marketCache));
    localStorage.setItem(BACKUP_KEY, JSON.stringify(formatMarketData(marketCache)));
  } catch {
    // Storage is best-effort; memory cache still protects the UI.
  }
};

const hydrateMarketCache = () => {
  if (typeof window === "undefined") return;

  for (const key of [CACHE_KEY, BACKUP_KEY]) {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) continue;

      const parsed = JSON.parse(saved);
      if (parsed?.xlm) {
        marketCache = normalizeMarketPayload(
          {
            prices: {
              XLM: parsed.xlm.price,
              XLM_CHANGE: parsed.xlm.change,
              USDC: parsed.usdc?.price,
              USDC_CHANGE: parsed.usdc?.change,
              USDT: parsed.usdt?.price,
              USDT_CHANGE: parsed.usdt?.change,
            },
            history: parsed.history,
          },
          false
        );
      } else {
        marketCache = normalizeMarketPayload(parsed, false);
      }
      return;
    } catch {
      // Try the next cache key.
    }
  }
};

hydrateMarketCache();

const getCachedMarket = () => ({
  ...marketCache,
  prices: normalizePriceMap({ prices: marketCache.prices }, DEFAULT_PRICES),
  history: normalizeHistory(marketCache.history, buildDefaultHistory(), marketCache.prices.XLM),
  fullList: safeArray(marketCache.fullList).length > 0 ? marketCache.fullList : listFromPrices(marketCache.prices),
  isLive: false,
});

const formatMarketData = (data) => {
  const prices = normalizePriceMap({ prices: data?.prices }, DEFAULT_PRICES);

  return {
    xlm: {
      price: safePrice(prices.XLM, DEFAULT_XLM_PRICE),
      change: safeNumber(prices.XLM_CHANGE, 0),
    },
    usdc: {
      price: safePrice(prices.USDC, 1),
      change: safeNumber(prices.USDC_CHANGE, 0),
    },
    usdt: {
      price: safePrice(prices.USDT, 1),
      change: safeNumber(prices.USDT_CHANGE, 0),
    },
    history: normalizeHistory(data?.history, buildDefaultHistory(prices.XLM), prices.XLM),
    isLive: !!data?.isLive,
  };
};

const fetchMarket = async (force = false) => {
  const isFresh = Date.now() - marketCache.timestamp < MARKET_TTL;
  if (!force && isFresh) return marketCache;

  try {
    const response = await api.get(backendPath("/api/market"));
    marketCache = normalizeMarketPayload(response.data, true);
    persistMarketCache();
    return marketCache;
  } catch (error) {
    console.warn("Market API unavailable; using cached market data.", error.message);
    marketCache = getCachedMarket();
    return marketCache;
  }
};

export const getMarketData = async (options = {}) => {
  const data = await fetchMarket(Boolean(options.force));
  return formatMarketData(data);
};

export const getXlmMarketData = async () => {
  try {
    const response = await api.get(backendPath("/api/market/xlm"));
    const prices = normalizePriceMap(response.data, marketCache.prices);

    marketCache = {
      ...marketCache,
      prices: {
        ...marketCache.prices,
        XLM: prices.XLM,
        XLM_CHANGE: prices.XLM_CHANGE,
      },
      timestamp: Date.now(),
      isLive: true,
    };
    persistMarketCache();

    return {
      price: safePrice(marketCache.prices.XLM, DEFAULT_XLM_PRICE),
      change: safeNumber(marketCache.prices.XLM_CHANGE, 0),
      isLive: true,
    };
  } catch (error) {
    console.warn("XLM market API unavailable; using cached XLM price.", error.message);
    const cached = getCachedMarket();
    return {
      price: safePrice(cached.prices.XLM, DEFAULT_XLM_PRICE),
      change: safeNumber(cached.prices.XLM_CHANGE, 0),
      isLive: false,
    };
  }
};

export const getFullMarketList = async (options = {}) => {
  const data = await fetchMarket(Boolean(options.force));
  return safeArray(data.fullList).map(normalizeMarketData).filter(Boolean);
};

export const updateMarketCacheFromSocket = (payload) => {
  const live = normalizeMarketPayload(
    {
      ...payload,
      prices: {
        ...marketCache.prices,
        XLM: pick(payload, ["price", "current_price"], payload?.xlm?.price),
        XLM_CHANGE: pick(payload, ["change", "price_change_percentage_24h"], payload?.xlm?.change),
      },
    },
    true
  );

  marketCache = {
    ...marketCache,
    ...live,
    fullList: safeArray(marketCache.fullList).length > 0 ? marketCache.fullList : live.fullList,
  };
  persistMarketCache();

  const currentPrice = safePrice(marketCache.prices.XLM, DEFAULT_XLM_PRICE);
  return {
    price: currentPrice,
    change: safeNumber(marketCache.prices.XLM_CHANGE, 0),
    trend: payload?.trend || "SIDEWAYS",
    timestamp: payload?.timestamp || payload?.time || Date.now(),
  };
};

export const parseQrPayload = async (rawValue) => {
  const raw = String(rawValue || "").trim();
  if (!raw) throw new Error("Empty QR code.");

  const response = await api.post(backendPath("/api/qr/parse"), {
    raw,
    qr: raw,
    payload: raw,
  });

  const data = response.data?.data || response.data || {};
  const address = pick(data, ["address", "recipient", "destination", "publicKey", "account"]);

  if (!address) throw new Error(data?.message || "Invalid QR code.");

  return {
    address: String(address).trim(),
    amount: data.amount !== undefined && data.amount !== null ? String(data.amount) : "",
    memo: data.memo !== undefined && data.memo !== null ? String(data.memo) : "",
    assetCode: String(pick(data, ["assetCode", "asset", "code"], "XLM")).toUpperCase(),
    assetIssuer: pick(data, ["assetIssuer", "issuer"], null),
    raw,
  };
};

export const sendBackendTransaction = async (paymentData) => {
  const response = await api.post(backendPath("/api/transactions/send"), paymentData);
  return response.data;
};

export default api;
