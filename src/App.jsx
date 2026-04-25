import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux"; 
import Dashboard from "@pages/Dashboard.jsx";
import Markets from "@pages/Markets.jsx";
import Trade from "@pages/Trade.jsx";
import DeFi from "@/pages/DeFi.jsx";
import Settings from "@pages/Settings.jsx"; 
import Staking from "@pages/Staking.jsx";
import WalletChoice from "@pages/WalletChoice.jsx";

import CreateWallet from "@pages/CreateWallet.jsx";
import ImportWallet from "@pages/ImportWallet.jsx";
import NotificationCenter from "@pages/NotificationCenter.jsx";

import BackupPhrase from "@pages/BackupPhrase.jsx";
import ConfirmPhrase from "@pages/ConfirmPhrase.jsx";
import SetPIN from "@pages/SetPIN.jsx";
import Unlock from "@pages/Unlock.jsx";
import VaultsPage from "@pages/VaultsPage.jsx";

import OAuthCallbackHandler from "@pages/OAuthCallbackHandler.jsx";


import Sidebar from "@components/Sidebar.jsx";
import Navbar from "@components/Navbar.jsx";
import Toast from "@components/Toast.jsx";

import ProtectedRoute from "@components/ProtectedRoute.jsx";
import NotFound from "@pages/NotFound.jsx";

import useSessionManager from "@/hooks/useSessionManager";
import useWallet from "@/hooks/useWallet";
import useSyncEngine from "@/hooks/useSyncEngine";

import { 
  setInitialized, 
  setUnlocked, 
  selectIsLocked, 
  SESSION_TIMEOUT, 
  SESSION_WARNING 
} from "@/authSlice.js";
import { showToast } from "@/toastSlice.js";
import GlobalBackButton from "@components/GlobalBackButton.jsx";
import LockScreen from "@components/LockScreen.jsx";
import RecoveryMode from "@components/RecoveryMode.jsx";
import { performHealthCheck } from "@/utils/WalletHealthMonitor";
import { updateNetworkConfig } from "@/services/stellar";
import { getVaultStatus } from "./utils/vaultStatus";
import { registerWallet } from "@/utils/analytics";
import { setReferrer, syncWalletStats, incrementReferrals, addReward } from "@/referralSlice";

