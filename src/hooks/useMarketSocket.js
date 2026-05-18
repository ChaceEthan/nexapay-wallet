import { useEffect, useRef, useState, useCallback } from "react";
import { safeNumber, safePrice, updateMarketCacheFromSocket } from "../services/api";

const UPDATE_THROTTLE = 1000;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const MAX_RECONNECT_ATTEMPTS = 5;

const getMarketSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (typeof window === "undefined") return "";

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/market`;
};

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
  const [status, setStatus] = useState("connecting");
  const callbackRef = useRef(onPriceUpdate);
  const lastUpdateRef = useRef(0);
  const prevPriceRef = useRef(0.165);
  const reconnectTimerRef = useRef(null);
  const mountedRef = useRef(false);
  const retryCountRef = useRef(0);
  const socketRef = useRef(null);

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
      socketRef.current = existing;
      setIsConnected(existing.readyState === WebSocket.OPEN);
      setStatus(existing.readyState === WebSocket.OPEN ? "live" : "connecting");
      return;
    }

    const socketUrl = getMarketSocketUrl();
    if (!socketUrl) {
      setIsConnected(false);
      setStatus("offline");
      return;
    }

    setStatus("connecting");
    let socket;
    try {
      socket = new WebSocket(socketUrl);
    } catch {
      setIsConnected(false);
      setStatus("offline");
      return;
    }
    socketRef.current = socket;
    window.__nexaSocket = socket;

    socket.onopen = () => {
      retryCountRef.current = 0;
      setIsConnected(true);
      setStatus("live");
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

      retryCountRef.current += 1;
      if (retryCountRef.current > MAX_RECONNECT_ATTEMPTS) {
        clearReconnectTimer();
        setIsConnected(false);
        setStatus("offline");
        return;
      }

      const delay = Math.min(
        MAX_RECONNECT_DELAY,
        BASE_RECONNECT_DELAY * 2 ** (retryCountRef.current - 1)
      );

      setStatus("reconnecting");
      clearReconnectTimer();
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    socket.onerror = () => {
      setIsConnected(false);
      setStatus("reconnecting");
      socket.close();
    };

    socket.onclose = () => {
      setIsConnected(false);
      if (window.__nexaSocket === socket) window.__nexaSocket = null;
      if (socketRef.current === socket) socketRef.current = null;
      scheduleReconnect();
    };
  }, [clearReconnectTimer]);

  useEffect(() => {
    mountedRef.current = true;
    window.__nexaSocket_cleanup = false;
    window.forceNexaSocketReset = () => {
      retryCountRef.current = 0;
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
      socketRef.current = null;
      window.forceNexaSocketReset = null;
    };
  }, [clearReconnectTimer, connect]);

  return {
    isConnected,
    status,
    retryDelay: Math.min(
      MAX_RECONNECT_DELAY,
      BASE_RECONNECT_DELAY * 2 ** Math.max(0, retryCountRef.current - 1)
    ),
    retries: retryCountRef.current,
    maxRetries: MAX_RECONNECT_ATTEMPTS,
  };
}
