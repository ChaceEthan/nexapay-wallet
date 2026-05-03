export default function use2FA() {
  return {
    sendOTP: () => console.warn("2FA sendOTP is disabled."),
    verify2FA: async () => {
      console.warn("2FA verify is disabled.");
      return false;
    },
    loading: false,
    error: null,
  };
}