import ErrorBoundary from "@components/ErrorBoundary.jsx";

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // 🛡️ GLOBAL SAFETY GUARDS (Ensure no undefined crashes)
  const authState = useSelector((state) => state?.auth || {});
  const walletState = useSelector((state) => state?.wallet || {});
  
  const isInitialized = authState.isInitialized ?? false;
  const hasWallet = authState.hasWallet ?? false;
  const network = authState.network ?? "testnet";
  const activeWalletId = walletState.activeWalletId ?? null;
  const address = walletState.address ?? "";
  
  const isLocked = useSelector(selectIsLocked);

  // 🛡️ SETUP ROUTE CONFIG
  const SETUP_PATHS = ["/welcome", "/create-wallet", "/import-wallet", "/backup-phrase", "/confirm-phrase", "/set-pin", "/recovery"];
  const isSetupPath = SETUP_PATHS.includes(pathname);

  const referralState = useSelector((state) => state?.referral || {});
  const { referralCode, referrer, activeAddress } = referralState;

  const [open, setOpen] = useState(false);

  // 🚀 STRICT START ROUTE ENGINE
  const getStartRoute = () => {
    if (!hasWallet) return "/welcome";
    if (!activeWalletId) return "/vaults";
    if (isLocked) return "/unlock-wallet"; 
    return "/dashboard";
  };


  // 🛡️ INITIAL NAVIGATION ENGINE & SESSION STABILITY
  useEffect(() => {
    if (!isInitialized) return;

    const currentRoute = pathname;
    const targetRoute = getStartRoute();

    // 1. Initial redirect for root
    if (currentRoute === "/" || currentRoute === "") {
      navigate(targetRoute, { replace: true });
      return;
    }

    // 2. Global Guard: If we're on a protected route but lose wallet/session, force redirect
    const isProtectedRoute = !isSetupPath && currentRoute !== "/vaults" && currentRoute !== "/unlock-wallet";
    
    if (isProtectedRoute) {
      if (!hasWallet || !activeWalletId || isLocked) {
        navigate(targetRoute, { replace: true });
      }
    }

  }, [isInitialized, pathname, navigate, hasWallet, isLocked, activeWalletId, isSetupPath]);


  useSessionManager();
  useWallet();
  useSyncEngine();

  // 🛡️ AUTO-LOCK ENGINE
  useEffect(() => {
    let lockTimeout;
    let warningTimeout;

    const resetLockTimer = () => {
      if (lockTimeout) clearTimeout(lockTimeout);
      if (warningTimeout) clearTimeout(warningTimeout);
      if (!hasWallet || isLocked) return;

      warningTimeout = setTimeout(() => {
        dispatch(showToast({ message: "Session expiring due to inactivity", type: "info" }));
      }, SESSION_WARNING);

      lockTimeout = setTimeout(() => {
        dispatch(setUnlocked(false));
      }, SESSION_TIMEOUT);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "touchmove"];
    if (!isLocked) {
      events.forEach(event => document.addEventListener(event, resetLockTimer));
      resetLockTimer();
    }

    return () => {
      events.forEach(event => document.removeEventListener(event, resetLockTimer));
      if (lockTimeout) clearTimeout(lockTimeout);
      if (warningTimeout) clearTimeout(warningTimeout);
    };
  }, [isLocked, hasWallet, dispatch]);

  // 🛡️ INITIALIZATION ENGINE
  useEffect(() => { 
    performHealthCheck(dispatch, navigate);
    dispatch(setInitialized());
    if (network) updateNetworkConfig(network);
  }, [dispatch, navigate]);

  // 🔗 REFERRAL ENGINE
  useEffect(() => {
    if (!hasWallet || !activeWalletId || !address) return;
    const urlParams = new URLSearchParams(window.location.search);
    const refFromUrl = urlParams.get("ref");
    if (refFromUrl && !referrer && refFromUrl !== referralCode) {
      dispatch(setReferrer(refFromUrl));
    }
    if (address && address !== activeAddress) {
      dispatch(syncWalletStats(address));
    }
  }, [address, hasWallet, referrer, referralCode, activeAddress, dispatch]);

  // 🛡️ GLOBAL REGISTRY PING
  useEffect(() => {
    if (address && hasWallet) {
      registerWallet(address, network);
    }
  }, [address, hasWallet, network]);


  // 🛡️ SEO & LEGACY REDIRECTS
  useEffect(() => {
    const baseTitle = "NexaPay Wallet";
    const routeTitle = pathname === "/" ? "Home" : pathname.substring(1).charAt(0).toUpperCase() + pathname.substring(2);
    document.title = `${baseTitle} — ${routeTitle}`;

    if (["/signin", "/signup", "/auth/callback"].includes(pathname)) {
      navigate("/", { replace: true });
    }
  }, [pathname, navigate]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Initializing Vault System</p>
        </div>
      </div>
    );
  }
 
  // 🛡️ GATE 1: FRESH INSTALL / ONBOARDING
  if (!hasWallet || (isSetupPath && isLocked)) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-[#0b0e11] text-white p-4 flex flex-col items-center justify-center">
          <Toast />
          <Routes>
            <Route path="/" element={<Navigate to={getStartRoute()} replace />} />
            <Route path="/welcome" element={<WalletChoice />} />
            <Route path="/create-wallet" element={<CreateWallet />} />
            <Route path="/import-wallet" element={<ImportWallet />} />
            <Route path="/backup-phrase" element={<BackupPhrase />} />
            <Route path="/confirm-phrase" element={<ConfirmPhrase />} />
            <Route path="/set-pin" element={<SetPIN />} />
            <Route path="/recovery" element={<RecoveryMode />} />
            {hasWallet && <Route path="/vaults" element={<VaultsPage />} />}
            <Route path="*" element={<Navigate to={getStartRoute()} replace />} />
          </Routes>

        </div>
      </ErrorBoundary>
    );
  }
 
  // 🛡️ STEP 3: WALLET CONNECTION
  if (!activeWalletId && !isSetupPath) {
    return ( 
      <ErrorBoundary>
        <div className="min-h-screen bg-[#0b0e11] text-white">
          <Routes>
            <Route path="/" element={<Navigate to={getStartRoute()} replace />} />
            <Route path="/vaults" element={<VaultsPage />} />
            <Route path="/connect-wallet" element={<VaultsPage />} /> 
            <Route path="/import-wallet" element={<ImportWallet />} />
            <Route path="/create-wallet" element={<CreateWallet />} />
            <Route path="*" element={<Navigate to={getStartRoute()} replace />} />
          </Routes> 
        </div>

      </ErrorBoundary>
    );
  }

  // 🛡️ STEP 4: WALLET UNLOCK
  if (isLocked) { 
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-[#0b0e11] text-white flex flex-col items-center justify-center">
          <Toast />
          <GlobalBackButton />
          <Routes>
            <Route path="/" element={<Navigate to={getStartRoute()} replace />} />
            <Route path="/unlock-wallet" element={<Unlock />} />
            <Route path="/recovery" element={<RecoveryMode />} />
            <Route path="*" element={<Navigate to={getStartRoute()} replace />} />
          </Routes>
        </div>
      </ErrorBoundary>
    );
  }

  // STEP 5: UNLOCKED DASHBOARD (Isolated components with Mini-ErrorBoundaries)
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0b0e11] text-white">
        <Toast />
        <div className="flex min-h-screen bg-[#080a0c]">
          {/* SIDEBAR HUB */}
          <Sidebar open={open} setOpen={setOpen} />

          {/* MAIN TERMINAL HUB */}
          <div className="flex-1 flex flex-col md:ml-72 min-w-0">
            {/* STICKY HEADER */}
            <ErrorBoundary mini>
              <Navbar setOpen={setOpen} />
            </ErrorBoundary>

            {/* SCROLLABLE VIEWPORT */}
            <main className="flex-1 overflow-y-auto pt-6 pb-20">
              <ErrorBoundary>
                <div className="px-4 md:px-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <Routes>
                    <Route path="/" element={<Navigate to={getStartRoute()} replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/markets" element={<Markets />} />
                    <Route path="/trade" element={<Trade />} />
                    <Route path="/defi" element={<DeFi />} />
                    <Route path="/defi/staking" element={<Staking />} />
                    <Route path="/settings" element={<Settings />} />

                    <Route path="/notifications" element={<NotificationCenter />} />
                    <Route path="/add-wallet" element={<WalletChoice />} />
                    <Route path="/vaults" element={<VaultsPage />} />
                    <Route path="/create-wallet" element={<CreateWallet />} />

                    <Route path="/import-wallet" element={<ImportWallet />} />
                    <Route path="/backup-phrase" element={<BackupPhrase />} />
                    <Route path="/confirm-phrase" element={<ConfirmPhrase />} />
                    <Route path="/set-pin" element={<SetPIN />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </div>
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}


export default App;
