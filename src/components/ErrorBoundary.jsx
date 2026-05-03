import React from 'react';
import { AlertTriangle, RefreshCcw, ShieldAlert, Zap } from 'lucide-react';

/**
 * ErrorBoundary - Institutional Resilience Hub
 * - Prevents global crashes by isolating component-level failures
 * - Provides high-fidelity recovery paths and state resets
 * - Features deep logging for rapid debugging
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isStorageError: false 
    };
  }

  static getDerivedStateFromError(error) {
    const isStorageError = error.message?.includes("Unexpected token") || 
                           error.message?.includes("JSON") ||
                           error.message?.includes("storage") ||
                           error.message?.includes("quota");
    return { hasError: true, isStorageError, error };
  }

  componentDidCatch(error, errorInfo) {
    console.group("🛡️ NEXAPAY VIRTUAL GUARD");
    console.error("Component Crash Detected:", error);
    console.error("Trace:", errorInfo.componentStack);
    console.groupEnd();
    this.setState({ errorInfo });
  }

  handleSoftReset = () => {
    localStorage.removeItem("nexa_app_locked");
    localStorage.removeItem("nexa_market_cache");
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Soft retry: Try to re-render. If it fails again, the user can then reload.
  };

  handleReload = () => {
    window.location.reload();
  };

  handleHardReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const isMini = this.props.mini;

      // 🤏 MINI ERROR UI (For sidebars, cards, etc.)
      if (isMini) {
        return (
          <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[150px] animate-in fade-in">
            <AlertTriangle size={32} className="text-rose-500" />
            <div>
              <p className="text-white font-black text-xs uppercase tracking-widest">Module Failure</p>
              <p className="text-gray-500 text-[10px] font-bold mt-1">Component isolated safely</p>
            </div>
            <button 
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all active:scale-95"
            >
              <RefreshCcw size={12} /> Retry
            </button>
          </div>
        );
      }

      // 🏛️ FULL-SCREEN RESILIENCE UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] text-white p-8">
          <div className="max-w-xl w-full space-y-10">
            {/* BRAND HUB */}
            <div className="flex items-center gap-4 mb-10 opacity-40">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                 <span className="text-black font-black">N</span>
              </div>
              <span className="text-xl font-black tracking-tighter">NexaPay Resilience</span>
            </div>

            <div className="bg-[#1e2329] border border-white/5 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5">
                 <ShieldAlert size={160} />
               </div>

               <div className="relative z-10 space-y-8">
                  <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center border border-amber-500/20 shadow-xl shadow-amber-500/5">
                    <Zap size={40} className="text-amber-400" />
                  </div>

                  <div>
                    <h1 className="text-4xl font-black tracking-tight mb-4">Vault Engine Interrupted</h1>
                    <p className="text-gray-400 font-medium leading-relaxed max-w-sm">
                      A component encountered a runtime exception. Your assets remain secure in the local vault.
                    </p>
                  </div>

                  <div className="space-y-4 pt-6">
                    <button 
                      onClick={this.handleReload}
                      className="w-full py-5 bg-cyan-500 hover:bg-cyan-600 text-black font-black rounded-2xl transition-all shadow-xl shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      <RefreshCcw size={20} /> RESTORE SESSION
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <button 
                         onClick={this.handleSoftReset}
                         className="py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-white/10 transition-all"
                       >
                         Soft Reset
                       </button>
                       <button 
                         onClick={this.handleHardReset}
                         className="py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-rose-500/20 transition-all"
                       >
                         Hard Reset
                       </button>
                    </div>
                  </div>
               </div>
            </div>

            <div className="px-8 text-center">
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Institutional Resilience Protocol v4.1.0 — Secure Failover Active</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
