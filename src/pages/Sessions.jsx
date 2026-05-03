import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Monitor, Smartphone, Globe, ShieldAlert, LogOut } from 'lucide-react';
import { api, backendPath } from '@/services/api';

export default function Sessions() {
  const { token } = useSelector((state) => state.auth);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get(backendPath('/api/auth/sessions'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSessions(res.data.sessions || []);
      } catch (e) {
        console.error("Failed to fetch sessions");
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0b0e11] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="text-cyan-500" size={28} />
          <h1 className="text-2xl font-bold text-white">Account Activity</h1>
        </div>

        <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2b3139] bg-[#181a20]">
            <h2 className="text-sm font-bold text-[#848e9c] uppercase">Active Sessions</h2>
          </div>

          <div className="divide-y divide-[#2b3139]">
            {loading ? (
              <div className="p-10 text-center text-[#848e9c] animate-pulse">Loading active sessions...</div>
            ) : sessions.map((session, idx) => (
              <div key={idx} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#2b3139]/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0b0e11] flex items-center justify-center text-cyan-400 border border-[#2b3139]">
                    {session.device === 'mobile' ? <Smartphone size={22} /> : <Monitor size={22} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{session.browser || 'Unknown Browser'}</span>
                      {session.current && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">Current</span>
                      )}
                    </div>
                    <div className="text-xs text-[#848e9c] flex items-center gap-2 mt-1">
                      <Globe size={12} /> {session.ip} • {session.location || 'Unknown Location'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-8">
                  <div className="text-right">
                    <div className="text-xs text-[#848e9c]">Last Active</div>
                    <div className="text-sm text-[#eaecef]">{new Date(session.lastActive).toLocaleString()}</div>
                  </div>
                  {!session.current && (
                    <button className="p-2 text-[#848e9c] hover:text-rose-400 transition-colors">
                      <LogOut size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <p className="mt-6 text-xs text-[#848e9c] leading-relaxed">
          If you notice any suspicious activity, we recommend logging out of all other sessions and changing your password immediately.
        </p>
      </div>
    </div>
  );
}
