import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer, { APP_RESET, lockWallet, updateLastActivity } from "./authSlice.js";
import walletReducer, { syncWalletState } from "./walletSlice.js";
import toastReducer from "./toastSlice.js";
import notificationReducer from "./notificationSlice.js";
import referralReducer from "./referralSlice.js";
import stakingReducer from "./stakingSlice.js";
import { showToast } from "./toastSlice.js";

// 🛡️ Production-grade Root Reducer with global state safety
const appReducer = combineReducers({
  auth: authReducer,
  wallet: walletReducer,
  toast: toastReducer, 
  notifications: notificationReducer,
  referral: referralReducer,
  staking: stakingReducer,
});


const rootReducer = (state, action) => {
  // 🛡️ State Validation: Prevent hydration from starting with an undefined state
  if (state === undefined && !action.type.startsWith("@@")) {
    console.warn("Redux Root: State is undefined, re-initializing defaults.");
  }

  if (action.type === APP_RESET.type) {
    // Returning undefined to combineReducers forces all slices to their initialStates
    state = undefined;
  }
  
  return appReducer(state, action);
};

// 🛡️ Security Audit Middleware
const securityReportingMiddleware = (store) => (next) => (action) => {
  if (action.type === "auth/reportSecurityError" || action.type === "auth/recordPinFailure") {
    console.error("🚨 SECURITY AUDIT:", {
      event: action.type,
      payload: action.payload || "Unauthorized Access Attempt",
      timestamp: new Date().toISOString(),
      activeWallet: store.getState().auth.selectedWalletId
    });
  }
  return next(action);
};

// ================= SESSION TIMEOUT MIDDLEWARE =================
const sessionTimeoutMiddleware = (store) => {
  let timeoutId;
  let warningTimeoutId;

  return (next) => (action) => {
    const result = next(action);
    const state = store.getState();

    // If wallet is unlocked, reset the inactivity timer
    if (state.auth.isWalletUnlocked) {
      if (timeoutId) clearTimeout(timeoutId);
      if (warningTimeoutId) clearTimeout(warningTimeoutId);

      // Only start a new timer if the current action isn't already a lock action or reset
      // and avoid recursive dispatch of updateLastActivity
      if (
        action.type !== lockWallet.type && 
        action.type !== APP_RESET.type &&
        action.type !== updateLastActivity.type
      ) {
        warningTimeoutId = setTimeout(() => {
          store.dispatch(showToast({ 
            message: "Session expiring in 30 seconds due to inactivity.", 
            type: "warning" // Changed to warning for better visibility
          }));
        }, 4.5 * 60 * 1000); // 4.5 Minutes

        timeoutId = setTimeout(() => {
          // 🔄 Sync wallet state before auto-locking to ensure data persistence
          const currentAddress = store.getState().wallet.address;
          if (currentAddress) {
            store.dispatch(syncWalletState(currentAddress));
          }
          store.dispatch(lockWallet());
        }, 5 * 60 * 1000); // 5 Minutes
      }
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      if (warningTimeoutId) clearTimeout(warningTimeoutId);
    }
    return result;
  };
};

// ================= PERSISTENCE MIDDLEWARE =================
const persistenceMiddleware = (store) => (next) => (action) => {
  // Task 8: Global safeStore wrapper check
  let result;
  try {
    result = next(action);
  } catch (err) {
    console.error("Redux Middleware: Action processing failed", err);
    return;
  }

  const state = store.getState() || {};

  // skip saving on reset or undefined state
  if (action.type === APP_RESET.type) return result;

  // Persistence middleware no longer handles auth tokens/users
  // Wallet persistence is handled directly by walletSlice and authSlice for selectedWalletId

  return result;
};

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat([
      persistenceMiddleware,
      securityReportingMiddleware,
      sessionTimeoutMiddleware
    ]),
});

export default store;
