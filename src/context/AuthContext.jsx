import { createContext, useContext, useState } from 'react';

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [userPublicKey, setUserPublicKey] = useState(() => {
    return localStorage.getItem('userPublicKey') || null;
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('userEmail') || null;
  });
  const [balance, setBalance] = useState(() => {
    return parseFloat(localStorage.getItem('balance')) || 0;
  });

  const login = (email, password, userData = null) => {
    if (email && password) {
      setIsLoggedIn(true);
      setUserEmail(email);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', email);

      // Store additional user data if provided
      if (userData) {
        if (userData.token) {
          localStorage.setItem('authToken', userData.token);
        }
        if (userData.userId) {
          localStorage.setItem('userId', userData.userId);
        }
      }

      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserPublicKey(null);
    setUserEmail(null);
    setBalance(0);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userPublicKey');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('balance');
  };

  const setWalletPublicKey = (publicKey) => {
    setUserPublicKey(publicKey);
    if (publicKey) {
      localStorage.setItem('userPublicKey', publicKey);
    } else {
      localStorage.removeItem('userPublicKey');
    }
  };

  const value = {
    isLoggedIn,
    userPublicKey,
    userEmail,
    balance,
    login,
    logout,
    setWalletPublicKey,
    setBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};