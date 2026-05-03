import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, backendPath, getMarketData } from '@/services/api';
import {
  getBaseFee,
  getAccountBalances, 
  getMinimumReserve,
  sendStellarTransaction, 
  getTransactions as getStellarTransactions 
} from '@/services/stellar';
import { addNotification } from './notificationSlice';

/**
 * findWalletByAddress - Utility to check disk state without needing a hook context
 */
export const findWalletByAddress = (address) => {
  try {
    const wallets = JSON.parse(localStorage.getItem("nexa_wallets") || "[]");
    return wallets.find(w => w.address === address);
  } catch {
    return null;
  }
};

// Selector for activeWalletId
export const selectActiveWalletId = (state) => state?.wallet?.activeWalletId || null;

/**
 * fetchWalletData - Async thunk to fetch account balances
 */
export const fetchWalletData = createAsyncThunk(
  'wallet/fetchWalletData',
  async (address, { rejectWithValue }) => {
    try {
      const [balances, minReserve, baseFee] = await Promise.all([
        getAccountBalances(address),
        getMinimumReserve(address),
        getBaseFee()
      ]);
      return { balances, minReserve, networkFee: baseFee };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch wallet data");
    }
  }
);

/**
 * sendPayment - Async thunk to send Stellar assets
 */
export const sendPayment = createAsyncThunk(
  'wallet/sendPayment',
  async (paymentData, { dispatch, rejectWithValue }) => {
    const { senderAddress, secretKey, destination, amount, memo, assetCode, assetIssuer, activeWalletId } = paymentData;

    // Trigger automatic "Pending" notification
    dispatch(addNotification({
      type: "info",
      category: "transaction",
      title: "Transaction Pending",
      message: `Broadcasting ${amount} ${assetCode} to the network...`,
      amount,
      asset: assetCode,
      walletId: activeWalletId // Pass walletId
    }));

    try {
      const result = await sendStellarTransaction(
        senderAddress,
        secretKey,
        destination,
        amount,
        memo,
        assetCode,
        assetIssuer
      );

      // Trigger automatic "Transfer Successful" notification
      dispatch(addNotification({
        type: "success",
        category: "transaction",
        title: "Transfer Successful",
        message: `Successfully sent ${amount} ${assetCode} to ${destination.slice(0, 8)}...`,
        amount,
        asset: assetCode,
        hash: result.hash,
        walletId: activeWalletId // Pass walletId
      }));

      return result;
    } catch (err) {
      const { destination, amount, memo, assetCode, assetIssuer } = paymentData;
      dispatch(addNotification({
        type: "warning",
        category: "transaction",
        title: "Transaction Failed",
        message: err.message || "Payment failed",
        amount,
        asset: assetCode,
        metadata: { destination, amount, memo, assetCode, assetIssuer },
        walletId: activeWalletId // Pass walletId
      }));
      return rejectWithValue(err.message || "Payment failed");
    }
  }
);

/**
 * fetchTransactions - Fetches history for the active wallet
 */
export const fetchTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async (address, { rejectWithValue }) => {
    try {
      const transactions = await getStellarTransactions(address);
      return transactions;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch transactions");
    }
  }
);

/**
 * fetchCryptoPrices - Syncs real-time market data to Redux
 */
export const fetchCryptoPrices = createAsyncThunk(
  'wallet/fetchCryptoPrices',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getMarketData();
      // If the API helper caught an error and returned a success:false object,
      // we must reject the thunk so the UI health status updates correctly.
      if (data && data.success === false) {
        return rejectWithValue(data.message || "Market feed unavailable");
      }
      return data;
    } catch (err) {
      return rejectWithValue("Market feed unavailable");
    }
  }
);

/**
 * simulateSwap - Optimized Transaction Thunk
 */
