import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  Wallet, 
  Trash2, 
  RotateCcw, 
  ChevronRight, 
  ShieldCheck,
  SearchX,
  MoreVertical,
  Activity,
  Edit3,
  X,
  AlertTriangle,
  Plus,
  History,
  CheckCircle2
} from "lucide-react";
import { 
  setActiveWallet, 
  trashWallet, 
  restoreWallet, 
  permanentlyDeleteWallet,
  renameWallet as renameWalletAction
} from "@/walletSlice";
import GlobalBackButton from "@/components/GlobalBackButton";

/**
 * VaultsPage
 * Full lifecycle management for all cryptographic identities.
 * Supports active vaults and a soft-delete (Trash) system.
 */
export default function VaultsPage() {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const wallets = useSelector((s) => s.wallet?.wallets || []);
  const deletedWallets = useSelector((s) => s.wallet?.deletedWallets || []);
  const activeWalletId = useSelector((s) => s.wallet?.activeWalletId);

  // UI State
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renameWallet, setRenameWallet] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [permanentlyDeleteConfirm, setPermanentlyDeleteConfirm] = useState(null);
  const [newName, setNewName] = useState("");
  
  const toggleMenu = (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const startRename = (wallet, e) => {
    e.stopPropagation();
    setRenameWallet(wallet);
    setNewName(wallet.name || "");
    setMenuOpenId(null);
  };

  const handleFinalRename = () => {
    if (!newName.trim()) return;
    dispatch(renameWalletAction({ id: renameWallet.id, name: newName.trim() }));
    setRenameWallet(null);
  };

  const handleTrash = (walletId, e) => {
    if (e) e.stopPropagation();
    dispatch(trashWallet(walletId));
    setDeleteConfirm(null);
    setMenuOpenId(null);
  };

  const handleRestore = (walletId, e) => {
    if (e) e.stopPropagation();
    dispatch(restoreWallet(walletId));
  };

  const handlePermanentDelete = (walletId, e) => {
    if (e) e.stopPropagation();
    dispatch(permanentlyDeleteWallet(walletId));
    setPermanentlyDeleteConfirm(null);
  };

  const handleSelect = (walletId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    dispatch(setActiveWallet(walletId));
    navigate("/unlock-wallet");
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <div className="inline-flex p-3 bg-cyan-500/10 rounded-2xl mb-4">
                <ShieldCheck className="text-cyan-400" size={28} />
             </div>
             <h1 className="text-4xl font-black tracking-tight">Vault Infrastructure</h1>
             <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Manage lifecycle of all cryptographic identities</p>
          </div>
          <button 
            onClick={() => navigate("/create-wallet")}
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-xl shadow-white/5 active:scale-95"
          >
            <Plus size={16} /> New Identity
          </button>
        </header>

        {/* ACTIVE VAULTS */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black uppercase tracking-widest text-gray-400 flex items-center gap-3">
               <CheckCircle2 size={18} className="text-cyan-500" /> Active Registry
            </h2>
            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 rounded-full text-[10px] font-black border border-cyan-500/20">
               {wallets.length} SECURED
            </span>
          </div>

          {wallets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wallets.map((w) => (
                <div 
                  key={w.id}
                  onClick={(e) => handleSelect(w.id, e)}
                  className={`group relative bg-[#1e2329] border ${activeWalletId === w.id ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.05)]' : 'border-white/5'} hover:border-cyan-500/30 rounded-[2rem] p-6 cursor-pointer transition-all active:scale-[0.98] overflow-hidden`}
                >
                   {activeWalletId === w.id && (
                     <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500 text-black text-[8px] font-black uppercase tracking-widest rounded-bl-xl">
                        Active Session
                     </div>
                   )}

                  <button 
                    onClick={(e) => toggleMenu(w.id, e)}
                    className="absolute bottom-6 right-6 z-10 p-2 rounded-full hover:bg-black/20 text-gray-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {/* DROPDOWN MENU */}
                  {menuOpenId === w.id && (
                    <div className="absolute right-6 bottom-16 z-20 w-44 bg-[#181a20] border border-white/10 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        onClick={(e) => startRename(w, e)}
                        className="w-full px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-widest hover:bg-[#2b3139] flex items-center gap-3 transition-colors"
                      >
                        <Edit3 size={14} className="text-blue-400" /> Rename
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(w); setMenuOpenId(null); }}
                        className="w-full px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-[#2b3139] flex items-center gap-3 transition-colors border-t border-white/5"
                      >
                        <Trash2 size={14} /> Trash Identity
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-2xl ${activeWalletId === w.id ? 'bg-cyan-500 text-black' : 'bg-black/40 text-gray-500 group-hover:text-cyan-400 transition-colors'}`}>
                      <Wallet size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black truncate">{w.name || "Default Vault"}</h3>
                      <p className="font-mono text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{w.walletType || "INTERNAL"}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 font-mono text-[11px] text-gray-500 bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="truncate">{w.address}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Activity size={10} className="text-green-500" />
                      Protocol Healthy
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#1e2329]/30 border-2 border-dashed border-white/5 rounded-[3rem] p-16 text-center">
              <SearchX size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">No active vaults found</p>
            </div>
          )}
        </section>

        {/* TRASHED VAULTS */}
        {deletedWallets.length > 0 && (
          <section className="animate-in slide-in-from-bottom-8 duration-700">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-black uppercase tracking-widest text-gray-600 flex items-center gap-3">
                   <History size={18} /> Identity Trash
                </h2>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Soft-Deleted Vaults</span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60 hover:opacity-100 transition-opacity">
                {deletedWallets.map((w) => (
                  <div key={w.id} className="bg-[#1e2329]/50 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group border-dashed">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
                           <Trash2 size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h3 className="text-sm font-black text-gray-400 line-through truncate">{w.name}</h3>
                           <p className="text-[10px] font-mono text-gray-600 truncate">{w.address.slice(0, 16)}...</p>
                        </div>
                     </div>

                     <div className="flex gap-2">
                        <button 
                          onClick={(e) => handleRestore(w.id, e)}
                          className="flex-1 py-2.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                           <RotateCcw size={12} /> Restore
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPermanentlyDeleteConfirm(w); }}
                          className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                        >
                           <X size={14} />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}

        <footer className="mt-16 pt-8 border-t border-white/5 text-center">
           <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.4em]">NexaPay Identity Lifecycle Infrastructure</p>
        </footer>
      </div>

      {/* RENAME MODAL */}
      {renameWallet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1e2329] w-full max-w-sm rounded-[2.5rem] border border-white/10 p-10 shadow-2xl">
            <h3 className="text-xl font-black mb-6">Rename Identity</h3>
            <input 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-4 bg-black border border-white/10 rounded-2xl mb-8 outline-none focus:border-cyan-500 transition-all font-black text-white text-center"
              placeholder="Identity Name"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setRenameWallet(null)} className="flex-1 py-4 bg-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={handleFinalRename} className="flex-1 py-4 bg-cyan-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* TRASH CONFIRMATION */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1e2329] w-full max-w-sm rounded-[2.5rem] border border-white/10 p-10 shadow-2xl text-center">
            <div className="bg-amber-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
              <AlertTriangle size={32} className="text-amber-500" />
            </div>
            <h3 className="text-xl font-black mb-2">Trash Identity?</h3>
            <p className="text-gray-500 text-[11px] font-bold mb-8 leading-relaxed">
              Moving <b>{deleteConfirm.name}</b> to trash will disconnect it from active sessions. You can restore it later from the trash section.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={(e) => handleTrash(deleteConfirm.id, e)} 
                className="w-full py-4 bg-amber-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-colors"
              >
                Move to Trash
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="w-full py-4 bg-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors text-gray-500"
              >
                Keep Active
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE CONFIRMATION */}
      {permanentlyDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1e2329] w-full max-w-sm rounded-[2.5rem] border border-white/10 p-10 shadow-2xl text-center">
            <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black mb-2">Erase Identity?</h3>
            <p className="text-red-400/70 text-[10px] font-black uppercase tracking-widest mb-4">CRITICAL SECURITY ACTION</p>
            <p className="text-gray-500 text-[11px] font-bold mb-8 leading-relaxed">
              Are you absolutely sure? <b>{permanentlyDeleteConfirm.name}</b> will be permanently removed from this device. This cannot be undone.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={(e) => handlePermanentDelete(permanentlyDeleteConfirm.id, e)} 
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                Permanently Erase
              </button>
              <button 
                onClick={() => setPermanentlyDeleteConfirm(null)} 
                className="w-full py-4 bg-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors text-gray-500"
              >
                Keep in Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
