import { useAuth } from '../context/AuthContext';
import WalletConnect from '../components/WalletConnect';
import Health from '../components/Health';
import DepositComponent from '../components/DepositComponent';
import TransactionComponent from '../components/TransactionComponent';
import SetValue from '../components/SetValue';
import GetValue from '../components/GetValue';
import { Wallet, Send, Download, Settings, History } from 'lucide-react';

const Dashboard = () => {
  const { userEmail, logout, balance } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-6">
      <div className="w-full">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <img src="/logo.svg" alt="NexaPay Logo" className="w-10 h-10" />
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">NexaPay Dashboard</h1>
              {userEmail && <p className="text-slate-400">Welcome back, {userEmail}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <WalletConnect />
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-slate-900 rounded-2xl shadow-lg p-6 border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Wallet className="w-6 h-6 mr-2" />
              Wallet Balance
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">XLM</span>
                </div>
                <div>
                  <p className="text-slate-300 text-sm">Stellar Lumens</p>
                  <p className="text-white text-lg font-semibold">{balance.toFixed(2)} XLM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">≈ ${(balance * 0.1).toFixed(2)} USD</p>
                {userPublicKey && (
                  <button
                    onClick={() => window.open(`https://friendbot.stellar.org/?addr=${userPublicKey}`, '_blank')}
                    className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition"
                  >
                    Fund Wallet (Testnet)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Health />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 rounded-2xl shadow-lg p-6 border border-slate-800 hover:border-purple-700 transition">
            <div className="flex items-center mb-4">
              <Download className="w-5 h-5 text-purple-400 mr-2" />
              <DepositComponent />
            </div>
          </div>
          <div className="bg-slate-900 rounded-2xl shadow-lg p-6 border border-slate-800 hover:border-purple-700 transition">
            <div className="flex items-center mb-4">
              <Send className="w-5 h-5 text-purple-400 mr-2" />
              <TransactionComponent />
            </div>
          </div>
          <div className="bg-slate-900 rounded-2xl shadow-lg p-6 border border-slate-800 hover:border-purple-700 transition">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 text-purple-400 mr-2" />
              <SetValue />
            </div>
          </div>
          <div className="bg-slate-900 rounded-2xl shadow-lg p-6 border border-slate-800 hover:border-purple-700 transition">
            <div className="flex items-center mb-4">
              <History className="w-5 h-5 text-purple-400 mr-2" />
              <GetValue />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;