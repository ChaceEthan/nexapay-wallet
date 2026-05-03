import { createSlice, createAction, createSelector } from "@reduxjs/toolkit";
import { getVaultStatus, setVaultLocked } from "./utils/vaultStatus";

// 🔍 UNIFIED VAULT AUDIT
const vault = getVaultStatus();

// ⏱️ SESSION CONFIGURATION (Fintech Standard: 30 Minutes)
export const SESSION_TIMEOUT = 1800000; // 30 minutes in milliseconds
export const SESSION_WARNING = 1770000; // 29.5 minutes (30s warning window)

// Unified Reset Action
export const APP_RESET = createAction("auth/APP_RESET");

// 🛡️ Safe Hydration Engine: Multi-layer recovery for localStorage corruption
const getPersistedAuthState = () => {
  let wallets = [];
  let selectedId = null;
  let hasPin = false;
  let network = 'testnet';
  let isStrictMode = false;

  try {
    const rawWallets = typeof window !== 'undefined' ? localStorage.getItem("nexa_wallets") : null;
    wallets = rawWallets ? JSON.parse(rawWallets) : [];
    if (!Array.isArray(wallets)) wallets = [];

    hasPin = !!(typeof window !== 'undefined' && localStorage.getItem("nexa_pin"));
    selectedId = localStorage.getItem("nexa_selected_wallet");
    network = localStorage.getItem("nexa_network") || 'testnet';
    isStrictMode = localStorage.getItem("nexa_strict_mode") === "true";
    if (!selectedId && wallets.length > 0) selectedId = wallets[0].id;
  } catch (err) {
    console.error("Auth Hydration: Storage corrupted, using defaults", err);
  }

  const hasWallet = wallets.length > 0;
  
  // Check if the app was explicitly locked in a previous session
  const isAppUnlocked = typeof window !== 'undefined' ? localStorage.getItem("nexa_app_locked") !== "true" : true;
  
  return { wallets, selectedId, hasPin, hasWallet, network, isAppUnlocked, isStrictMode };
};

const persisted = getPersistedAuthState();

const initialState = { 
  isInitialized: false,
  isWalletUnlocked: persisted.isAppUnlocked, 
  selectedWalletId: persisted.selectedId,
  
  hasWallet: persisted.hasWallet,
  hasPin: persisted.hasPin,
  network: persisted.network,
  isStrictMode: persisted.isStrictMode,
 
  pinAttempts: 0,
  // 🔄 STABILITY ENGINE
  lastActivity: Date.now(), 
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    lockWallet: (state) => {
      // 🔐 SINGLE SOURCE OF TRUTH: isWalletUnlocked flag
      // Secret key clearing is handled by walletSlice extraReducers
      state.isWalletUnlocked = false;
      localStorage.setItem("nexa_app_locked", "true");
    }, 

    lockApp: (state) => {
      // 🔐 SINGLE SOURCE OF TRUTH: isWalletUnlocked flag
      // Secret key clearing is handled by walletSlice extraReducers
      state.isWalletUnlocked = false;
      localStorage.setItem("nexa_app_locked", "true");
    }, 

    setInitialized: (state) => {
      state.isInitialized = true;
    },
 
    setHasPin: (state, action) => {
      state.hasPin = action.payload;
      state.lastActivity = Date.now();
    },

    setAppUnlocked: (state, action) => {
      state.isWalletUnlocked = action.payload;
      localStorage.setItem("nexa_app_locked", action.payload ? "false" : "true");
      if (action.payload) state.lastActivity = Date.now();
    },

    setUnlocked: (state, action) => {
      state.isWalletUnlocked = action.payload;
      localStorage.setItem("nexa_app_locked", action.payload ? "false" : "true");
      if (action.payload) state.lastActivity = Date.now();
    }, 

    setHasWallet: (state, action) => {
      state.hasWallet = action.payload;
    },

    setNetwork: (state, action) => {
      state.network = action.payload;
      localStorage.setItem("nexa_network", action.payload);
      state.lastActivity = Date.now();
    },

    toggleStrictMode: (state) => {
      state.isStrictMode = !state.isStrictMode;
      localStorage.setItem("nexa_strict_mode", state.isStrictMode.toString());
    },

    updateLastActivity: (state) => {
      state.lastActivity = Date.now();
    },

    reportSecurityError: (state, action) => {
      // This action is primarily for the middleware to intercept
      state.lastActivity = Date.now();
      console.error(`🛡️ Security Error [${new Date().toISOString()}]:`, action.payload);
    },

    recordPinFailure: (state) => {
      state.pinAttempts += 1;
      state.lastActivity = Date.now();
    },

    resetPinAttempts: (state) => {
      state.pinAttempts = 0;
      state.lastActivity = Date.now();
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase("wallet/addWallet", (state) => {
        state.hasWallet = true;
      })
      .addCase("wallet/trashWallet", (state) => {
        const rawWallets = localStorage.getItem("nexa_wallets");
        const wallets = JSON.parse(rawWallets || "[]");
        state.hasWallet = wallets.length > 0;
      })
      .addCase("wallet/deleteWallet", (state) => {
        const rawWallets = localStorage.getItem("nexa_wallets");
        const wallets = JSON.parse(rawWallets || "[]");
        state.hasWallet = wallets.length > 0;
      })
      .addCase(APP_RESET, (state) => {
        state.hasWallet = false;
        state.selectedWalletId = null;
        state.isWalletUnlocked = true;
      });
  },
});


export const {
  lockWallet, // Export renamed action
  lockApp,
  setInitialized,
  setHasPin,
  setAppUnlocked,
  setUnlocked,
  setHasWallet,
  setNetwork,
  recordPinFailure,
  toggleStrictMode,
  resetPinAttempts,
  updateLastActivity,
  reportSecurityError,
} = authSlice.actions;

// Alias for Sidebar and legacy components
export const logout = lockWallet;
// 🎯 Centralized Selectors
export const selectIsLocked = (state) => state?.auth?.isWalletUnlocked === false;

export default authSlice.reducer;
