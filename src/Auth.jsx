import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://nexapay-wallet.onrender.com";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "signin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    
    setMessage(null);
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/${mode}`, { email, password });
      setMessage({ type: "success", text: response.data?.message || `${mode} successful` });
      if (mode === "signup") setTimeout(() => navigate("/auth?mode=signin"), 1500);
      else setTimeout(() => navigate("/"), 500);
    } catch (error) {
      const errorText = error?.response?.data?.error || error?.response?.data?.message || error.message;
      setMessage({ type: "error", text: errorText });
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-[80vh] w-full p-8 bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
           <h2 className="text-3xl font-bold text-cyan-300">{mode === "signup" ? "Create Account" : "Welcome Back"}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email Address" className="glass-input" />
          <input required value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="glass-input" />
          <button 
            type="submit" 
            disabled={loading} 
            className="glass-btn w-full py-4 mt-2 font-bold uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {loading ? "Verifying..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>
        {message && <div className={`mt-4 rounded-lg px-4 py-2 text-sm ${message.type === "error" ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}>{message.text}</div>}
        <p className="mt-6 text-center text-slate-300">
          {mode === "signup" ? "Already have account?" : "Need an account?"} <Link className="text-cyan-300 hover:underline" to={mode === "signup" ? "/auth?mode=signin" : "/auth?mode=signup"}>{mode === "signup" ? "Sign In" : "Sign Up"}</Link>
        </p>
      </div>
    </main>
  );
}