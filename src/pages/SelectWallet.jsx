import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  Wallet, 
  Plus, 
  Download, 
  ChevronRight, 
  ShieldCheck,
  SearchX,
  MoreVertical,
  Activity,
  Edit3,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";
import { setActiveWallet, deleteWallet } from "@/walletSlice";
import GlobalBackButton from "@/components/GlobalBackButton";

/**
 * SelectWallet
 * Mandatory multi-wallet selection layer.
 * Lists all stored vaults and allows adding new ones.
 */
export default function SelectWallet() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const wallets = useSelector((s) => s.wallet?.wallets || []);

  // UI State
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renameWallet, setRenameWallet] = useState(null);
  const [deleteWalletConfirm, setDeleteWalletConfirm] = useState(null);
  const [newName, setNewName] = useState("");
  
  const toggleMenu = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const startRename = (wallet, e) => {
    e.stopPropagation();
    setRenameWallet(wallet);
    setNewName(wallet.name || "");
    setMenuOpenId(null);
  };

  const confirmDelete = (wallet, e) => {
    e.stopPropagation();
    setDeleteWalletConfirm(wallet);
    setMenuOpenId(null);
  };

  const handleFinalDelete = () => {
    dispatch(deleteWallet(deleteWalletConfirm.id));
    setDeleteWalletConfirm(null);
  };

  const handleFinalRename = () => {
    const existing = JSON.parse(localStorage.getItem("nexa_wallets") || "[]");
    const updated = existing.map(w => w.id === renameWallet.id ? { ...w, name: newName.trim() } : w);
    localStorage.setItem("nexa_wallets", JSON.stringify(updated));
    setRenameWallet(null);
    window.location.reload(); // Refresh to sync Redux with new LocalStorage state
  };

  const handleSelect = (walletId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    dispatch(setActiveWallet(walletId));
    navigate("/unlock-wallet");
    // App.jsx will automatically transition to RULE 4: Wallet Unlock
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <header className="mb-12 text-center">
          <div className="inline-flex p-4 bg-cyan-500/10 rounded-3xl mb-6 shadow-glow">
            <Wallet className="text-cyan-400" size={42} />
          </div>
          <h1 className="text-4xl font-black mb-3">Select Wallet</h1>
          <p className="text-gray-400 font-medium">Choose an active vault to begin your session.</p>
        </header>

        {/* WALLET LIST */}
        <div className="space-y-4 mb-10">
          {wallets.length > 0 ? (
            wallets.map((w) => (
              <div 
                key={w.id}
                onClick={(e) => handleSelect(w.id, e)}
                className="group relative bg-[#1e2329] border border-[#2b3139] hover:border-cyan-500/50 rounded-[2rem] p-6 cursor-pointer transition-all active:scale-[0.98] shadow-xl overflow-hidden"
              >
                <button 
                  onClick={(e) => toggleMenu(w.id, e)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-black/20 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <MoreVertical size={20} className="text-gray-400 hover:text-white" />
                </button>
                
                {/* DROPDOWN MENU */}
                {menuOpenId === w.id && (
                  <div className="absolute right-4 top-14 z-20 w-36 bg-[#181a20] border border-[#2b3139] rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200">
                    <button 
                      onClick={(e) => startRename(w, e)}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-[#2b3139] flex items-center gap-2 transition-colors"
                    >
                      <Edit3 size={14} className="text-blue-400" /> Rename Vault
                    </button>
                    <button 
                      onClick={(e) => confirmDelete(w, e)}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-400 hover:bg-[#2b3139] flex items-center gap-2 transition-colors border-t border-gray-800/50"
                    >
                      <Trash2 size={14} /> Delete Vault
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <div className="bg-cyan-500/10 p-5 rounded-2xl group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                    <ShieldCheck size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold truncate">{w.name || "Default Wallet"}</h3>
                    <div className="flex items-center gap-3 mt-1 font-mono text-sm text-gray-500">
                      <span className="truncate">{w.address.substring(0, 8)}...{w.address.slice(-8)}</span>
                      <span className="px-2 py-0.5 bg-black/50 rounded-lg text-[10px] uppercase font-black tracking-widest text-cyan-500">
                        {w.walletType || "INTERNAL"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-600 group-hover:text-cyan-400 transition-all translate-x-0 group-hover:translate-x-1" />
                </div>

                {/* ACTIVITY INDICATOR */}
                <div className="mt-4 pt-4 border-t border-gray-800/50 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-600">
                  <div className="flex items-center gap-2">
                    <Activity size={12} className="text-green-500" />
                    Vault Healthy
                  </div>
                  <span>Last active: Recently</span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-[#1e2329]/50 border-2 border-dashed border-[#2b3139] rounded-[2.5rem] p-12 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-[#0b0e11] p-6 rounded-full mb-6 border border-[#2b3139]">
                <SearchX size={48} className="text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Wallets Found</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
                It looks like you don't have any vaults saved on this device. Create a new one or import an existing recovery phrase to get started.
              </p>
            </div>
          )}
        </div>

        {/* ACTION GRID */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate("/create-wallet");
            }}
            className="flex flex-col items-center justify-center p-8 bg-[#1e2329] border border-[#2b3139] hover:border-blue-500/50 rounded-[2rem] transition-all group active:scale-[0.95]"
          >
            <div className="bg-blue-500/10 p-4 rounded-2xl mb-4 group-hover:bg-blue-500 group-hover:text-black transition-colors">
              <Plus size={24} />
            </div>
            <span className="font-bold">Create New</span>
          </button>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate("/import-wallet");
            }}
            className="flex flex-col items-center justify-center p-8 bg-[#1e2329] border border-[#2b3139] hover:border-purple-500/50 rounded-[2rem] transition-all group active:scale-[0.95]"
          >
            <div className="bg-purple-500/10 p-4 rounded-2xl mb-4 group-hover:bg-purple-500 group-hover:text-black transition-colors">
              <Download size={24} />
            </div>
            <span className="font-bold">Import Existing</span>
          </button>
        </div>

        <footer className="mt-12 text-center">
          <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.3em]">
            NexaPay Cryptographic Selection Layer
          </p>
        </footer>
      </div>

      {/* RENAME MODAL */}
      {renameWallet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e2329] w-full max-w-sm rounded-[2.5rem] border border-[#2b3139] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">Rename Vault</h3>
              <button onClick={() => setRenameWallet(null)} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>
            <input 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-4 bg-black border border-gray-800 rounded-2xl mb-6 outline-none focus:border-cyan-500/50 transition-all font-bold text-white"
              placeholder="Enter new name"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setRenameWallet(null)} className="flex-1 py-4 bg-[#2b3139] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#363c44] transition-colors">Cancel</button>
              <button onClick={handleFinalRename} className="flex-1 py-4 bg-cyan-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-colors">Save Name</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteWalletConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e2329] w-full max-w-sm rounded-[2.5rem] border border-[#2b3139] p-8 shadow-2xl text-center">
            <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black mb-2 text-white">Delete Vault?</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Are you sure you want to delete <b>{deleteWalletConfirm.name}</b>? This action cannot be undone. Ensure you have your recovery phrase.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleFinalDelete} 
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors"
              >
                Yes, Delete Vault
              </button>
              <button 
                onClick={() => setDeleteWalletConfirm(null)} 
                className="w-full py-4 bg-[#2b3139] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#363c44] transition-colors text-gray-400"
              >
                Keep Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
