import { useState } from "react";

export default function useOAuth() {
  const [loading] = useState(false);

  return {
    loginWithGoogle: () => console.warn("OAuth login is disabled."),
    loginWithApple: () => console.warn("OAuth login is disabled."),
    loading,
    error: null,
  };
}
