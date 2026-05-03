import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { X, Send as SendIcon, Loader2, AlertTriangle, Camera } from "lucide-react";
import { accountExists, validateAddress } from "@/services/stellar";
import { safeNumber, safeArray, sendBackendTransaction } from "@/services/api";
import { showToast } from "@/toastSlice";
import { fetchWalletData } from "@/walletSlice";
import { addNotification } from "@/notificationSlice";
import { triggerPush } from "@/utils/pushNotifications";
import QRScanner from "@/components/QRScanner";

const SUPPORTED_ASSETS = [{ code: "XLM", issuer: null, name: "Stellar Lumens" }, { code: "USDC", issuer: "GBBD67IF6QV6K6WJSZ7TYH66PWHXWNSXNCTW35ZJRYTHXNQKQ535N2F2", name: "USD Coin" }];

const getScanAddress = (payload) =>
  typeof payload === "string" ? payload : payload?.address || payload?.recipient || payload?.destination || "";

const normalizeAmountInput = (value) => {
  const cleaned = String(value || "").replace(/[^\d.]/g, "");
  const [whole, ...decimalParts] = cleaned.split(".");
  const decimal = decimalParts.join("").slice(0, 7);
  return decimalParts.length > 0 ? `${whole}.${decimal}` : whole;
};

