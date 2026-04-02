import { createContext, useContext, useState } from 'react';

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [userPublicKey, setUserPublicKey] = useState(() => {
    return localStorage.getItem('userPublicKey') || null;
  });
  const [balance, setBalance] = useState(() => {
    return parseFloat(localStorage.getItem('balance')) || 0;
  });

  const login = (userData) => {
    if (!userData || !userData.email) return false;

    const nextUser = {
      ...userData,
      email: userData.email,
    };

    setIsLoggedIn(true);
    setUser(nextUser);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(nextUser));

    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
    }

    if (userData.balance !== undefined) {
      setBalance(Number(userData.balance));
      localStorage.setItem('balance', Number(userData.balance));
    }

    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setUserPublicKey(null);
    setBalance(0);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('userPublicKey');
    localStorage.removeItem('balance');
    localStorage.removeItem('authToken');
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
    user,
    userPublicKey,
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