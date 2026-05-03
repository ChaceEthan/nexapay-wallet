import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Menu, Wallet, Check, QrCode } from "lucide-react"; 
import { setScannedRecipient, setActiveWallet } from "../walletSlice";
import NotificationBell from "@/components/NotificationBell";
import QRScanner from "@/components/QRScanner";
import NetworkStatus from "@/components/NetworkStatus";


/**
 * Navbar - Refined Institutional Header
 * - Clean brand identity on left
 * - Consolidated security tools on right
 * - Unified Wallet Switcher & QR Engine placement
 */
export default function Navbar({ setOpen }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { wallets, activeWalletId } = useSelector((state) => state?.wallet || {});
  const activeWallet = wallets?.find(w => w.id === activeWalletId);
  const { network } = useSelector((state) => state?.auth || { network: "testnet" });

  const [isOpen, setIsOpen] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  return (
    <div className="sticky top-0 z-[60] h-16 sm:h-18 bg-[#0b0e11]/95 backdrop-blur-2xl border-b border-white/5 shadow-xl shadow-black/60">
      <div className="h-full flex items-center justify-between gap-3 px-3 sm:px-5 lg:px-6">
      
      {/* MOBILE TRIGGER */}
      <button onClick={() => setOpen(true)} className="md:hidden text-white/70 hover:text-white transition-colors">
        <Menu size={24} />
      </button>

      {/* BRAND HUB (LEFT) */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="font-black text-white text-lg sm:text-xl tracking-tight truncate">NexaPay</h1>
        <span className={`hidden sm:inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-lg ${
          network === 'public' ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-amber-500/30 text-amber-400 bg-amber-500/5'
        }`}>
          {network || "testnet"}
        </span>
      </div>

      {/* TOOLS HUB (RIGHT) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* QR SCANNER */}
        <button 
          onClick={() => setShowQRScanner(true)}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-all shadow-xl active:scale-90"
          title="Secure QR Scanner"
        >
          <QrCode size={20} strokeWidth={2.5} />
        </button>

        {/* WALLET SWITCHER (RELOCATED NEAR QR) */}
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 sm:gap-3 bg-white/5 hover:bg-white/10 px-2.5 sm:px-4 py-2 rounded-xl border border-white/10 transition-all group shadow-xl"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all shadow-inner">
              <Wallet size={18} strokeWidth={2.5} />
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none gap-1">
              <span className="text-white font-black text-xs uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
                {activeWallet?.name || "Vault"}
              </span>
              <span className="text-gray-500 text-[9px] font-mono font-black">
                {activeWallet?.address ? `${activeWallet.address.slice(0, 4)}...${activeWallet.address.slice(-4)}` : "DISC"}
              </span>
            </div>
            <div className={`w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)] ${activeWallet ? 'opacity-100' : 'opacity-0'}`} />
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <div className="absolute top-full right-0 mt-3 w-72 bg-[#181a20] border border-white/5 rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.9)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Vault Manager</span>
                  <span className="text-[10px] font-bold text-cyan-500">{wallets.length} SAVED</span>
                </div>
                <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                  {wallets?.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        if (w.id !== activeWalletId) {
                          dispatch(setActiveWallet(w.id));
                          navigate("/unlock-wallet");
                        }
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all group ${
                        w.id === activeWalletId ? 'bg-cyan-500/5' : ''
                      }`}
                    >
                      <div className="flex flex-col items-start leading-tight">
                        <span className={`text-sm font-black tracking-tight ${w.id === activeWalletId ? 'text-cyan-400' : 'text-white'}`}>
                          {w.name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono mt-1">
                          {w.address?.slice(0, 10)}...
                        </span>
                      </div>
                      {w.id === activeWalletId && <Check size={16} className="text-cyan-400" />}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/vaults");
                  }}
                  className="w-full p-5 border-t border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all text-center"
                >
                  Manage All Vaults
                </button>

              </div>
            </>
          )}
        </div>
        
        {/* NETWORK HEALTH MONITOR */}
        <NetworkStatus />

        {/* NOTIFICATION HUB */}
        <NotificationBell />

      </div>
      </div>

      {/* ✅ QR SCANNER PORTAL */}
      {showQRScanner &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2147483647,
              backgroundColor: "rgba(0,0,0,0.96)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QRScanner
              onClose={() => setShowQRScanner(false)}
              onScan={(scannedAddress) => {
                dispatch(setScannedRecipient(scannedAddress));
                setShowQRScanner(false);
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
