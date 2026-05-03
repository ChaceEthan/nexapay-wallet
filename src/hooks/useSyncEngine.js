import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsLocked, updateLastActivity } from '../authSlice';
import { 
  fetchWalletData, 
  fetchTransactions, 
  fetchCryptoPrices 
} from '@/walletSlice';

/**
 * useSyncEngine
 * Background synchronization engine for NexaPay.
 * Polls for account updates and market prices only when the environment is secure.
 */
export default function useSyncEngine() {
  const dispatch = useDispatch();
  
  // Access security and wallet states from Redux
  const isLocked = useSelector(selectIsLocked);
  const { address, autoRefreshEnabled } = useSelector((state) => state.wallet);

  useEffect(() => {
    // 🛡️ SECURITY & PREFERENCE CHECK
    // Ensures we don't leak wallet activity via network logs on lock screens
    const isEnvironmentSecure = !isLocked && address;
    
    if (!isEnvironmentSecure || !autoRefreshEnabled) {
      return;
    }

    const performSync = () => {
      dispatch(updateLastActivity()); // Session Heartbeat
      dispatch(fetchWalletData(address));
      dispatch(fetchTransactions(address));
      dispatch(fetchCryptoPrices());
    };

    // Polling interval (30 seconds)
    const intervalId = setInterval(performSync, 30000);

    return () => clearInterval(intervalId);
  }, [dispatch, isLocked, address, autoRefreshEnabled]);
} 