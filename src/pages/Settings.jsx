import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Shield, 
  Copy, 
  Trash2,
  Wallet,
  RefreshCcw,
  KeyRound,
  Eye,
  AlertTriangle,
  Lock,
  Globe,
  LogOut,
  ChevronRight,
  ExternalLink,
  Volume2,
  Activity
} from "lucide-react";
import BackButton from "../components/BackButton";
import { showToast } from "../toastSlice.js";
import { playFeedback } from "../utils/feedback";

import { lockWallet, setUnlocked, setNetwork } from "../authSlice.js";
import { updateNetworkConfig } from "../services/stellar";
import { secureDecryptVault } from "../services/secureVault";
import { verifyWalletIntegrity } from "../utils/WalletHealthMonitor";
import { executeSecurely } from "../utils/safeAction";
import { deleteWallet, disconnectWallet, toggleAutoRefresh, toggleFeedback, setFeedbackVolume, setFeedbackPreset, updateBackupCheckup } from "../walletSlice.js";

export default function Settings() {
  const dispatch = useDispatch(); 
  const navigate = useNavigate();

  const { wallets, activeWalletId, address, balance, walletType, autoRefreshEnabled, feedbackEnabled, feedbackVolume, feedbackPreset } = useSelector((state) => state.wallet || {});
  const { network: currentNetwork } = useSelector((state) => state.auth || { network: 'testnet' });
  
  const activeWallet = wallets?.find(w => w.id === activeWalletId);
  const lastCheckup = activeWallet?.lastBackupCheckup;

  // 🛡️ HEALTH SCORE CALCULATION
  const healthScore = (() => {
    if (!activeWallet || !lastCheckup) return 0;
    const sixMonths = 180 * 24 * 60 * 60 * 1000; // ~180 days
    const age = Date.now() - lastCheckup;
    if (age <= sixMonths) return 100;
    const overdueMonths = Math.floor((age - sixMonths) / (30 * 24 * 60 * 60 * 1000));
    return Math.max(0, 100 - (overdueMonths + 1) * 10);
  })();
  
  const [showPhraseModal, setShowPhraseModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [pendingNetwork, setPendingNetwork] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);

  // SECURE ISOLATION: Mnemonic is NOT in React State
  const transientPhrase = useRef(null);
  const [, forceUpdate] = useState({});

  const showMsg = (msg) => dispatch(showToast({ message: msg }));

  const closePhraseModal = () => {
    transientPhrase.current = null;
    setPinInput("");
    setPinError("");
    setShowPhraseModal(false);
    setTimeLeft(0);
  };

  // ACTIONS
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    setHealthStatus(verifyWalletIntegrity());
  }, []);

  // 🔔 HEALTH NOTIFICATION ENGINE
  useEffect(() => {
    if (healthScore < 80) {
      dispatch(showToast({ 
        message: `Security Warning: Wallet health is low (${healthScore}/100). Please check your backup.`, 
        type: "error" 
      }));
    }
  }, [healthScore, dispatch]);

  // ACTIONS
  const handleLock = () => {
    // Industry standard: Locking simply revokes session access, doesn't destroy data
    dispatch(setUnlocked(false));
    dispatch(showToast({ message: "Wallet Locked" }));
    navigate("/unlock-wallet");
  };

  const handleCreateNew = () => {
    navigate("/create-wallet");
  };

  const handleDisconnect = () => {
    const isFreighter = walletType === "FREIGHTER";
    const message = isFreighter
      ? "Disconnect Freighter session? Your wallet data stays safe."
      : "Disconnect this session? Your keys remain saved on this device.";

    if (!window.confirm(message)) return;

    // ✅ DISCONNECT: Clear session only
    dispatch(disconnectWallet());
    
    // Redirect to Vault Selector Hub
    navigate("/vaults", { replace: true });
  };


  const loadingTimeout = useRef(null);

  const startLoading = () => {
    setLoading(true);
    if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    loadingTimeout.current = setTimeout(() => setLoading(false), 15000); // 15s safety
  };

  const handleReveal = () => { 
    if (Date.now() < lockoutUntil) {
      setPinError(`Too many attempts. Lockout active.`);
      return;
    }

    const payload = localStorage.getItem(`nexa_mnemonic_enc_${activeWalletId}`);
    if (!payload) return setPinError("No recovery phrase found for this specific wallet on this device.");

    startLoading();

    // 🔥 FIX: PBKDF2 is heavy. Wrap in setTimeout to allow Spinner to render
    setTimeout(() => {
      try {
        const success = secureDecryptVault(
          payload, 
          pinInput, 
          { isModalOpen: showPhraseModal, isAuthenticated: !!address },
          (decrypted) => {
            transientPhrase.current = decrypted;
            setFailedAttempts(0);
            setPinError("");
            setTimeLeft(15);
            setLoading(false);
            forceUpdate({}); 
            dispatch(updateBackupCheckup(activeWalletId));
            return true;
          }
        );

        if (!success) {
          const attempts = failedAttempts + 1;
          setLoading(false);
          if (attempts >= 5) {
            setLockoutUntil(Date.now() + 5 * 60 * 1000);
            setFailedAttempts(0);
            setPinError("Wallet locked for 5 minutes.");
          } else {
            setFailedAttempts(attempts);
            setPinError(`Incorrect PIN. ${5 - attempts} attempts left.`);
          }
        }
      } catch (err) {
        setLoading(false);
        setPinError("System error during decryption.");
      }
    }, 150);
  };

  const handleNetworkChange = (network) => {
    if (network === 'public' && currentNetwork !== 'public') {
      setPendingNetwork('public');
    } else {
      confirmNetworkChange(network);
    }
  };

  const confirmNetworkChange = (network) => {
    dispatch(setNetwork(network));
    updateNetworkConfig(network);
    showMsg(`Network switched to ${network.toUpperCase()}`);
    setPendingNetwork(null);
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const id = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(id);
    } else if (timeLeft === 0 && transientPhrase.current) {
      closePhraseModal();
    }
  }, [timeLeft]);

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <div className="p-4"><BackButton /></div>

      {/* PUBLIC NETWORK WARNING MODAL */}
      {pendingNetwork && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#1e2329] border border-amber-500/50 rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
            <div className="bg-amber-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe size={40} className="text-amber-500" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-white">Switch to Mainnet?</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              You are about to switch to the <b>Stellar Public Network</b>. Transactions will involve <b>real assets</b> and cannot be reversed.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => confirmNetworkChange('public')} 
                className="w-full py-4 bg-amber-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-colors"
              >
                I Understand, Switch Now
              </button>
              <button 
                onClick={() => setPendingNetwork(null)} 
                className="w-full py-4 bg-[#2b3139] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#363c44] transition-colors text-gray-400"
              >
                Stay on Testnet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECOVERY PHRASE MODAL */}
      {showPhraseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-[#1e2329] border border-red-500/30 rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={closePhraseModal} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">✕</button>
            
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="bg-red-500/10 p-5 rounded-full mb-4 shadow-inner"><AlertTriangle className="text-red-500" size={32} /></div>
              <h2 className="text-2xl font-bold text-red-400">Security Warning</h2>
              <p className="text-gray-400 text-sm mt-3 px-4">Your recovery phrase gives full access to your funds. NEVER share it with anyone.</p>
            </div>

            {!transientPhrase.current ? (
              <div className="space-y-6">
                <div className="relative">
                   <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit PIN"
                    className="w-full p-5 bg-black border border-gray-700 rounded-2xl text-center text-2xl tracking-[0.5em] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:tracking-normal placeholder:text-gray-600"
                    autoFocus
                  />
                </div>
                {pinError && <p className="text-red-400 text-sm text-center font-medium animate-pulse">{pinError}</p>}
                <button
                  onClick={handleReveal}
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold p-5 rounded-2xl transition-all flex justify-center items-center gap-3 shadow-lg shadow-cyan-500/20"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <Eye size={22} />
                  )}
                  {loading ? "Verifying PIN..." : "Reveal Phrase"}
                </button>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div className="bg-black p-6 rounded-2xl border border-gray-700 font-mono text-center text-lg leading-relaxed break-words select-none shadow-inner text-cyan-500">
                  {transientPhrase.current}
                </div>
                <div className="flex items-center justify-between px-2">
                  <span className="text-red-400 text-xs font-bold animate-pulse flex items-center gap-2">
                    <Lock size={14}/> Clearing in {timeLeft}s
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(transientPhrase.current);
                      showMsg("Securely Copied to Clipboard");
                    }}
                    className="text-cyan-400 text-sm font-bold hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/30"
                  >
                    Copy Phrase
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="p-6 md:p-12 md:max-w-5xl mx-auto min-h-screen">
        <header className="mb-12">
          <h1 className="text-3xl font-black mb-3 flex items-center gap-4">
            <div className="bg-cyan-500/10 p-3 rounded-2xl"><Shield className="text-cyan-400" size={32} /></div>
            Settings
          </h1>
          <p className="text-gray-400 font-medium">Manage your security, wallet sessions and app preferences.</p>
          
          {/* WALLET ADDRESS & TYPE */}
          {address && (
            <div className="mt-8 bg-[#1e2329] p-6 rounded-2xl border border-gray-800 shadow-xl">
              <h3 className="font-bold text-lg mb-3">Current Wallet</h3>
              <div className="flex items-center justify-between bg-black p-4 rounded-xl border border-gray-700">
                <div className="flex flex-col">
                  <p className="text-lg font-black text-cyan-400 mb-1">{parseFloat(balance).toFixed(2)} XLM</p>
                  <p className="font-mono text-sm text-gray-300 break-all">{address.substring(0, 10)}...{address.substring(address.length - 10)}</p>
                  <p className="text-xs text-gray-500 uppercase font-bold mt-1">{walletType}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      window.open(`https://stellar.expert/explorer/${currentNetwork}/account/${address}`, "_blank");
                    }}
                    className="bg-purple-500/10 text-purple-400 p-2 rounded-lg hover:bg-purple-500/20 transition-colors"
                    title="View on Stellar.Expert"
                  >
                    <ExternalLink size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      showMsg("Address Copied!");
                    }}
                    className="bg-cyan-500/10 text-cyan-400 p-2 rounded-lg hover:bg-cyan-500/20 transition-colors"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM HEALTH STATUS */}
          <div className="mt-8 flex flex-wrap gap-3"> {/* Adjusted margin-top */}
             {/* VAULT STATUS */}
             <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-[#1e2329] 
                ${healthStatus?.status === 'VALID' ? "border-green-500/30 text-green-400" : 
                  healthStatus?.status === 'CORRUPTED' ? "border-red-500/30 text-red-500" : 
                  "border-gray-500/30 text-gray-400"}`}>
                <div className={`w-2 h-2 rounded-full 
                   ${healthStatus?.status === 'VALID' ? "bg-green-500 animate-pulse" : 
                     healthStatus?.status === 'CORRUPTED' ? "bg-red-500" : 
                     "bg-gray-500"}`} />
                Vault: {healthStatus?.status === 'VALID' ? "SECURE" : healthStatus?.status === 'CORRUPTED' ? "CORRUPTED" : "EMPTY"}
             </div>

             {/* HEALTH SCORE */}
             <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-[#1e2329] 
                ${healthScore >= 90 ? "border-green-500/30 text-green-400" : 
                  healthScore >= 60 ? "border-amber-500/30 text-amber-500" : 
                  "border-red-500/30 text-red-500"}`}>
                <Activity size={14} />
                Score: {healthScore}/100
             </div>
             
             {/* SESSION STATUS */}
             <div className="px-4 py-2 rounded-xl border border-blue-500/30 text-blue-400 bg-[#1e2329] flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Session: {address && activeWalletId ? "ACTIVE" : "GUEST"}
             </div>
             
             {/* ENCRYPTION STATUS */}
             <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-[#1e2329] 
                ${healthStatus?.hasMnemonic ? "border-cyan-500/30 text-cyan-400" : "border-gray-500/30 text-gray-500"}`}>
                <div className={`w-2 h-2 rounded-full ${healthStatus?.hasMnemonic ? "bg-cyan-500" : "bg-gray-500"}`} />
                Encryption: {healthStatus?.hasMnemonic ? "ENCRYPTED" : "NONE"}
             </div>
          </div>
        </header>

        <div className="grid gap-6">
          {/* WALLET MANAGEMENT SECTION */}
          <section className="bg-[#1e2329] p-2 rounded-[2rem] border border-gray-800 shadow-xl">
             <div className="p-6 flex justify-between items-center group cursor-pointer" onClick={() => navigate("/select-wallet")}>
                <div className="flex items-center gap-5">
                  <div className="bg-cyan-500/10 p-4 rounded-2xl group-hover:bg-cyan-500/20 transition-colors">
                    <Wallet size={24} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Manage Wallets</h3>
                    <p className="text-gray-400 text-sm">View, rename, or switch between your vaults.</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
             </div>
          </section>

          {/* NETWORK CONFIGURATION SECTION */}
          <section className="bg-[#1e2329] p-2 rounded-[2rem] border border-gray-800 shadow-xl">
             <div className="p-6">
                <div className="flex items-center gap-5 mb-6">
                  <div className="bg-emerald-500/10 p-4 rounded-2xl">
                    <Globe size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Stellar Network</h3>
                    <p className="text-gray-400 text-sm">Switch between Testnet and Public (Mainnet).</p>
                  </div>
                </div>
                
                <div className="flex gap-3 bg-black/40 p-2 rounded-2xl border border-gray-800">
                  {['testnet', 'public'].map((net) => (
                    <button
                      key={net}
                      onClick={() => handleNetworkChange(net)}
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                        currentNetwork === net 
                          ? 'bg-emerald-500 text-black shadow-lg' 
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
             </div>
          </section>

          {/* SECURITY SECTION */}
          <section className="bg-[#1e2329] p-2 rounded-[2rem] border border-gray-800 shadow-xl">
             <div className="p-6 flex justify-between items-center group cursor-pointer" onClick={() => setShowPhraseModal(true)}>
                <div className="flex items-center gap-5">
                  <div className="bg-[#2b3139] p-4 rounded-2xl group-hover:bg-cyan-500/10 transition-colors"><KeyRound size={24} className="text-cyan-400" /></div>
                  <div>
                    <h3 className="font-bold text-lg">Recovery Phrase</h3>
                    <p className="text-gray-400 text-sm">Backup or view your 12-word seed phrase.</p>
                    {activeWallet && (
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${healthScore >= 90 ? 'text-cyan-500/60' : healthScore >= 60 ? 'text-amber-500' : 'text-red-400'}`}>
                        {lastCheckup ? `Last Checkup: ${new Date(lastCheckup).toLocaleDateString()}` : "Backup never verified"}
                        {healthScore < 100 && lastCheckup && ` • Health: ${healthScore}%`}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
             </div>
          </section>

          {/* WALLET ACTIONS SECTION */}
          <section className="bg-[#1e2329] p-2 rounded-[2rem] border border-gray-800 shadow-xl space-y-1">
             <button 
               onClick={handleCreateNew}
               className="w-full text-left p-6 hover:bg-[#2b3139] rounded-[1.5rem] transition-all flex justify-between items-center group"
             >
                <div className="flex items-center gap-5">
                  <div className="bg-blue-500/10 p-4 rounded-2xl group-hover:bg-blue-500/20"><RefreshCcw className="text-blue-400" size={24} /></div>
                  <div>
                    <h3 className="font-bold text-lg">Create New Wallet</h3>
                    <p className="text-gray-400 text-sm">Replace current wallet with a new one.</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-blue-400" />
             </button>

             <button 
               onClick={handleDisconnect}
               className="w-full text-left p-6 hover:bg-red-500/5 rounded-[1.5rem] transition-all flex justify-between items-center group"
             >
                <div className="flex items-center gap-5">
                  <div className="bg-red-500/10 p-4 rounded-2xl group-hover:bg-red-500/20"><Trash2 className="text-red-500" size={24} /></div>
                  <div>
                  <h3 className="font-bold text-lg text-red-400">
                    {walletType === "FREIGHTER" ? "Disconnect Freighter" : "Disconnect Wallet"}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {walletType === "FREIGHTER" ? "Remove this external session." : "Remove wallet data from this device."}
                  </p>
                  </div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-red-500" />
             </button>
          </section>

          {/* PREFERENCES SECTION */}
          <section className="bg-[#1e2329] p-2 rounded-[2rem] border border-gray-800 shadow-xl">
             <div className="p-6 flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="bg-cyan-500/10 p-4 rounded-2xl"><RefreshCcw size={24} className="text-cyan-400" /></div>
                  <div>
                    <h3 className="font-bold text-lg">Auto-Refresh Balance</h3>
                    <p className="text-gray-400 text-sm">Automatically update XLM balance every 30s.</p>
                  </div>
                </div>
                <button 
                  onClick={() => dispatch(toggleAutoRefresh())}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${autoRefreshEnabled ? 'bg-cyan-500' : 'bg-gray-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${autoRefreshEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
             </div>
          </section>

          {/* FEEDBACK SECTION */}
          <section className="bg-[#1e2329] p-2 rounded-[2rem] border border-gray-800 shadow-xl">
             <div className="p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-5">
                    <div className="bg-cyan-500/10 p-4 rounded-2xl"><Volume2 size={24} className="text-cyan-400" /></div>
                    <div>
                      <h3 className="font-bold text-lg">Haptic & Audio Feedback</h3>
                      <p className="text-gray-400 text-sm">Play a subtle sound and vibration on interactions.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => dispatch(toggleFeedback())}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${feedbackEnabled ? 'bg-cyan-500' : 'bg-gray-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${feedbackEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {feedbackEnabled && (
                  <div className="flex flex-col gap-6 px-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest w-16">Volume</span>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={feedbackVolume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        dispatch(setFeedbackVolume(val));
                        playFeedback();
                      }}
                      className="flex-1 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <span className="text-xs text-cyan-400 font-mono w-10 text-right">
                      {Math.round(feedbackVolume * 100)}%
                    </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-widest w-16">Preset</span>
                      <div className="flex-1 flex gap-2">
                        {['modern', 'retro', 'soft'].map((p) => (
                          <button
                            key={p}
                            onClick={() => {
                              dispatch(setFeedbackPreset(p));
                              setTimeout(() => playFeedback(), 50); // Play preview
                            }}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                              feedbackPreset === p ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-black/40 border-gray-800 text-gray-500 hover:border-gray-700'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
             </div>
          </section>

          {/* DANGER ZONE */}
          <section className="mt-8 pt-8 border-t border-gray-800">
            <button 
              onClick={handleLock}
              className="w-full flex items-center justify-center gap-3 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-500/20"
            >
              <Lock size={24} />
              LOCK NEXAPAY WALLET
            </button>
            <p className="text-center text-gray-500 text-xs mt-4 uppercase tracking-widest font-bold font-mono">
              Secures your session & hides assets until PIN reentry
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}