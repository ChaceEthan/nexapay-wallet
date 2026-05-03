import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, CheckCheck, Trash2, X, ExternalLink, TrendingUp, AlertCircle, Wallet, Loader2, RotateCcw, Check } from 'lucide-react';
import { markAsRead, markAllAsRead, removeNotification } from '../notificationSlice';
import { setRetryTransaction, selectActiveWalletId } from '../walletSlice';

/**
 * Safe Fallback Implementation for date formatting
 */
function timeAgo(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "recently";
  const seconds = Math.floor((new Date() - d) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return Math.floor(seconds / 60) + " min ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + " hrs ago";
  return Math.floor(seconds / 86400) + " days ago";
}

export default function NotificationBell() {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const activeWalletId = useSelector(selectActiveWalletId || (() => null));
  const allNotifications = useSelector(state => state?.notifications?.notifications || []);

  // Advanced tracking for retry animation lifecycle
  const retryingNotifId = useSelector(state => state?.wallet?.retryingNotifId || null);
  const retrySuccessId = useSelector(state => state?.wallet?.retrySuccessId || null);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'market': return <TrendingUp size={14} className="text-amber-400" />;
      case 'transaction': return <Wallet size={14} className="text-cyan-400" />;
      case 'system': return <AlertCircle size={14} className="text-rose-400" />;
      default: return <Bell size={14} className="text-gray-400" />;
    }
  };

  // Standardized time fallback logic
  const getTimeAgo = (date) => {
    return timeAgo(date);
  };

  const filteredNotifications = activeWalletId ? allNotifications.filter(n => n.walletId === activeWalletId) : [];
  const currentUnreadCount = filteredNotifications.filter(n => !n.read).length;

  const handleRetry = (id, metadata) => {
    dispatch(setRetryTransaction({ notifId: id, metadata }));
    setTimeout(() => setIsOpen(false), 600);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-all relative"
      >
        <Bell size={18} />
        {currentUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-[10px] flex items-center justify-center rounded-lg text-white font-black animate-pulse shadow-lg">
            {currentUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-3 w-80 bg-[#181a20] border border-white/5 rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.9)] z-[80] overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-5 border-b border-white/5 bg-black/20 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Alert Center</span>
              <button 
                onClick={() => dispatch(markAllAsRead())}
                className="text-[10px] font-bold text-cyan-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <CheckCheck size={12} /> Read All
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="py-20 flex flex-col items-center opacity-20">
                  <Bell size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest mt-4">No Notifications</p>
                </div>
              ) : ( // Use filteredNotifications here
                filteredNotifications.map(n => (
                  <div 
                    key={n.id}
                    className={`p-4 border-b border-white/5 transition-all hover:bg-white/[0.02] relative group ${!n.read ? 'bg-cyan-500/[0.03]' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1">
                        {n.title === "Transaction Pending" ? 
                          <Loader2 size={14} className="text-cyan-400 animate-spin" /> : 
                          getCategoryIcon(n.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className={`text-xs font-black truncate ${!n.read ? 'text-white' : 'text-gray-500'}`}>{n.title}</h4>
                          <span className="text-[9px] text-gray-600 whitespace-nowrap">
                            {getTimeAgo(n.timestamp)}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                    
                    <div className="absolute right-2 bottom-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {n.title === "Transaction Failed" && n.metadata && (
                        <button 
                          onClick={() => handleRetry(n.id, n.metadata)}
                          className={`p-1 transition-all ${
                            retrySuccessId === n.id ? 'text-emerald-400 scale-125' : 
                            retryingNotifId === n.id ? 'text-cyan-400' : 
                            'hover:text-cyan-400 text-gray-600'
                          }`}
                          title="Retry Transaction"
                        >
                          {retrySuccessId === n.id ? <Check size={12} className="animate-bounce" /> : 
                           retryingNotifId === n.id ? <Loader2 size={12} className="animate-spin" /> : 
                           <RotateCcw size={12} className="active:rotate-180 transition-transform duration-500" />}
                        </button>
                      )}
                      {!n.read && (
                        <button onClick={() => dispatch(markAsRead(n.id))} className="p-1 hover:text-cyan-400 text-gray-600"><CheckCheck size={12} /></button>
                      )}
                      <button onClick={() => dispatch(removeNotification(n.id))} className="p-1 hover:text-rose-400 text-gray-600"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button className="w-full p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors bg-white/5">
              View System Log
            </button>
          </div>
        </>
      )}
    </div>
  );
}