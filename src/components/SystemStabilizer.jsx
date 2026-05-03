import React, { useEffect } from 'react';
import vaultInstance from '../services/VaultEngine';

/**
 * SystemStabilizer
 * A headless watchdog component that monitors global singletons.
 * Detects and recovers from unexpected browser environment changes 
 * or instance wipes during heavy navigation/resource pressure.
 */
const SystemStabilizer = () => {
  useEffect(() => {
    const performStabilityAudit = () => {
      // 1. Vault Engine Recovery
      // Ensure the global singleton reference is intact and initialized
      if (!window.__nexaVault) {
        console.warn("🛡️ SystemStabilizer: Vault reference lost. Re-attaching singleton...");
        window.__nexaVault = vaultInstance;
      }

      try {
        if (window.__nexaVault.getStatus() !== "ACTIVE") {
          console.warn("🛡️ SystemStabilizer: Vault inactive. Re-initializing...");
          window.__nexaVault.initialize();
        }
        window.__nexaVault.ping();
      } catch (err) {
        console.error("🛡️ SystemStabilizer: Vault critical failure:", err);
      }

      // 2. Market Socket Recovery
      // Check if the socket exists but is stuck in a non-functional state
      const socket = window.__nexaSocket;
      if (socket) {
        const isStalled = socket.readyState === WebSocket.CLOSED || 
                          socket.readyState === WebSocket.CLOSING;

        // If stalled and no cleanup flag is set, force a reset to trigger the reconnect loop in useMarketSocket
        if (isStalled && !window.__nexaSocket_cleanup) {
          console.warn("🛡️ SystemStabilizer: Market Socket stalled. Triggering auto-recovery...");
          if (typeof window.forceNexaSocketReset === 'function') {
            window.forceNexaSocketReset();
          }
        }
      }
    };

    // Audit every 15 seconds to ensure institutional-grade uptime without overhead
    const intervalId = setInterval(performStabilityAudit, 15000);

    return () => clearInterval(intervalId);
  }, []);

  return null;
};

export default SystemStabilizer;