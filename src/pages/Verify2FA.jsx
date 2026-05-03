import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Smartphone, Key, AlertCircle, Loader2 } from 'lucide-react';
import use2FA from '../hooks/use2FA.js';

export default function Verify2FA() {
  const [code, setCode] = useState('');
  const { twoFAMethod } = useSelector((state) => state.auth);
  const { verify2FA, sendOTP, loading, error } = use2FA();
  const navigate = useNavigate();

  useEffect(() => {
    if (twoFAMethod === 'sms') {
      sendOTP();
    }
  }, [twoFAMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await verify2FA(code);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1e2329] p-8 rounded-2xl border border-[#2b3139] shadow-xl">
        <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={32} className="text-cyan-500" />
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">Two-Step Verification</h1>
        <p className="text-sm text-[#848e9c] text-center mb-8">
          {twoFAMethod === 'sms' 
            ? 'Enter the 6-digit code sent to your mobile device.' 
            : 'Enter the code from your Google Authenticator app.'}
        </p>

        {error && (
          <div className="p-3 mb-6 bg-rose-500/10 text-rose-400 rounded-lg text-sm flex items-center gap-2 border border-rose-500/20">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            {twoFAMethod === 'sms' ? (
              <Smartphone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#848e9c]" />
            ) : (
              <Key size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#848e9c]" />
            )}
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl py-4 pl-12 pr-4 text-center text-2xl font-bold tracking-[0.5em] text-white focus:border-cyan-500 outline-none transition-all"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 disabled:bg-[#2b3139] disabled:text-[#848e9c] text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Code'}
          </button>
        </form>

        {twoFAMethod === 'sms' && (
          <button 
            onClick={sendOTP}
            className="w-full mt-6 text-sm text-cyan-500 hover:text-cyan-400 font-medium"
          >
            Resend SMS
          </button>
        )}
      </div>
    </div>
  );
}