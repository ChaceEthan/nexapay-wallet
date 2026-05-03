import React, { useState, useMemo } from "react";
import { X, Copy, Check, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

/**
 * ReceiveModal - High-Fidelity Asset Deposit Interface
 * - Stable QR rendering with NexaPay logo integration
 * - Fixed overlay positioning to prevent layout shifts
 * - Mobile-optimized compact layout
 */
export default function ReceiveModal({ address, onClose }) {
  const [copied, setCopied] = useState(false);

  // Ensure the QR code data is memoized to prevent unstable re-renders
  const qrValue = useMemo(() => address || "", [address]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[20000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-[#1e2329] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button: Instantly closes and triggers parent state reset */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full z-20"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <header className="text-center mb-6">
          <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-500 border border-cyan-500/20">
            <QrCode size={24} />
          </div>
          <h3 className="text-xl font-black text-white">Receive Assets</h3>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
            Institutional Deposit Terminal
          </p>
        </header>

        {/* STABLE QR SECTION WITH LOGO OVERLAY */}
        <div className="relative bg-white p-5 rounded-[2rem] shadow-2xl mb-6 flex items-center justify-center overflow-hidden">
          <QRCodeSVG
            value={qrValue}
            size={180}
            level="H" // High error correction for logo tolerance
            includeMargin={false}
            imageSettings={{
              src: "/logo.png", // Path to NexaPay logo (image layer)
              height: 38,
              width: 38,
              excavate: true, // Prevents QR modules from rendering behind the logo
            }}
          />
        </div>

        <div className="space-y-4">
           <div className="bg-black/40 border border-white/5 rounded-2xl p-4 relative">
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Your Public Address</p>
              <p className="text-white font-mono text-[11px] break-all leading-relaxed pr-10">
                {address}
              </p>
              <button 
                onClick={handleCopy}
                className="absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-cyan-500 transition-all active:scale-90"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
           </div>

           <p className="text-[9px] text-gray-500 text-center font-medium leading-relaxed px-2">
              Deposits arrive via the Stellar Network. Ensure you are sending XLM or Nexa-supported assets only.
           </p>
        </div>
      </div>
    </div>
  );
}