import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ArrowDownUp, RefreshCw, AlertCircle, Info, Zap } from "lucide-react";
import { simulateSwap } from "@/walletSlice";
import { getMarketData, safePrice } from "@/services/api";


export default function SwapCard() {
  const dispatch = useDispatch();
  const balances = useSelector((state) => state.wallet?.balances || []);
  
  const [fromAsset, setFromAsset] = useState("XLM");
  const [toAsset, setToAsset] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("0.0000");
  const [fee, setFee] = useState("0.0000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Real-time Rates
  const [rates, setRates] = useState({ XLM: 0.12, USDC: 1.00, USDT: 1.00 });

  // 📡 FETCH LIVE RATES
  useEffect(() => {
    const fetchRates = async () => {
      const data = await getMarketData();
      if (data && data.xlm) {
        setRates({
          XLM: safePrice(data.xlm.price, 0.165),
          USDC: safePrice(data.usdc.price, 1),
          USDT: safePrice(data.usdt.price, 1)
        });
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 15000);
    return () => clearInterval(interval);
  }, []);

  const currentBalance = balances.find(b => (b.asset_code || 'XLM') === fromAsset)?.balance || "0";
  const FEE_RATE = 0.000001; // 0.0001%

  // 🔄 REAL-TIME CALCULATION ENGINE
  useEffect(() => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setReceiveAmount("0.0000");
      setFee("0.0000");
      return;
    }

    const val = parseFloat(amount);
    const exchangeRate = rates[fromAsset] / rates[toAsset];
    const calculatedReceive = (val * exchangeRate).toFixed(4);
    const calculatedFee = (val * FEE_RATE).toFixed(7);

    setReceiveAmount(calculatedReceive);
    setFee(calculatedFee);
    setError("");
  }, [amount, fromAsset, toAsset, rates]);


  const handleMax = () => {
    // Leave some room for fees if fromAsset is XLM (Stellar network requirement)
    const bal = parseFloat(currentBalance);
    const max = fromAsset === "XLM" ? Math.max(0, bal - 1) : bal;
    setAmount(max.toString());
  };

  const handleSwap = async () => {
    const totalRequired = parseFloat(amount) + parseFloat(fee);
    
    if (totalRequired > parseFloat(currentBalance)) {
      setError("Insufficient balance including fees");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await dispatch(simulateSwap({
        fromAsset,
        toAsset,
        amount,
        receiveAmount,
        fee
      })).unwrap();
      
      setSuccess(true);
      setAmount("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err || "Swap failed");
    } finally {
      setLoading(false);
    }
  };

  const switchAssets = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setAmount("");
  };

  const canSwap = amount && !error && !loading && (parseFloat(amount) + parseFloat(fee)) <= parseFloat(currentBalance);

  return (
    <div className="bg-[#1e2329] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden group">
      {/* GLOW EFFECT */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[100px] group-hover:bg-cyan-500/20 transition-all duration-700" />
      
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 relative z-10">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            Protocol Exchange
          </h3>
          <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mt-1">
            Institutional Liquidity Simulation
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Network Status</span>
          <span className="text-[10px] font-black text-emerald-400">READY</span>
        </div>
      </header>

      <div className="space-y-2 relative z-10">
        {/* FROM ASSET */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 focus-within:border-cyan-500/50 transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Input</span>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
              Available: <span className="text-gray-300">{parseFloat(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <button 
                onClick={handleMax}
                className="text-cyan-500 hover:text-cyan-400 font-black uppercase ml-2"
              >
                MAX
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-transparent text-3xl font-black text-white w-full outline-none placeholder:text-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <select 
              value={fromAsset}
              onChange={(e) => setFromAsset(e.target.value)}
              className="bg-[#2b3139] border border-white/10 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-[#363c44]"
            >
              <option value="XLM">XLM</option>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
        </div>

        {/* SWITCH BUTTON */}
        <div className="relative h-4 flex justify-center z-20">
          <button 
            onClick={switchAssets}
            className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-[#1e2329] border border-white/10 rounded-xl flex items-center justify-center text-cyan-400 hover:text-white hover:bg-cyan-500 transition-all shadow-xl active:scale-90"
          >
            <ArrowDownUp size={18} />
          </button>
        </div>

        {/* TO ASSET */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Output</span>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
              Rate: <span className="text-gray-300">1 {fromAsset} = {(rates[fromAsset]/rates[toAsset]).toFixed(4)} {toAsset}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-black text-gray-400 w-full truncate">
              {receiveAmount}
            </div>
            <select 
              value={toAsset}
              onChange={(e) => setToAsset(e.target.value)}
              className="bg-[#2b3139] border border-white/10 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-[#363c44]"
            >
              <option value="XLM">XLM</option>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
        </div>
      </div>

      {/* REACTIVE DATA PANEL */}
      <div className="mt-6 p-4 bg-black/20 rounded-2xl border border-white/5 space-y-3 relative z-10">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Protocol Fee (0.0001%)</span>
          <span className="text-[11px] font-mono text-cyan-500 font-black">{fee} {fromAsset}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Total Deduction</span>
          <span className="text-[11px] font-mono text-white font-black">{(parseFloat(amount || 0) + parseFloat(fee)).toFixed(7)} {fromAsset}</span>
        </div>
      </div>

      {/* ERROR / SUCCESS FEEDBACK */}
      <div className="h-6 mt-4 relative z-10">
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-[10px] font-black uppercase animate-in slide-in-from-top-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-green-400 text-[10px] font-black uppercase animate-in slide-in-from-top-2">
            <Zap size={14} /> Protocol Transaction Executed
          </div>
        )}
      </div>

      {/* ACTION BUTTON */}
      <button 
        onClick={handleSwap}
        disabled={!canSwap}
        className="w-full mt-2 py-5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-10 disabled:grayscale text-black font-black text-xs uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-cyan-500/10 active:scale-[0.98] flex items-center justify-center gap-3 relative z-10"
      >
        {loading ? (
          <>
            <RefreshCw size={18} className="animate-spin" /> Verifying Order
          </>
        ) : (
          "Confirm Exchange"
        )}
      </button>


      {/* FOOTER STATS */}
      <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
        <div className="text-center">
          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Network Fee</p>
          <p className="text-[10px] font-mono text-gray-400">0.00001 XLM</p>
        </div>
        <div className="text-center">
          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Slippage Tolerance</p>
          <p className="text-[10px] font-mono text-gray-400">0.5% (Simulated)</p>
        </div>
        <div className="text-center">
          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Liquidity</p>
          <p className="text-[10px] font-mono text-cyan-500/60 font-black">UNLIMITED</p>
        </div>
      </div>
    </div>
  );
}