export const simulateSwap = createAsyncThunk(
  'wallet/simulateSwap',
  async (swapData, { rejectWithValue }) => {
    try {
      const response = await api.post(backendPath('/api/wallet/swap'), swapData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Swap failed");
    }
  }
);

const initialState = {
  wallets: JSON.parse(localStorage.getItem("nexa_wallets") || "[]"),
  deletedWallets: JSON.parse(localStorage.getItem("nexa_trash_wallets") || "[]"),
  activeWalletId: localStorage.getItem("nexa_selected_wallet"),
  balances: [],
  address: null,
  networkFee: "0.00001", // Default network fee
  minReserve: "1.0", // Base Stellar reserve
  decryptedSecretKey: null,
  walletType: null,
  transactions: [],
  scannedRecipient: null,
  retryData: null,
  lastSwapTime: null,
  retryingNotifId: null,
  retrySuccessId: null,
  lastSync: null, // Added lastSync timestamp
  marketData: null,
  feedbackPreset: localStorage.getItem("nexa_feedback_preset") || "standard",
  autoRefreshEnabled: localStorage.getItem("nexa_auto_refresh") === "true",
  feedbackEnabled: localStorage.getItem("nexa_feedback_enabled") !== "false",
  feedbackVolume: parseFloat(localStorage.getItem("nexa_feedback_volume") || "0.5"),
  loading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    addWallet: (state, action) => {
      if (!action.payload?.id) return;
      const exists = state.wallets.find(w => w.id === action.payload.id);
      if (!exists) {
        state.wallets.push(action.payload);
        localStorage.setItem("nexa_wallets", JSON.stringify(state.wallets));
      }
    },
    
    renameWallet: (state, action) => {
      const { id, name } = action.payload;
      const wallet = state.wallets.find(w => w.id === id);
      if (wallet) {
        wallet.name = name;
        localStorage.setItem("nexa_wallets", JSON.stringify(state.wallets));
      }
    },

    updateBackupCheckup: (state, action) => {
      const wallet = state.wallets.find(w => w.id === action.payload);
      if (wallet) wallet.lastBackupCheckup = Date.now();
      localStorage.setItem("nexa_wallets", JSON.stringify(state.wallets));
    },

    deleteWallet: (state, action) => {
      const idToRemove = action.payload;
      state.wallets = state.wallets.filter((w) => w.id !== idToRemove);
      
      // Fallback protection: If the deleted wallet was active, reset session
      if (state.activeWalletId === idToRemove) {
        state.activeWalletId = state.wallets.length > 0 ? state.wallets[0].id : null;
        state.address = null;
        state.walletType = null;
        state.balances = [];
        state.transactions = [];
        
        if (state.activeWalletId) {
          localStorage.setItem("nexa_selected_wallet", state.activeWalletId);
        } else {
          localStorage.removeItem("nexa_selected_wallet");
        }
      }
      localStorage.setItem("nexa_wallets", JSON.stringify(state.wallets));
    },

    trashWallet: (state, action) => {
      const wallet = state.wallets.find(w => w.id === action.payload);
      if (wallet) {
        state.wallets = state.wallets.filter(w => w.id !== action.payload);
        state.deletedWallets.push(wallet);
        localStorage.setItem("nexa_wallets", JSON.stringify(state.wallets));
        localStorage.setItem("nexa_trash_wallets", JSON.stringify(state.deletedWallets));
      }
    },

    restoreWallet: (state, action) => {
      const wallet = state.deletedWallets.find(w => w.id === action.payload);
      if (wallet) {
        state.deletedWallets = state.deletedWallets.filter(w => w.id !== action.payload);
        state.wallets.push(wallet);
        localStorage.setItem("nexa_wallets", JSON.stringify(state.wallets));
        localStorage.setItem("nexa_trash_wallets", JSON.stringify(state.deletedWallets));
      }
    },

    permanentlyDeleteWallet: (state, action) => {
      state.deletedWallets = state.deletedWallets.filter(w => w.id !== action.payload);
      localStorage.setItem("nexa_trash_wallets", JSON.stringify(state.deletedWallets));
    },

    disconnectWallet: (state) => {
      // Logic: Clear active session but keep the local wallet list intact
      state.activeWalletId = null;
      state.address = null;
      state.walletType = null;
      state.balances = [];
      state.transactions = [];
      state.decryptedSecretKey = null;
      state.error = null;
      localStorage.removeItem("nexa_selected_wallet");
    },

    setActiveWallet: (state, action) => {
      state.activeWalletId = action.payload;
      if (action.payload) {
        localStorage.setItem("nexa_selected_wallet", action.payload);
      } else {
        localStorage.removeItem("nexa_selected_wallet");
      }
    },

    setDecryptedSecretKey: (state, action) => {
      state.decryptedSecretKey = action.payload;
    },

    setRetryTransaction: (state, action) => {
      if (action.payload?.metadata) {
        state.retryData = action.payload.metadata;
        state.retryingNotifId = action.payload.notifId;
      } else {
        state.retryData = action.payload;
      }
    },

    clearRetryTransaction: (state) => {
      state.retryData = null;
      state.retryingNotifId = null;
      state.retrySuccessId = null;
    },
    
    setScannedRecipient: (state, action) => {
      state.scannedRecipient = action.payload;
    },

    clearScannedRecipient: (state) => {
      state.scannedRecipient = null;
    },

    setFeedbackPreset: (state, action) => {
      state.feedbackPreset = action.payload;
      localStorage.setItem("nexa_feedback_preset", action.payload);
    },

    setFeedbackVolume: (state, action) => {
      state.feedbackVolume = action.payload;
      localStorage.setItem("nexa_feedback_volume", action.payload.toString());
    },

    toggleFeedback: (state) => {
      state.feedbackEnabled = !state.feedbackEnabled;
      localStorage.setItem("nexa_feedback_enabled", state.feedbackEnabled.toString());
    },

    toggleAutoRefresh: (state) => {
      state.autoRefreshEnabled = !state.autoRefreshEnabled;
      localStorage.setItem("nexa_auto_refresh", state.autoRefreshEnabled.toString());
    },

    setAutoRefresh: (state, action) => {
      state.autoRefreshEnabled = action.payload;
      localStorage.setItem("nexa_auto_refresh", action.payload);
    },

    syncWalletState: (state, action) => {
      state.address = action.payload;
    },

    connectWallet: (state, action) => {
      state.address = action.payload.address;
      state.walletType = action.payload.walletType;
    },

    clearWallet: (state) => {
      state.address = null;
      state.walletType = null;
    },

    clearWalletState: (state) => {
      state.balances = [];
      state.transactions = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(simulateSwap.pending, (state, action) => {
        const { fromAsset, toAsset, amount, receiveAmount } = action.meta.arg;
        state.loading = true; // Block background sync overwrites
        state.balances = state.balances.map(asset => {
          const isNative = asset.asset_type === 'native';
          const assetCode = isNative ? 'XLM' : asset.asset_code;
          if (assetCode === fromAsset) {
            return { ...asset, balance: Math.max(0, parseFloat(asset.balance) - parseFloat(amount)).toFixed(7) };
          }
          if (assetCode === toAsset) {
            return { ...asset, balance: (parseFloat(asset.balance) + parseFloat(receiveAmount)).toFixed(7) };
          }
          return asset;
        });
      })
      .addCase(simulateSwap.fulfilled, (state, action) => {
        // Maintain the simulated state until the next manual refresh or network confirmation
        state.lastSwapTime = Date.now();
        state.loading = false;
        state.error = null;
      })
      .addCase(simulateSwap.rejected, (state, action) => {
        const { fromAsset, toAsset, amount, receiveAmount } = action.meta.arg;
        state.balances = state.balances.map(asset => {
          const isNative = asset.asset_type === 'native';
          const assetCode = isNative ? 'XLM' : asset.asset_code;
          if (assetCode === fromAsset) {
            return { ...asset, balance: (parseFloat(asset.balance) + parseFloat(amount)).toFixed(7) };
          }
          if (assetCode === toAsset) {
            return { ...asset, balance: (parseFloat(asset.balance) - parseFloat(receiveAmount)).toFixed(7) };
          }
          return asset;
        });
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(fetchWalletData.pending, (state) => {
        // Only show full-screen loader if we have no data
        if (state.balances.length === 0) state.loading = true;
      })
      .addCase(fetchWalletData.fulfilled, (state, action) => {
        // Optimization: Prevent UI snap-back during swaps (10s lock)
        const isSwapping = state.loading || (state.lastSwapTime && Date.now() - state.lastSwapTime < 10000);
        
        if (!isSwapping) {
          state.balances = action.payload.balances;
          state.networkFee = action.payload.networkFee;
          state.minReserve = action.payload.minReserve;
        }
        state.loading = false;
        state.lastSync = new Date().toISOString(); // Update lastSync on successful fetch
        state.error = null;
      })
      .addCase(fetchWalletData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendPayment.fulfilled, (state) => {
        state.loading = false;
        if (state.retryingNotifId) {
          state.retrySuccessId = state.retryingNotifId;
          state.retryingNotifId = null;
          state.retryData = null;
        }
      })
      .addCase(sendPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.retryingNotifId = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
        state.error = null;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchCryptoPrices.rejected, (state, action) => {
        // Maintain existing data for the UI but flag it as offline
        if (state.marketData) state.marketData.isLive = false;
        state.error = action.payload;
      })
      .addCase(fetchCryptoPrices.fulfilled, (state, action) => {
        state.marketData = action.payload;
        state.error = null;
      });
  },
});

export const { 
  addWallet, 
  clearWallet,
  clearWalletState,
  clearRetryTransaction,
  clearScannedRecipient,
  connectWallet,
  deleteWallet,
  disconnectWallet,
  permanentlyDeleteWallet,
  renameWallet,
  restoreWallet,
  setActiveWallet,
  setAutoRefresh,
  setDecryptedSecretKey,
  setFeedbackPreset,
  setFeedbackVolume,
  setRetryTransaction,
  setScannedRecipient,
  syncWalletState,
  toggleAutoRefresh,
  toggleFeedback,
  trashWallet,
  updateBackupCheckup
} = walletSlice.actions;

export default walletSlice.reducer;
