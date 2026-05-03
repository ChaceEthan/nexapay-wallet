import { api, backendPath } from "@/services/api";

export const registerWallet = async (publicKey, network = "testnet") => {
  if (!publicKey) return;

  try {
    await api.post(backendPath("/api/register"), { publicKey, network });
  } catch (error) {
    console.error("[Analytics] Registry ping failed", error.message);
  }
};

export const getLocalWalletCount = () => {
  try {
    const wallets = JSON.parse(localStorage.getItem("nexa_wallets") || "[]");
    return wallets?.length || 0;
  } catch {
    return 0;
  }
};

export const fetchGlobalStats = async () => {
  try {
    const response = await api.get(backendPath("/api/stats/users"));
    const data = response.data || {};

    return {
      totalUsers: data.totalUsers ?? data.users ?? data.count ?? 0,
      activeNodes: data.activeNodes ?? data.nodes ?? 0,
      tps: data.tps ?? data.transactionsPerSecond ?? 0,
    };
  } catch {
    console.warn("Analytics: Backend stats unavailable, using local fallback");
    return {
      totalUsers: 0,
      activeNodes: 0,
      tps: 0,
    };
  }
};

export const getActiveUserCount = getLocalWalletCount;
export const getTotalUserCount = getLocalWalletCount;
export const trackActiveWallet = registerWallet;
