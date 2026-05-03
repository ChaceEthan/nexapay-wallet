import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectIsLocked } from '../authSlice';

/**
 * ProtectedRoute
 * Guards routes that require a fully initialized and unlocked wallet session.
 * 
 * It uses the unified auth state to determine if the user should be 
 * redirected to onboarding, wallet selection, or the unlock screen.
 */
const ProtectedRoute = ({ children }) => {
  const { 
    hasWallet, 
    selectedWalletId, 
    isInitialized 
  } = useSelector((state) => state.auth || {});
  const isLocked = useSelector(selectIsLocked);
  
  const location = useLocation();

  if (!isInitialized) {
    return null; // Wait for state initialization from persistence
  }

  if (!hasWallet) {
    return <Navigate to="/welcome" replace />;
  }

  if (!selectedWalletId) {
    return <Navigate to="/select-wallet" replace />;
  }

  if (isLocked) {
    // Redirect to unlock and save the current location for post-unlock redirection
    return <Navigate to="/unlock-wallet" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;