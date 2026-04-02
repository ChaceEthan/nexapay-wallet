import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { connectWallet, disconnectWallet } from '../services/stellar';

const WalletConnect = () => {
  const { userPublicKey, setWalletPublicKey } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    try {
      const publicKey = await connectWallet();
      setWalletPublicKey(publicKey);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setWalletPublicKey(null);
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  if (userPublicKey) {
    const shortAddress = `${userPublicKey.slice(0, 6)}...${userPublicKey.slice(-4)}`;
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-green-400 font-semibold">
            {shortAddress}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default WalletConnect;