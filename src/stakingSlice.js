import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/**
 * NexaPay Staking Module (Testnet Prototype)
 * 🛡️ Simulates institutional-grade yield generation on the Stellar network.
 */

const initialState = {
  activeStakes: JSON.parse(localStorage.getItem("nexa_active_stakes") || "[]"),
  totalRewardsEarned: parseFloat(localStorage.getItem("nexa_total_rewards") || "0"),
  loading: false,
};

// Simple reward calculation (12% APY simulated)
const YIELD_RATE = 0.12;

export const calculateStakeRewards = createAsyncThunk(
  "staking/calculate",
  async (_, { getState }) => {
    const { activeStakes } = getState().staking;
    const now = Date.now();
    
    return activeStakes.map(stake => {
      const elapsedHours = (now - stake.startTime) / (1000 * 60 * 60);
      const reward = (stake.amount * (YIELD_RATE / 365 / 24)) * elapsedHours;
      return { ...stake, currentReward: reward };
    });
  }
);

const stakingSlice = createSlice({
  name: "staking",
  initialState,
  reducers: {
    addStake: (state, action) => {
      const { walletId, amount, durationDays } = action.payload;
      const now = Date.now();
      const newStake = {
        id: `stake_${Math.random().toString(36).substr(2, 9)}`,
        walletId,
        amount: parseFloat(amount),
        duration: durationDays,
        startTime: now,
        expiryTime: now + (durationDays * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
        currentReward: 0,
      };
      
      state.activeStakes.push(newStake);
      localStorage.setItem("nexa_active_stakes", JSON.stringify(state.activeStakes));
    },
    
    claimStake: (state, action) => {
      const stakeId = action.payload;
      const stakeIndex = state.activeStakes.findIndex(s => s.id === stakeId);
      
      if (stakeIndex !== -1) {
        const stake = state.activeStakes[stakeIndex];
        state.totalRewardsEarned += stake.currentReward || 0;
        state.activeStakes[stakeIndex].currentReward = 0;
        state.activeStakes[stakeIndex].startTime = Date.now(); // Reset period
        
        localStorage.setItem("nexa_total_rewards", state.totalRewardsEarned.toString());
        localStorage.setItem("nexa_active_stakes", JSON.stringify(state.activeStakes));
      }
    },
    
    unstake: (state, action) => {
      const stakeId = action.payload;
      state.activeStakes = state.activeStakes.filter(s => s.id !== stakeId);
      localStorage.setItem("nexa_active_stakes", JSON.stringify(state.activeStakes));
    }
  },
  extraReducers: (builder) => {
    builder.addCase(calculateStakeRewards.fulfilled, (state, action) => {
      state.activeStakes = action.payload;
    });
  }
});

export const { addStake, claimStake, unstake } = stakingSlice.actions;
export default stakingSlice.reducer;
