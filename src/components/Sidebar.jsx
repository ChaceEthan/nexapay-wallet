import React from "react"; 
import { NavLink, useLocation } from "react-router-dom"; 
import { useDispatch, useSelector } from "react-redux"; 
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  LineChart, 
  ArrowLeftRight, 
  Layers, 
  X, 
  ShieldCheck,
  Globe,
  Zap
} from "lucide-react";

import { lockWallet } from "../authSlice.js";

const mainNav = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Markets", path: "/markets", icon: LineChart },
];

const ecosystemNav = [
  { name: "Trade", path: "/trade", icon: ArrowLeftRight },
  { name: "DeFi", path: "/defi", icon: Layers },
];

const systemNav = [
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar({ open, setOpen }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isStrictMode } = useSelector((state) => state.auth);

  const onLock = () => {
    try { 
      dispatch(lockWallet());
      if (setOpen) setOpen(false); 
    } catch (err) {
      console.error("Lock error:", err);
    }
  };

  // 🛡️ SAFE NAVIGATION ITEM
  const NavItem = ({ item }) => {
    // Manually determine active state for absolute reliability and scope safety
    const isActive = location.pathname === item.path;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={() => setOpen && setOpen(false)}
        className={`flex items-center gap-4 p-4 rounded-2xl transition-all border border-transparent ${
          isActive
            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-lg shadow-cyan-500/5"
            : "text-gray-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        <span className={`text-[13px] tracking-tight ${isActive ? 'font-black' : 'font-bold'}`}>{item.name}</span>
      </NavLink>
    );
  };

  try {
    return (
      <>
        {/* MOBILE OVERLAY */}
        {open && (
          <div
            className="fixed inset-0 bg-black/90 z-[90] md:hidden backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setOpen && setOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`fixed top-0 left-0 h-screen w-72 bg-[#0b0e11] border-r border-white/5 flex flex-col z-[100] transform transition-transform duration-500 shadow-[40px_0_100px_rgba(0,0,0,0.8)]
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        >
          {/* LOGO AREA */}
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-cyan-500/30 ring-1 ring-white/20">
                <span className="text-black font-black text-xl">N</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-2xl font-black text-white tracking-tighter">NexaPay</span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <ShieldCheck size={10} className="text-cyan-500" />
                  <span className="text-[9px] text-cyan-500/60 font-black uppercase tracking-[0.2em]">Institutional v4</span>
                </div>
              </div>
            </div> 
            <button onClick={() => setOpen && setOpen(false)} className="md:hidden text-gray-500 hover:text-white transition-colors">
              <X size={28} />
            </button>
          </div>

          {/* NAVIGATION SYSTEM */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-10">
            
            {/* MAIN SECTION */}
            <div className="space-y-3">
              <p className="px-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">Core Terminal</p>
              {mainNav.map(item => <NavItem key={item.path} item={item} />)}
            </div>

            {/* ECOSYSTEM SECTION */}
            <div className="space-y-3">
              <p className="px-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">Capital Market</p>
              {ecosystemNav.map(item => <NavItem key={item.path} item={item} />)}
            </div>

            {/* SYSTEM SECTION */}
            <div className="space-y-3">
              <p className="px-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">Infrastructure</p>
              {systemNav.map(item => <NavItem key={item.path} item={item} />)}
            </div>

          </div>

          {/* FOOTER HUB */}
          <div className="p-6 mt-auto border-t border-white/5 bg-black/40 backdrop-blur-md">
            <div className="mb-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Globe size={14} className="text-blue-500" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Network Status</span>
               </div>
               <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            </div>

            {/* STRICT MODE BADGE */}
            <div className="mb-6 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <ShieldCheck size={14} className={isStrictMode ? "text-rose-500" : "text-emerald-500"} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Strict Mode</span>
               </div>
               <div className={`w-2 h-2 rounded-full ${isStrictMode ? 'bg-rose-500' : 'bg-emerald-500'} shadow-[0_0_8px_currentColor] animate-pulse`} />
            </div>
            
            <button
              onClick={onLock}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-black text-[11px] uppercase tracking-[0.2em] border border-rose-500/20 shadow-xl active:scale-95 group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              Secure Session Lock
            </button>
          </div>
        </aside>
      </>
    );
  } catch (error) {
    console.error("Sidebar Render Crash:", error);
    return null;
  }
}