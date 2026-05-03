import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, backendPath } from '@/services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setStatus({ type: 'error', text: 'Passwords do not match' });
    }

    setLoading(true);
    setStatus({ type: '', text: '' });

    try {
      await api.post(backendPath('/api/auth/reset-password'), { token, password });

      setStatus({ type: 'success', text: 'Password reset successful!' });
      setTimeout(() => navigate('/signin'), 3000);
    } catch (err) {
      setStatus({ type: 'error', text: err?.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/70 p-8 rounded-3xl border border-slate-700 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-sm text-slate-400 mb-6">Enter your new password below.</p>

        {status.text && (
          <div className={`p-3 mb-6 rounded-lg text-sm flex items-center gap-2 ${
            status.type === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {status.text}
          </div>
        )}

        {status.type === 'success' ? (
          <Link to="/signin" className="w-full block text-center py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-100 font-bold rounded-xl transition-all">
            Return to Sign In
          </Link>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700/80 border border-slate-600 rounded-xl py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder-slate-500"
                required
              />
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-700/80 border border-slate-600 rounded-xl py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder-slate-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-100 font-bold rounded-xl transition-all disabled:bg-slate-600 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
