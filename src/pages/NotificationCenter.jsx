import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  Bell, 
  Trash2, 
  CheckCheck, 
  ArrowDownLeft, 
  ArrowUpRight, 
  XCircle, 
  Clock, 
  X,
  Search,
  ExternalLink
} from "lucide-react";
import { markAsRead, markAllAsRead, clearNotifications, selectNotificationsForActiveWallet } from "@/notificationSlice";
import BackButton from "@/components/BackButton";

const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || "testnet";
const EXPLORER_BASE = 
  NETWORK === "public"
    ? "https://stellar.expert/explorer/public/tx"
    : "https://stellar.expert/explorer/testnet/tx";

export default function NotificationCenter() {
  const dispatch = useDispatch();

  const notifications = useSelector(selectNotificationsForActiveWallet); // Use the new selector

  const [selectedNotif, setSelectedNotif] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const highlightText = (text, highlight) => {
    if (!text || !highlight.trim()) return text;
    const parts = text.toString().split(new RegExp(`(${highlight})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-cyan-500/30 text-cyan-300 rounded-sm px-0.5">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const getIcon = (type) => {
    switch (type) {
      case "received": return <ArrowDownLeft className="text-emerald-400" size={20} />;
      case "sent": return <ArrowUpRight className="text-cyan-400" size={20} />;
      case "failed": return <XCircle className="text-rose-400" size={20} />;
      default: return <Bell className="text-gray-400" size={20} />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesFilter = filter === "all" || n.type === filter;
    const matchesSearch = 
      n.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.amount?.toString().includes(searchTerm) ||
      n.asset?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-black text-white">Notification Center</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => dispatch(markAllAsRead())}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e2329] border border-[#2b3139] rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all"
          >
            <CheckCheck size={16} /> Mark All Read
          </button>
          <button 
            onClick={() => dispatch(clearNotifications())}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all"
          >
            <Trash2 size={16} /> Clear All
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Search by address, amount, or asset..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1e2329] border border-[#2b3139] rounded-2xl py-4 pl-12 pr-12 text-white focus:border-cyan-500/50 outline-none transition-all placeholder:text-gray-600 shadow-xl"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {["all", "received", "sent", "failed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
              filter === f
                ? "bg-cyan-500 border-cyan-400 text-black shadow-lg shadow-cyan-500/20"
                : "bg-[#1e2329] border-[#2b3139] text-gray-500 hover:text-white hover:border-gray-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-[#1e2329] border border-dashed border-[#2b3139] rounded-[2rem] p-20 text-center">
            <Bell className="mx-auto text-gray-700 mb-4" size={48} />
            <p className="text-gray-500 font-bold uppercase tracking-widest">No {filter !== 'all' ? filter : ''} notifications found</p>
          </div>
        ) : (

            filteredNotifications.map((n) => (
            <div 
              key={n.id}
              onClick={() => { dispatch(markAsRead(n.id)); setSelectedNotif(n); }}
              className={`group flex items-center justify-between p-6 bg-[#1e2329] border rounded-2xl cursor-pointer transition-all hover:border-cyan-500/50 ${n.read ? 'border-[#2b3139] opacity-70' : 'border-cyan-500/30 bg-cyan-500/[0.02]'}`}
            >
              <div className="flex items-center gap-5">
                <div className="p-3 bg-black/40 rounded-xl">{getIcon(n.type)}</div>
                <div>
                  <h3 className={`font-bold ${n.read ? 'text-gray-400' : 'text-white'}`}>{highlightText(n.title, searchTerm)}</h3>
                  <p className="text-sm text-gray-500 mt-1">{highlightText(n.message, searchTerm)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
                  <Clock size={12} /> {new Date(n.createdAt).toLocaleTimeString()}
                </span>
                <button className="text-xs font-black text-cyan-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Read More</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e2329] border border-[#2b3139] rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedNotif(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24} /></button>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-6 bg-cyan-500/10 rounded-full mb-2">{getIcon(selectedNotif.type)}</div>
              <h2 className="text-2xl font-black text-white">{highlightText(selectedNotif.title, searchTerm)}</h2>
              <p className="text-gray-400">{highlightText(selectedNotif.message, searchTerm)}</p>
              <div className="w-full bg-black/40 rounded-2xl p-6 space-y-3 font-mono text-sm border border-white/5">
                <div className="flex justify-between"><span className="text-gray-600">Amount:</span> <span className="text-white">{highlightText(selectedNotif.amount, searchTerm)} {highlightText(selectedNotif.asset, searchTerm)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Type:</span> <span className="text-cyan-400 uppercase">{selectedNotif.type}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Time:</span> <span className="text-gray-400">{new Date(selectedNotif.createdAt).toLocaleString()}</span></div>
              </div>
              
              {selectedNotif.hash && (
                <a 
                  href={`${EXPLORER_BASE}/${selectedNotif.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-widest transition-colors mt-2"
                >
                  View on StellarExpert <ExternalLink size={14} />
                </a>
              )}

              <button onClick={() => setSelectedNotif(null)} className="w-full bg-white text-black font-black py-4 rounded-xl mt-4">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}