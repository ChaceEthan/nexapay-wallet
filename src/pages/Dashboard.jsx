// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import {
  RefreshCcw,
  ArrowUpRight,
  ArrowDownLeft,
  Bell,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

import DashboardCard from "@/components/DashboardCard";
import TransactionForm from "@/components/TransactionForm";
import ReceiveModal from "@/components/ReceiveModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import TransactionHistory from "@/components/TransactionHistory";
import NewsBanner from "@/components/NewsBanner";
import ReferralSection from "@/components/ReferralSection";
import SystemHealthCard from "@/components/SystemHealthCard";
import useMarketSocket from "@/hooks/useMarketSocket";

import {
  fetchWalletData,
  clearScannedRecipient,
  clearRetryTransaction
} from "@/walletSlice";

import { addNotification, selectUnreadCountForActiveWallet } from "@/notificationSlice";
import { showToast } from "@/toastSlice";
import { api, backendPath, getMarketData, safePrice, safeNumber, safeArray } from "@/services/api";

const FALLBACK_XLM_PRICE = 0.165;
const FALLBACK_MARKET_DATA = {
  xlm: { price: FALLBACK_XLM_PRICE, change: 0 },
  usdc: { price: 1, change: 0 },
  usdt: { price: 1, change: 0 },
  history: [],
  isLive: false,
};

