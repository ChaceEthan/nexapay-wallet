import { useEffect, useRef, useState, useCallback } from "react";
import { safeNumber, safePrice, updateMarketCacheFromSocket } from "../services/api";

const MARKET_SOCKET_URL = "ws://localhost:3000/ws/market";
const UPDATE_THROTTLE = 1000;
const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 15000;

const readSocketPayload = (eventData) => {
  const parsed = typeof eventData === "string" ? JSON.parse(eventData) : eventData;
  const data = parsed?.data || parsed;
  const prices = data?.prices || {};
  const xlm = data?.xlm || data?.XLM || {};

  return {
    price: data?.price ?? data?.current_price ?? prices.XLM ?? prices.xlm ?? xlm.price ?? xlm.current_price,
    change:
      data?.change ??
      data?.price_change_percentage_24h ??
      prices.XLM_CHANGE ??
      prices.xlm_change ??
      xlm.change ??
      xlm.price_change_percentage_24h,
    trend: data?.trend,
    timestamp: data?.timestamp ?? data?.time ?? data?.updatedAt ?? Date.now(),
  };
};

export default function useMarketSocket(onPriceUpdate) {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(onPriceUpdate);
  const lastUpdateRef = useRef(0);
  const prevPriceRef = useRef(0.165);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = onPriceUpdate;
  }, [onPriceUpdate]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined" || !mountedRef.current) return;

    clearReconnectTimer();

    const existing = window.__nexaSocket;
    if (existing && existing.readyState <= WebSocket.OPEN) {
      existing.onclose = null;
      existing.onerror = null;
      existing.onmessage = null;
      existing.close();
    }

    const socket = new WebSocket(MARKET_SOCKET_URL);
    window.__nexaSocket = socket;

    socket.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const raw = readSocketPayload(event.data);
        const price = safePrice(raw.price, prevPriceRef.current);
        if (!price) return;

        const now = Date.now();
        if (now - lastUpdateRef.current < UPDATE_THROTTLE) return;

        const change = safeNumber(raw.change, 0);
        const trend =
          raw.trend ||
          (price > prevPriceRef.current ? "UP" : price < prevPriceRef.current ? "DOWN" : "SIDEWAYS");
        const live = updateMarketCacheFromSocket({
          price,
          change,
          trend,
          timestamp: raw.timestamp,
        });

        prevPriceRef.current = price;
        lastUpdateRef.current = now;

        if (typeof callbackRef.current === "function") {
          callbackRef.current({ ...live, trend });
        }
      } catch {
        // Ignore malformed socket frames; reconnect is handled by close/error.
      }
    };

    const scheduleReconnect = () => {
      if (!mountedRef.current || window.__nexaSocket_cleanup) return;

      const attempt = reconnectAttemptsRef.current + 1;
      reconnectAttemptsRef.current = attempt;
      const delay = Math.min(RECONNECT_BASE_DELAY * 2 ** (attempt - 1), RECONNECT_MAX_DELAY);

      clearReconnectTimer();
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    socket.onerror = () => {
      setIsConnected(false);
      socket.close();
    };

    socket.onclose = () => {
      setIsConnected(false);
      if (window.__nexaSocket === socket) window.__nexaSocket = null;
      scheduleReconnect();
    };
  }, [clearReconnectTimer]);

  useEffect(() => {
    mountedRef.current = true;
    window.__nexaSocket_cleanup = false;
    window.forceNexaSocketReset = () => {
      clearReconnectTimer();
      if (window.__nexaSocket) {
        window.__nexaSocket.close();
      } else {
        connect();
      }
    };

    connect();

    return () => {
      mountedRef.current = false;
      window.__nexaSocket_cleanup = true;
      clearReconnectTimer();
      if (window.__nexaSocket) {
        window.__nexaSocket.onmessage = null;
        window.__nexaSocket.onerror = null;
        window.__nexaSocket.onclose = null;
        window.__nexaSocket.close();
        window.__nexaSocket = null;
      }
      window.forceNexaSocketReset = null;
    };
  }, [clearReconnectTimer, connect]);

  return { isConnected };
}
