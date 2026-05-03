import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

const initialState = {
  notifications: JSON.parse(localStorage.getItem("nexa_notifications") || "[]"),
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const { type, title, message, amount, asset, hash, category, walletId } = action.payload;
      const newNotif = {
        id: uuidv4(),
        type: type || "info", // 'success' | 'warning' | 'info'
        category: category || "general", // 'transaction' | 'market' | 'system'
        walletId: walletId || null, // Associate notification with a wallet
        title,
        message,
        amount,
        asset: asset || "XLM",
        hash: hash || null,
        timestamp: new Date().toISOString(),
        read: false
      };
      state.notifications.unshift(newNotif);
      if (state.notifications.length > 50) state.notifications.pop();
      state.unreadCount = state.notifications.filter(n => !n.read).length;
      localStorage.setItem("nexa_notifications", JSON.stringify(state.notifications));
    },
    markAsRead: (state, action) => {
      const notif = state.notifications.find(n => n.id === action.payload);
      if (notif) notif.read = true;
      state.unreadCount = state.notifications.filter(n => !n.read).length;
      localStorage.setItem("nexa_notifications", JSON.stringify(state.notifications));
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
      state.unreadCount = 0;
      localStorage.setItem("nexa_notifications", JSON.stringify(state.notifications));
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
      state.unreadCount = state.notifications.filter(n => !n.read).length;
      localStorage.setItem("nexa_notifications", JSON.stringify(state.notifications));
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      localStorage.removeItem("nexa_notifications");
    }
  },
  extraReducers: (builder) => {
    // 🛡️ SECURITY: Clear notifications when a wallet is disconnected
    // This prevents notification data leakage across different wallet sessions.
    builder.addCase("wallet/disconnectWallet", (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      localStorage.removeItem("nexa_notifications");
    });
  },
});

export const { addNotification, markAsRead, markAllAsRead, removeNotification, clearNotifications } = notificationSlice.actions;

/**
 * 🛡️ SAFE SELECTORS
 */
export const selectNotifications = (state) => {
  try {
    return state?.notifications?.notifications || [];
  } catch {
    return [];
  }
};

export const selectUnreadCount = (state) => {
  try {
    return (state?.notifications?.notifications || []).filter(n => !n.read).length;
  } catch {
    return 0;
  }
};

export const selectNotificationsForActiveWallet = (state) => {
  try {
    const activeWalletId = state?.wallet?.activeWalletId || localStorage.getItem("nexa_selected_wallet");
    const notifications = state?.notifications?.notifications || [];
    if (!activeWalletId) return [];
    return notifications.filter(n => n.walletId === activeWalletId);
  } catch (e) {
    console.warn("selectNotificationsForActiveWallet fallback", e);
    return [];
  }
};

export const selectUnreadCountForActiveWallet = (state) => {
  try {
    const activeWalletId = state?.wallet?.activeWalletId;
    const notifications = state?.notifications?.notifications || [];
    if (!activeWalletId) return 0;
    return notifications.filter(n => !n.read && n.walletId === activeWalletId).length;
  } catch {
    return 0;
  }
};

export default notificationSlice.reducer;