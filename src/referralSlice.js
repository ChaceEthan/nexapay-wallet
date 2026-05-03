import { createSlice } from "@reduxjs/toolkit";

const loadStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("nexa_referral_data") || "{}");
  } catch (e) {
    return {};
  }
};

const initialState = {
  referralCode: "",
  referrer: localStorage.getItem("nexa_referrer") || null,
  referralsCount: 0,
  rewards: 0,
  rewardHistory: [0], // For the Sparkline chart
  activeAddress: null,
  wallets: loadStorage(), // Map: address -> { count, rewards, history }
};

const referralSlice = createSlice({
  name: "referral",
  initialState,
  reducers: {
    syncWalletStats: (state, action) => {
      const address = action.payload;
      if (!address) return;
      
      state.activeAddress = address;
      state.referralCode = address.slice(0, 6);
      
      if (!state.wallets[address]) {
        state.wallets[address] = { count: 0, rewards: 0, history: [0] };
      }
      
      const data = state.wallets[address];
      state.referralsCount = data.count;
      state.rewards = data.rewards;
      state.rewardHistory = data.history;
    },
    setReferrer: (state, action) => {
      state.referrer = action.payload;
      localStorage.setItem("nexa_referrer", action.payload);
    },
    incrementReferrals: (state) => {
      if (!state.activeAddress) return;
      state.referralsCount += 1;
      state.wallets[state.activeAddress].count = state.referralsCount;
      localStorage.setItem("nexa_referral_data", JSON.stringify(state.wallets));
    },
    addReward: (state, action) => {
      if (!state.activeAddress) return;
      state.rewards += action.payload;
      state.rewardHistory.push(state.rewards);
      state.wallets[state.activeAddress].rewards = state.rewards;
      state.wallets[state.activeAddress].history = state.rewardHistory;
      localStorage.setItem("nexa_referral_data", JSON.stringify(state.wallets));
    },
  },
});

export const { syncWalletStats, setReferrer, incrementReferrals, addReward } = referralSlice.actions;
export default referralSlice.reducer;