import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, useResolvedPath } from 'react-router-dom';
import { 
  updateLastActivity, 
  setAppUnlocked, 
  lockWallet, 
  selectIsLocked
} from '../authSlice.js';
import { setDecryptedSecretKey } from '../walletSlice.js';
import { showToast } from '../toastSlice.js';

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 Minutes in milliseconds

export default function useSessionManager() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const resolvedPath = useResolvedPath(useLocation().pathname); // Use useResolvedPath for stable path
  const { pathname } = useLocation();

  // Fix: Unified state selection from auth slice
  const { 
    lastActivity, 
    hasWallet, 
    isInitialized,
    isStrictMode,
    selectedWalletId 
  } = useSelector((state) => state.auth || {});

  const decryptedSecretKey = useSelector((state) => state.wallet.decryptedSecretKey);

  const isLocked = useSelector(selectIsLocked);

  // --- 🛡️ SESSION INACTIVITY MONITOR ---
  useEffect(() => {
    // Only monitor if the app is currently unlocked, a wallet exists, and we are not on an unlock/welcome screen
    if (isLocked || !hasWallet || pathname === "/unlock-wallet" || pathname === "/welcome" || pathname === "/set-pin") return;

    const handleActivity = () => { // Debounce activity updates to prevent excessive re-renders
      const now = Date.now();
      // Throttle updates to every 10 seconds to avoid Redux spamming
      if (now - lastActivity > 10000) {
        dispatch(updateLastActivity());
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(e => window.addEventListener(e, handleActivity));

    // Check for inactivity every 30 seconds
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      if (elapsed > INACTIVITY_LIMIT) {
        console.warn("🕒 Session Timeout: App locking due to inactivity.");
        dispatch(lockWallet()); // Securely lock the vault
      } else if (elapsed > INACTIVITY_LIMIT - 30000) {
        dispatch(showToast({ 
          message: "Session expiring in 30 seconds due to inactivity.", 
          type: "info" 
        }));
      }
    }, 30000);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearInterval(checkInterval);
    }; // Dependencies: lastActivity is intentionally included to re-evaluate timeout on activity update
  }, [dispatch, lastActivity, isLocked, hasWallet]);

  // --- 🔒 STRICT MODE MONITOR (Tab Visibility) ---
  useEffect(() => {
    if (!isStrictMode || !decryptedSecretKey || isLocked) return;

    let strictTimeout;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Start countdown to clear key when window loses focus
        strictTimeout = setTimeout(() => {
          dispatch(setDecryptedSecretKey(null));
          dispatch(showToast({ 
            message: "Strict Mode: Security key cleared from memory.", 
            type: "info" 
          }));
        }, 60000); // 60 Seconds
      } else {
        if (strictTimeout) clearTimeout(strictTimeout);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (strictTimeout) clearTimeout(strictTimeout);
    };
  }, [dispatch, isStrictMode, decryptedSecretKey, isLocked]);

  // --- 🚀 STABILIZED ROUTING LOGIC ---
  useEffect(() => {
    if (!isInitialized) return;

    // Only trigger redirection on root paths to avoid disrupting active navigation
    if (resolvedPath.pathname === "/" || resolvedPath.pathname === "") { // Use resolvedPath for stability
      if (!hasWallet) {
        navigate("/welcome", { replace: true });
      } else if (isLocked) {
        navigate("/unlock-wallet", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isInitialized, hasWallet, isLocked, navigate, resolvedPath.pathname]);

  return {
    triggerLogout: () => dispatch(lockWallet()),
    performTokenRefresh: async () => {} // Legacy stub
  };
}
