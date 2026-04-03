import React, { useEffect, useState } from "react";
import { Link, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { getAddress, isConnected, signTransaction } from "@stellar/freighter-api";
import { Server, TransactionBuilder, Operation, Asset, Networks } from "@stellar/stellar-sdk";
import axios from "axios";
import { ArrowRight, Clock, Send, Download, Wallet, LogIn } from "lucide-react";
import logo from "./assets/logo.svg";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const FRIEND_BOT_URL = "https://friendbot.stellar.org";
const API_URL = import.meta.env.VITE_API_URL || "https://nexapay-wallet.onrender.com";

function shortenKey(key) {
  if (!key || key.length < 20) return key;
  return `${key.slice(0, 5)}...${key.slice(-5)}`;
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[80vh] max-w-6xl mx-auto p-4 md:p-6 text-center text-red-100 bg-red-950/30 rounded-xl">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2">Please refresh or try again later.</p>
          <pre className="mt-4 text-xs text-rose-300 break-words">{this.state.error?.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function AuthPage({ mode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const path = mode === "signup" ? "signup" : "signin";

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const endpoint = `${API_URL}/${path}`;
      const response = await axios.post(endpoint, { email, password });
      setMessage({ type: "success", text: response.data?.message || `${path} successful` });

      if (path === "signup") {
        setTimeout(() => navigate("/auth"), 200);
      } else {
        setTimeout(() => navigate("/"), 200);
      }
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text:
          error?.response?.data?.error || error?.response?.data?.message ||
          error.message ||
          "Network error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[80vh] w-full p-8 bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/8 p-8 backdrop-blur-xl shadow-glow">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-cyan-300">{mode === "signup" ? "Sign Up" : "Sign In"}</h2>
          <span className="text-sm text-slate-300">API: {shortenKey(API_URL)}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-white/20 bg-slate-900/80 px-4 py-2 text-white outline-none focus:border-cyan-300"
          />
          <input
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-white/20 bg-slate-900/80 px-4 py-2 text-white outline-none focus:border-cyan-300"
          />

          <button type="submit" className="glass-btn w-full py-2">
            {loading ? "Processing..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>

        {message && (
          <div className={`mt-4 rounded-lg px-4 py-2 text-sm ${message.type === "error" ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}>
            {message.text}
          </div>
        )}

        <p className="mt-4 text-sm text-slate-300">
          {mode === "signup" ? "Already have account?" : "Need an account?"}{" "}
          <Link className="text-cyan-300 hover:text-cyan-100" to={mode === "signup" ? "/signin" : "/signup"}>
            {mode === "signup" ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </main>
  );
}

function Dashboard() {
  const [publicKey, setPublicKey] = useState("");
  const [xlmBalance, setXlmBalance] = useState("0");
  const [txHistory, setTxHistory] = useState([]);
  const [status, setStatus] = useState("Ready");
  const [connected, setConnected] = useState(false);
  const [sendAmount, setSendAmount] = useState("");
  const [sendDestination, setSendDestination] = useState("");
  const [sendResult, setSendResult] = useState(null);

  const server = new Server(HORIZON_URL);

  const refreshAccount = async (address) => {
    if (!address) return;
    try {
      const account = await server.loadAccount(address);
      const nativeBalance = account.balances.find((item) => item.asset_type === "native")?.balance || "0";
      setXlmBalance(nativeBalance);
      setStatus("Balance refreshed");
    } catch (e) {
      setStatus(`Failed to load account: ${e.message}`);
      setXlmBalance("0");
    }
  };

  const updateTransactionHistory = async (address) => {
    if (!address) return;
    try {
      const ops = await server.operations().forAccount(address).order("desc").limit(20).call();
      setTxHistory(ops.records || []);
    } catch (e) {
      setStatus(`Failed tx history: ${e.message}`);
      setTxHistory([]);
    }
  };

  const connectFreighter = async () => {
    setStatus("Connecting to Freighter...");
    try {
      const { isConnected: isFreighterConnected } = await isConnected();
      if (!isFreighterConnected) {
        setStatus("Freighter not connected. Install extension and unlock wallet.");
        return;
      }

      const { address, error } = await getAddress();
      if (error || !address) {
        setStatus(error?.message || "Failed to get public key from Freighter");
        return;
      }

      setPublicKey(address);
      setConnected(true);
      setStatus("Wallet connected.");
      await refreshAccount(address);
      await updateTransactionHistory(address);
    } catch (error) {
      setStatus(`Connection error: ${error.message || String(error)}`);
    }
  };

  const fundViaFriendbot = async () => {
    if (!publicKey) return;
    setStatus("Funding with Friendbot...");
    try {
      const res = await fetch(`${FRIEND_BOT_URL}/?addr=${publicKey}`);
      if (!res.ok) throw new Error(`Friendbot returned ${res.status}`);
      await refreshAccount(publicKey);
      setStatus("Friendbot funding successful!");
    } catch (error) {
      setStatus(`Friendbot error: ${error.message}`);
    }
  };

  const sendPayment = async (e) => {
    e.preventDefault();
    setSendResult(null);

    if (!sendDestination || !sendAmount || Number(sendAmount) <= 0) {
      setSendResult({ type: "error", message: "Destination and amount are required." });
      return;
    }

    if (!publicKey) {
      setSendResult({ type: "error", message: "Connect wallet first." });
      return;
    }

    setStatus("Preparing transaction...");

    try {
      const account = await server.loadAccount(publicKey);
      const baseFee = await server.fetchBaseFee();
      const tx = new TransactionBuilder(account, {
        fee: baseFee.toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: sendDestination.trim(),
            asset: Asset.native(),
            amount: sendAmount.toString(),
          }),
        )
        .setTimeout(180)
        .build();

      const result = await signTransaction(tx.toXDR(), { networkPassphrase: Networks.TESTNET });
      if (result.error) throw new Error(result.error.message || "Failed to sign transaction");

      const submitResult = await server.submitTransaction(result.signedTxXdr);
      setSendResult({ type: "success", message: `Success! Hash: ${submitResult.hash}` });
      setStatus("Payment sent successfully.");
      setSendDestination("");
      setSendAmount("");
      await refreshAccount(publicKey);
      await updateTransactionHistory(publicKey);
    } catch (error) {
      setSendResult({ type: "error", message: error?.response?.data?.extras?.result_codes?.transaction || error.message || "Send failed" });
      setStatus(`Send error: ${error.message}`);
    }
  };

  useEffect(() => {
    console.log("Dashboard mounted");
    connectFreighter();
  }, []);

  if (typeof window !== "undefined" && !window.freighterApi) {
    return (
      <main className="min-h-[80vh] max-w-6xl mx-auto p-4 md:p-6 text-center text-slate-100">
        <div className="rounded-xl border border-white/10 bg-black/40 p-8">
          <h1 className="text-2xl font-bold">Freighter extension not detected</h1>
          <p className="mt-2">Please install Freighter to continue using wallet features.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-[80vh] max-w-6xl mx-auto p-4 md:p-6 text-slate-100">
      <div className="space-y-6">
        <header className="glass-card flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <img src={logo} alt="NexaPay" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold text-cyan-200">NexaPay Stellar Testnet</h1>
              <p className="text-sm text-cyan-100/80">Dark crypto interface with wallet, send/receive, history</p>
            </div>
          </div>
          <button
            className="glass-btn flex items-center gap-2 text-sm"
            onClick={connectFreighter}
            aria-label="Connect Freighter wallet"
          >
            <Wallet size={16} /> {connected ? "Reconnect" : "Connect Wallet"}
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article className="glass-card p-5">
            <h2 className="text-xl font-semibold text-cyan-200">Connected Wallet</h2>
            <p className="mt-2 text-slate-300">{connected ? shortenKey(publicKey) : "No wallet connected"}</p>
            <p className="mt-5 text-sm text-slate-300">Network: Testnet</p>
            <p className="text-2xl font-bold text-white mt-4">{xlmBalance} XLM</p>
            <button className="glass-btn mt-4" onClick={fundViaFriendbot}>
              <Download size={16} /> Friendbot Fund
            </button>
          </article>

          <article className="glass-card p-5 xl:col-span-3">
            <h2 className="text-xl font-semibold text-cyan-200">Quick Actions</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link to="/signin" className="glass-btn inline-flex items-center gap-2 text-sm">
                <LogIn size={16} /> Auth SignIn
              </Link>
              <Link to="/signup" className="glass-btn inline-flex items-center gap-2 text-sm">
                <ArrowRight size={16} /> Auth SignUp
              </Link>
            </div>

            <form onSubmit={sendPayment} className="mt-5 grid gap-3 md:grid-cols-3">
              <input
                className="rounded-xl border border-white/20 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-cyan-300"
                type="text"
                placeholder="Destination public key"
                value={sendDestination}
                onChange={(e) => setSendDestination(e.target.value)}
              />
              <input
                className="rounded-xl border border-white/20 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-cyan-300"
                type="number"
                placeholder="Amount XLM"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                min="0"
                step="0.0000001"
              />
              <button type="submit" className="glass-btn inline-flex items-center justify-center gap-2">
                <Send size={16} /> Send
              </button>
            </form>
            {sendResult && (
              <p className={`mt-3 rounded-lg p-3 text-sm ${sendResult.type === "error" ? "bg-rose-500/20 text-rose-200" : "bg-emerald-500/20 text-emerald-200"}`}>
                {sendResult.message}
              </p>
            )}
          </article>
        </section>

        <section className="glass-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-cyan-200">Transaction History</h2>
            <span className="inline-flex items-center gap-2 text-sm text-slate-200">
              <Clock size={14} /> {formatDate(new Date().toISOString())}
            </span>
          </div>

          <div className="mt-4 space-y-2 max-h-[300px] overflow-auto">
            {txHistory.length === 0 ? (
              <p className="text-slate-300">No history found yet. Send or receive XLM to generate history.</p>
            ) : (
              txHistory.map((tx) => (
                <div key={tx.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm text-cyan-100">Type: {tx.type}</p>
                  <p className="text-xs text-slate-300">Asset: {tx.asset_type || "XLM"}</p>
                  <p className="text-sm text-slate-100">Amount: {tx.amount || tx.value || "-"}</p>
                  <p className="text-xs text-slate-400">Created: {formatDate(tx.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <footer className="glass-card p-4 text-xs text-slate-400">
          <p>NexaPay UI/UX upgrade complete — transparent glassmorphism style across full-screen crypto dashboard.</p>
          <p className="mt-1">Status: {status}</p>
          <p>API URL: {API_URL}</p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  console.log("App Loaded");

  return (
    <Routes>
      <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
      <Route path="/auth" element={<ErrorBoundary><AuthPage mode="signin" /></ErrorBoundary>} />
      <Route path="/signin" element={<ErrorBoundary><AuthPage mode="signin" /></ErrorBoundary>} />
      <Route path="/signup" element={<ErrorBoundary><AuthPage mode="signup" /></ErrorBoundary>} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
