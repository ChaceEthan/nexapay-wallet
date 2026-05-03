import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, backendPath } from '@/services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post(backendPath('/api/auth/forgot-password'), { email });

      setMessage({ type: 'success', text: 'Reset instructions sent to your email.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/70 p-8 rounded-3xl border border-slate-700 shadow-lg">
        <div className="mb-6">
          <Link to="/signin" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Forgot Password?</h1>
        <p className="text-sm text-slate-400 mb-6">
          Enter your email address and we'll send you instructions to reset your password.
        </p>

        {message.text && (
          <div className={`p-3 mb-6 rounded-lg text-sm flex flex-col gap-3 ${
            message.type === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
            {message.type === 'success' && (
              <button 
                onClick={handleRequestReset}
                disabled={loading}
                className="text-xs font-bold underline hover:opacity-80 text-left disabled:opacity-50"
              >
                Didn't receive it? Resend Link
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-700/80 border border-slate-600 rounded-xl py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder-slate-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-100 font-bold rounded-xl transition-all disabled:bg-slate-600 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