/**
 * CustomTooltip - Institutional Grade Chart Feedback
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#181a20]/95 border border-white/10 p-3 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
          Network Quote
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] font-black text-cyan-400">$</span>
          <span className="text-sm font-black text-white tracking-tight">
            {safeNumber(payload[0].value, FALLBACK_XLM_PRICE).toFixed(4)}
          </span>
          <span className="text-[8px] font-black text-gray-600 uppercase ml-1">USD</span>
        </div>
      </div>
    );
  }
  return null;
};

const ChartLoadingState = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
    <div className="w-full max-w-[88%] space-y-3 animate-pulse">
      <div className="h-28 rounded-2xl bg-white/[0.04]" />
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-2 rounded bg-white/[0.06]" />
        ))}
      </div>
    </div>
  </div>
);

const SafeMarketChart = ({ data, status }) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      const next = {
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      };

      setSize((prev) =>
        Math.abs(prev.width - next.width) < 2 && Math.abs(prev.height - next.height) < 2 ? prev : next
      );
    };

    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(node);
    window.addEventListener("resize", measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const chartData = safeArray(data);
  const canRender = size.width > 8 && size.height > 8 && chartData.length > 0;

  return (
    <div ref={containerRef} className="relative w-full h-[220px] sm:h-[260px] min-w-0 overflow-hidden">
      {!canRender ? (
        <ChartLoadingState />
      ) : (
        <AreaChart width={size.width} height={size.height} data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 8 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#22d3ee"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPrice)"
            isAnimationActive={status === "live"}
          />
        </AreaChart>
      )}
    </div>
  );
};

const DegradedModeBanner = ({ marketStatus, wsStatus, lastMarketSync }) => {
  const hasUsableFallback = marketStatus === "cached" && lastMarketSync;
  if ((marketStatus === "live" && wsStatus === "live") || hasUsableFallback) return null;

  const copy =
    marketStatus === "loading"
      ? "Synchronizing market data with cached prices ready."
      : wsStatus === "offline"
        ? "Live stream is unavailable. REST polling is keeping the dashboard updated."
        : "Live services are reconnecting. Cached prices remain available.";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-100">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 text-amber-300 shrink-0" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">Degraded Mode</p>
          <p className="text-xs font-semibold text-amber-100/80">{copy}</p>
        </div>
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-amber-200/70">
        {lastMarketSync ? `Last sync ${lastMarketSync.toLocaleTimeString()}` : "Fallback ready"}
      </div>
    </div>
  );
};

/**
 * Dashboard - Refined Fintech Interface
 * - Professional Header with brand persistence
 * - Stabilized Sidebar (System Health & Referrals)
 * - Optimized Grid Layout & Center-Aligned Modals
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const wallets = useSelector((state) => state.wallet?.wallets || []);
  const activeWalletId = useSelector((state) => state.wallet?.activeWalletId);
  const balances = useSelector((state) => state.wallet?.balances || []);
  const loading = useSelector((state) => state.wallet?.loading);
  const scannedRecipient = useSelector((state) => state.wallet?.scannedRecipient);
  const retryData = useSelector((state) => state.wallet?.retryData);
  const network = useSelector((state) => state.auth?.network) || "testnet";
  
  const unreadCount = useSelector((state) => selectUnreadCountForActiveWallet?.(state) ?? 0);
  const activeWallet = wallets.find((w) => w.id === activeWalletId);

  const [showSendForm, setShowSendForm] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [marketData, setMarketData] = useState(FALLBACK_MARKET_DATA);
  const [priceHistory, setPriceHistory] = useState([]);
  const [marketStatus, setMarketStatus] = useState("loading");
  const [lastMarketSync, setLastMarketSync] = useState(null);
  const [marketTrend, setMarketTrend] = useState("SIDEWAYS");
  const [isHorizonOnline, setIsHorizonOnline] = useState(true);
  const [lastAlertPrice, setLastAlertPrice] = useState(0);

  const nativeBalance = balances.find(b => b.asset_type === 'native')?.balance || "0";
  const usdcBalance = balances.find(b => b.asset_code === 'USDC')?.balance || "0";

  // WebSocket Live Updates
  const { isConnected: wsActive, status: wsStatus } = useMarketSocket((live) => {
    const livePrice = safePrice(live?.price, marketData?.xlm?.price || FALLBACK_XLM_PRICE);
    if (!livePrice) return;

    if (lastAlertPrice > 0) {
      const percentChange = Math.abs(livePrice - lastAlertPrice) / lastAlertPrice;
      if (percentChange >= 0.01) {
        dispatch(addNotification({
          type: livePrice > lastAlertPrice ? "success" : "warning",
          category: "market",
          title: "Market Volatility Alert",
          message: `XLM price moved significantly to $${livePrice.toFixed(4)}.`,
          walletId: activeWalletId,
        }));
        dispatch(showToast({ message: `Significant price movement detected!`, type: "info" }));
        setLastAlertPrice(livePrice);
      }
    } else {
      setLastAlertPrice(livePrice);
    }

    if (live.trend) setMarketTrend(live.trend);
    setMarketStatus("live");
    setLastMarketSync(new Date());
    setMarketData((prev) => {
      return {
        ...(prev || FALLBACK_MARKET_DATA),
        xlm: {
          ...(prev?.xlm || FALLBACK_MARKET_DATA.xlm),
          price: livePrice,
          change: safeNumber(live.change, prev?.xlm?.change || 0),
        }
      };
    });
  });

  // 📡 POLLING FALLBACK: Production-grade stability if WS fails
  useEffect(() => {
    if (wsActive) return;
    
    const poll = async () => {
      try {
        const data = await getMarketData();
        if (data && data.xlm) {
          setMarketData(prev => ({
            ...(prev || FALLBACK_MARKET_DATA),
            ...data,
            xlm: {
              ...data.xlm,
              price: safePrice(data.xlm.price, prev?.xlm?.price || FALLBACK_XLM_PRICE),
            },
            history: data.history || prev?.history
          }));
          if (data.history) setPriceHistory(data.history);
          setMarketStatus(data.isLive ? "live" : "cached");
          setLastMarketSync(new Date(data.lastUpdated || Date.now()));
        }
      } catch {
        setMarketStatus((prev) => (prev === "live" ? "cached" : prev || "cached"));
      }
    };

    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [wsActive]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMarketData();
        if (data) {
          setMarketData({
            ...FALLBACK_MARKET_DATA,
            ...data,
            xlm: {
              ...FALLBACK_MARKET_DATA.xlm,
              ...data.xlm,
              price: safePrice(data?.xlm?.price, FALLBACK_XLM_PRICE),
            },
          });
          setPriceHistory(data.history || []);
          setMarketStatus(data.isLive ? "live" : "cached");
          setLastMarketSync(new Date(data.lastUpdated || Date.now()));
        } else {
          setMarketStatus("cached");
        }
      } catch {
        setMarketStatus("cached");
      }
    };
    load();
  }, []);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const res = await api.get(backendPath("/api/health/horizon"), {
          params: { network },
          timeout: 5000,
        });
        const status = res.data?.status || res.data?.horizon || res.data?.online;
        setIsHorizonOnline(status === true || status === "online" || res.status < 400);
      } catch {
        setIsHorizonOnline(false);
      }
    };
    checkNetwork();
  }, [network]);

  useEffect(() => {
    if (activeWallet?.address) {
      const prevBalance = balances.find(b => b.asset_type === 'native')?.balance || "0";
      
      dispatch(fetchWalletData(activeWallet.address)).unwrap().then((result) => {
        const nextBalances = Array.isArray(result?.balances) ? result.balances : [];
        const newBalance = nextBalances.find(b => b.asset_type === 'native')?.balance || "0";
        
        // 🏦 FUNDED NOTIFICATION: Binance-style detection
        if (parseFloat(newBalance) > parseFloat(prevBalance) + 0.1) {
          dispatch(addNotification({
            type: "success",
            category: "transaction",
            title: "Wallet Funded",
            message: `Account received ${ (parseFloat(newBalance) - parseFloat(prevBalance)).toFixed(2) } XLM`,
            walletId: activeWalletId
          }));
        }
      }).catch(() => null);
    }
  }, [activeWallet?.address, dispatch]);

  useEffect(() => {
    if (scannedRecipient || retryData) setShowSendForm(true);
  }, [scannedRecipient, retryData]);

  const xlmPrice = safePrice(marketData?.xlm?.price, FALLBACK_XLM_PRICE);
  const usdcPrice = safePrice(marketData?.usdc?.price, 1);
  const xlmChange = safeNumber(marketData?.xlm?.change, 0);
  const portfolioValue = (
    safeNumber(nativeBalance, 0) * xlmPrice +
    safeNumber(usdcBalance, 0) * usdcPrice
  ).toFixed(2);
  const chartData = useMemo(() => {
    if (Array.isArray(priceHistory) && priceHistory.length > 0) {
      return priceHistory.map((point, index) => ({
        time: point?.time ?? index,
        price: safePrice(point?.price ?? point?.value ?? point, xlmPrice),
      }));
    }

    return Array.from({ length: 24 }, (_, index) => ({
      time: index,
      price: xlmPrice,
    }));
  }, [priceHistory, xlmPrice]);

  const handleRefresh = () => {
    if (activeWallet?.address) {
      dispatch(fetchWalletData(activeWallet.address));
      dispatch(showToast({ message: "Syncing Wallet...", type: "info" }));
    }
  };

  const MainContent = useMemo(() => {
    if (!activeWallet) return null;

    return (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 items-start min-w-0">
        {/* PRIMARY TERMINAL (8/12) */}
        <div className="xl:col-span-8 space-y-6 min-w-0">
          <DashboardCard
            balances={balances}
            address={activeWallet.address}
            loading={loading}
            portfolioValue={portfolioValue}
            onSend={() => setShowSendForm(true)}
            onReceive={() => setShowReceiveModal(true)}
          />
          
          {/* MARKET INSIGHTS */}
          <div className="bg-[#1e2329] p-4 sm:p-5 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group min-w-0">
            <div className="absolute top-4 right-4 flex items-center gap-2 px-2.5 py-1 bg-black/40 rounded-full border border-white/5">
               <div className={`w-1.5 h-1.5 rounded-full ${wsActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{wsActive ? 'Live' : 'Cached'}</span>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Stellar / US Dollar</p>
              <div className="flex items-end gap-3">
                <h1 className={`text-4xl font-black tracking-tighter transition-colors duration-500 ${marketTrend === 'UP' ? 'text-emerald-400' : marketTrend === 'DOWN' ? 'text-rose-400' : 'text-white'}`}>
                  ${xlmPrice.toFixed(4)}
                </h1>
                <div className={`flex items-center gap-1 mb-1 px-2 py-0.5 rounded-md text-[10px] font-black ${ xlmChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                   {xlmChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                   {Math.abs(xlmChange).toFixed(2)}%
                </div>
              </div>
            </div>

            <SafeMarketChart data={chartData} status={marketStatus} />
          </div>

          <TransactionHistory publicKey={activeWallet.address} />
        </div>

        {/* SIDEBAR UTILS (4/12) */}
        <aside className="xl:col-span-4 space-y-6 min-w-0">
          <SystemHealthCard wsActive={wsActive} marketStatus={marketStatus} />
          <ReferralSection />
        </aside>
      </div>
    );
  }, [balances, activeWallet, loading, portfolioValue, chartData, wsActive, marketStatus, marketTrend, xlmPrice, xlmChange]);

  if (!activeWallet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] p-6 text-center">
         <div className="space-y-4">
            <Logo size={60} />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Security Protocol: Select Vault</p>
            <button onClick={() => navigate("/vaults")} className="bg-cyan-500 text-black font-black px-8 py-4 rounded-2xl shadow-xl shadow-cyan-500/20 active:scale-95 transition-all">
              Initialize Session
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="text-white relative overflow-x-hidden">
      <ErrorBoundary>
        <div className="space-y-5 sm:space-y-6">
          
          {/* HEADER HUB */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
            <div className="flex items-center gap-4 min-w-0">
              <Logo size={40} />
              <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
              <div className="flex flex-col">
                <button 
                  onClick={handleRefresh}
                  className="flex items-center gap-2 group text-left"
                >
                  <h1 className="text-xl font-black text-white tracking-tight group-hover:text-cyan-400 transition-colors truncate max-w-[140px] sm:max-w-none">
                    {activeWallet.name}
                  </h1>
                  <RefreshCcw size={14} className={`text-gray-500 group-hover:text-cyan-400 transition-all ${loading ? 'animate-spin' : ''}`} />
                </button>
                <div className="flex items-center gap-1.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${isHorizonOnline ? 'bg-emerald-500' : 'bg-rose-500'} shadow-[0_0_8px_currentColor]`} />
                   <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{network} node active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate("/notifications")} 
                className="relative w-11 h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-all active:scale-95 shadow-xl"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-[10px] flex items-center justify-center rounded-lg text-white font-black border-2 border-[#0b0e11]">
                    {unreadCount}
                  </span>
                )}
              </button>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white/5 rounded-2xl border border-white/10">
                 <ShieldCheck size={16} className="text-cyan-400" />
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secure</span>
              </div>
            </div>
          </header>

          <DegradedModeBanner
            marketStatus={marketStatus}
            wsStatus={wsStatus}
            lastMarketSync={lastMarketSync}
          />

          <NewsBanner wsActive={wsActive} />

          {MainContent}
        </div>

        {/* MODAL OVERLAYS */}
        {showSendForm && (
          <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={() => { 
              setShowSendForm(false); 
              dispatch(clearScannedRecipient());
              dispatch(clearRetryTransaction());
            }}
          >
            <div 
              className="w-full max-w-lg transform transition-all animate-in zoom-in-95 duration-300 flex justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <TransactionForm
                recipient={scannedRecipient}
                onClose={() => { 
                  setShowSendForm(false); 
                  dispatch(clearScannedRecipient());
                  dispatch(clearRetryTransaction());
                }}
                onSuccess={() => dispatch(fetchWalletData(activeWallet.address))}
              />
            </div>
          </div>
        )}

        {showReceiveModal && (
          <ReceiveModal
            address={activeWallet.address}
            onClose={() => setShowReceiveModal(false)}
          />
        )}
      </ErrorBoundary>
    </div>
  );
}