export default function TransactionForm({ recipient: initialRecipient, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const submittingRef = useRef(false);
  const { address: senderAddress, balances: rawBalances, decryptedSecretKey, walletType, activeWalletId, minReserve, networkFee, retryData } = useSelector((s) => s.wallet || {});
  const { isWalletUnlocked } = useSelector((s) => s.auth || {});
  const balances = safeArray(rawBalances);

  const [recipient, setRecipient] = useState(getScanAddress(initialRecipient));
  const [isRecipientFunded, setIsRecipientFunded] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(SUPPORTED_ASSETS[0]);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const applyScanPayload = useCallback((payload) => {
    if (!payload) return;

    const nextRecipient = getScanAddress(payload).trim();
    if (nextRecipient) {
      if (!validateAddress(nextRecipient)) {
        setError("Invalid QR recipient address.");
        return;
      }
      setRecipient(nextRecipient);
    }

    if (typeof payload === "object") {
      if (payload.amount && safeNumber(payload.amount, 0) > 0) {
        setAmount(String(payload.amount));
      }

      if (payload.memo) {
        setMemo(String(payload.memo));
      }

      if (payload.assetCode) {
        const asset = SUPPORTED_ASSETS.find((a) => a.code === String(payload.assetCode).toUpperCase());
        if (asset) {
          setSelectedAsset(asset);
        } else {
          setError(`Unsupported QR asset: ${payload.assetCode}`);
        }
      }
    }
  }, []);

  useEffect(() => { applyScanPayload(initialRecipient); }, [initialRecipient, applyScanPayload]);

  useEffect(() => {
    if (retryData) {
      setRecipient(retryData.destination || "");
      setAmount(retryData.amount || "");
      setMemo(retryData.memo || "");
      const asset = SUPPORTED_ASSETS.find((a) => a.code === retryData.assetCode);
      if (asset) setSelectedAsset(asset);
    }
  }, [retryData]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const trimmed = recipient.trim();
      if (trimmed && validateAddress(trimmed)) {
        const exists = await accountExists(trimmed).catch(() => null);
        if (!cancelled) setIsRecipientFunded(exists);
      } else if (!cancelled) setIsRecipientFunded(null);
    };
    const t = setTimeout(check, 600); return () => { cancelled = true; clearTimeout(t); };
  }, [recipient]);

  const handleMaxClick = useCallback(() => {
    if (!senderAddress || !balances.length) return;
    try {
      if (selectedAsset.code === "XLM") {
        const nativeBal = safeNumber(balances.find((b) => b.asset_type === "native")?.balance);
        const max = nativeBal - safeNumber(networkFee, 0.0001) - safeNumber(minReserve, 1);
        setAmount(max > 0 ? max.toFixed(7) : "0");
      } else setAmount(balances.find((b) => b.asset_code === selectedAsset.code)?.balance || "0");
    } catch { dispatch(showToast({ message: "Arithmetic Error", type: "error" })); }
  }, [balances, selectedAsset.code, networkFee, minReserve, senderAddress, dispatch]);

  const validate = useCallback(() => {
    const trimmedRecipient = recipient.trim();
    const parsedAmount = safeNumber(amount);
    if (!senderAddress) return "Wallet not connected.";
    if (!trimmedRecipient || !validateAddress(trimmedRecipient)) return "Invalid recipient address.";
    if (trimmedRecipient === senderAddress) return "Self-transfer not allowed.";
    if (parsedAmount <= 0) return "Amount must be positive.";
    const nativeBalance = safeNumber(balances.find((b) => b.asset_type === "native")?.balance);
    const fee = safeNumber(networkFee, 0.0001);
    const reserve = safeNumber(minReserve, 1);
    if (selectedAsset.code === "XLM") {
      if (isRecipientFunded === false && parsedAmount < 1.0) return "Min 1 XLM for new accounts.";
      if (nativeBalance < (parsedAmount + fee + reserve)) return "Insufficient XLM for transfer/fees.";
    } else {
      const assetBal = safeNumber(balances.find((b) => b.asset_code === selectedAsset.code)?.balance);
      if (assetBal < parsedAmount) return `Insufficient ${selectedAsset.code}.`;
      if (nativeBalance < (fee + reserve)) return "Insufficient XLM for network fee.";
    }
    return null;
  }, [recipient, amount, senderAddress, balances, networkFee, minReserve, selectedAsset.code, isRecipientFunded]);

  const handleSubmit = useCallback(async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (submittingRef.current) return;
    setError("");
    setSuccessMessage("");
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setShowConfirm(true);
  }, [validate]);

  const executeTransfer = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true; setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      if (walletType !== "FREIGHTER" && (!isWalletUnlocked || !decryptedSecretKey)) {
        throw new Error("Vault locked.");
      }

      dispatch(addNotification({ type: "info", category: "transaction", title: "Transaction Pending", message: `Sending ${amount.trim()} ${selectedAsset.code} through NexaPay backend...`, walletId: activeWalletId }));

      const txResult = await sendBackendTransaction({
        senderAddress,
        source: senderAddress,
        secretKey: walletType === "FREIGHTER" ? undefined : decryptedSecretKey,
        destination: recipient.trim(),
        amount: amount.trim(),
        memo,
        assetCode: selectedAsset.code,
        assetIssuer: selectedAsset.issuer,
        walletType,
        activeWalletId,
      });

      dispatch(addNotification({ type: "success", category: "transaction", title: "Transfer Successful", message: `Sent ${amount.trim()} ${selectedAsset.code}`, hash: txResult?.hash || txResult?.transactionHash, walletId: activeWalletId }));
      dispatch(showToast({ message: "Send Successful!", type: "success" }));
      triggerPush("NexaPay", `Sent ${amount.trim()} ${selectedAsset.code}`);
      setSuccessMessage(`Sent ${amount.trim()} ${selectedAsset.code} successfully.`);
      setShowConfirm(false);

      if (senderAddress) {
        await dispatch(fetchWalletData(senderAddress)).unwrap().catch(() => null);
      }

      onSuccess && onSuccess(txResult);
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || err.message || "Execution Protocol Failed.";
      setError(message);
      setShowConfirm(false);
    } finally {
      submittingRef.current = false; setLoading(false);
    }
  }, [recipient, amount, memo, selectedAsset, walletType, isWalletUnlocked, decryptedSecretKey, validate, activeWalletId, dispatch, senderAddress, onSuccess]);

  return (
    <div className="relative w-full max-w-md bg-[#1e2329] border border-[#2b3139] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
      <button type="button" onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-20">
        <X size={20} />
      </button>
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        <h2 className="text-xl font-black text-white">Execute Transfer</h2>
        <select value={selectedAsset.code} onChange={(e) => setSelectedAsset(SUPPORTED_ASSETS.find((a) => a.code === e.target.value))}
                className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-white outline-none focus:border-cyan-500/50 appearance-none transition-all">
          {SUPPORTED_ASSETS.map((a) => <option key={a.code} value={a.code}>{a.name} ({a.code})</option>)}
        </select>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient G..."
                   className="flex-1 p-4 bg-black border border-gray-800 rounded-2xl text-white text-xs font-mono outline-none focus:border-cyan-500/50 transition-all"/>
            <button type="button" onClick={() => setShowQRScanner(true)} className="p-4 bg-black border border-gray-800 rounded-2xl text-gray-400 hover:text-cyan-400 transition-all">
              <Camera size={20} />
            </button>
          </div>
          {isRecipientFunded === false && recipient.trim() && (
            <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase">
              <AlertTriangle size={12} /> New Account Initiation Required (≥1 XLM)
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input value={amount} onChange={(e) => setAmount(normalizeAmountInput(e.target.value))} placeholder="0.00" inputMode="decimal"
                 className="flex-1 p-4 bg-black border border-gray-800 rounded-2xl text-white text-2xl font-black outline-none focus:border-cyan-500/50 transition-all"/>
          <button type="button" onClick={handleMaxClick} className="px-5 bg-black border border-gray-800 rounded-2xl text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:border-cyan-500/50">Max</button>
        </div>
        <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Reference / Memo (Optional)"
               className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-white text-sm outline-none focus:border-cyan-500/50 transition-all"/>
        <div className="flex justify-between items-center px-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
          <span>Protocol Fee</span><span>{networkFee || "0.0001"} XLM</span>
        </div>
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold animate-in slide-in-from-top-1">
            <AlertTriangle size={16} className="shrink-0" /> <p>{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold animate-in slide-in-from-top-1">
            {successMessage}
          </div>
        )}
        <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-800 disabled:text-gray-600 text-black font-black p-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-cyan-500/10">
          {loading ? <><Loader2 size={22} className="animate-spin" /> Sending</> : <><SendIcon size={20} /> Review Transfer</>}
        </button>
      </form>
      {showConfirm && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-[#1e2329] border border-white/10 rounded-2xl shadow-2xl p-5 space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-2">Confirm Transfer</p>
              <h3 className="text-xl font-black text-white">{amount || "0"} {selectedAsset.code}</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <p className="text-gray-500 font-black uppercase mb-1">Recipient</p>
                <p className="text-white font-mono break-all">{recipient.trim()}</p>
              </div>
              {memo && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <p className="text-gray-500 font-black uppercase mb-1">Memo</p>
                  <p className="text-white break-words">{memo}</p>
                </div>
              )}
              <div className="flex justify-between text-gray-400 font-bold">
                <span>Network fee</span>
                <span>{networkFee || "0.0001"} XLM</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="p-3 rounded-xl bg-white/5 text-gray-300 font-black text-xs uppercase hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeTransfer}
                disabled={loading}
                className="p-3 rounded-xl bg-cyan-500 text-black font-black text-xs uppercase hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <SendIcon size={16} />}
                Send
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {showQRScanner && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95">
          <QRScanner onClose={() => setShowQRScanner(false)} onScan={(payload) => { applyScanPayload(payload); setShowQRScanner(false); }} />
        </div>, document.body
      )}
    </div>
  );
}
