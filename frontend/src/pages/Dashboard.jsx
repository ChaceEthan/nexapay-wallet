import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WalletConnect from '../components/WalletConnect';
import Health from '../components/Health';
import DepositComponent from '../components/DepositComponent';
import TransactionComponent from '../components/TransactionComponent';
import SetValue from '../components/SetValue';
import GetValue from '../components/GetValue';
import { Wallet, Send, Download, Settings, History } from 'lucide-react';

const Dashboard = () => {
  const { user, userPublicKey, logout, balance } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  const publicKey = userPublicKey || (user ? user.publicKey : null);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 to-slate-900 text-white flex">
      <aside className="w-72 p-6 bg-slate-900/70 backdrop-blur-lg border-r border-slate-800">
        <img src="/logo.svg" alt="NexaPay Logo" className="w-12 h-12 mb-4" />
        <h2 className="text-2xl font-bold mb-2">NexaPay</h2>
        <p className="text-slate-400 mb-4">Stellar Testnet Wallet</p>

        <div className="space-y-3">
          <p className="text-slate-300 text-sm">User: {user?.email || 'Guest'}</p>
          <p className="text-slate-300 text-sm break-words">Wallet: {publicKey || 'Not connected'}</p>
          <p className="text-slate-300 text-sm">Balance: {balance.toFixed(2)} XLM</p>
        </div>

        <div className="mt-6 space-y-2">
          <button className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 transition">Send</button>
          <button className="w-full py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition">Receive</button>
          {publicKey && (
            <button
              onClick={() => window.open(`https://friendbot.stellar.org/?addr=${publicKey}`, '_blank')}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition"
            >
              Fund Wallet (Testnet)
            </button>
          )}
          <button onClick={logout} className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 transition">
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-2">Wallet Connect</h3>
            <WalletConnect />
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-2">API Health</h3>
            <Health />
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
            <p className="text-slate-300 text-sm">No recent transactions yet. Initiate a send or deposit to get started.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <DepositComponent />
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <TransactionComponent />
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <SetValue />
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <GetValue />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;