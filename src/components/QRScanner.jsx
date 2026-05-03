import React, { useState, useRef, useEffect } from "react";
import { X, QrCode, AlertCircle, CheckCircle, Zap, ShieldCheck } from "lucide-react";
import { StrKey } from "@stellar/stellar-sdk";
import { Html5Qrcode } from "html5-qrcode";
import { createPortal } from "react-dom";
import { parseQrPayload, safeNumber } from "@/services/api";

/**
 * QRScanner - Ultra-Clear Professional Edition
 * - 100% raw camera visibility with zero dark overlays or blurs
 * - Hardware-accelerated brightness (1.6x) and contrast (1.4x)
 * - Instant environment-mode lens lock
 * - Clean institutional UI with minimal obstruction
 */
export default function QRScanner({ onClose, onScan }) {
  const [scanned, setScanned] = useState(false); 
  const [error, setError] = useState("");
  const [validAddress, setValidAddress] = useState(null);
  const qrScannerRef = useRef(null);
  const parsingRef = useRef(false);
  const lastDecodedRef = useRef("");

  useEffect(() => {
    let isUnmounted = false;
    const html5QrCode = new Html5Qrcode("qr-scanner-view");
    qrScannerRef.current = html5QrCode;

    // Brief delay to ensure the DOM viewport is ready for the video stream
    const timer = setTimeout(() => {
      if (!isUnmounted) startScan(html5QrCode);
    }, 50);
    
    return () => {
      isUnmounted = true;
      clearTimeout(timer);

      // Release camera hardware safely on unmount
      const releaseHardware = async () => {
        try {
          // Only stop if the library reports an active scan
          if (html5QrCode.isScanning) {
            await html5QrCode.stop();
          }
          html5QrCode.clear();
        } catch (err) {
          // Silent fail if already stopped
        }
      };
      releaseHardware();
    };
  }, []);

  const startScan = async (scannerInstance) => {
    if (scanned) return;
    setError("");

    try {
      await scannerInstance.start(
        {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [
            { focusMode: "continuous" },
            { exposureMode: "continuous" },
          ],
        },
        { 
          fps: 30,
          qrbox: { width: Math.min(320, window.innerWidth - 48), height: Math.min(320, window.innerWidth - 48) },
          aspectRatio: 1.0,
          disableFlip: true,
          rememberLastUsedCamera: false,
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {} // Quiet scan errors
      );
      tuneCameraTrack();
    } catch (err) {
      console.error("Scanner Error:", err);
      setError("Hardware Access Failed. Check Permissions.");
    }
  };

  const tuneCameraTrack = async () => {
    try {
      const video = document.querySelector("#qr-scanner-view video");
      const track = video?.srcObject?.getVideoTracks?.()[0];
      const capabilities = track?.getCapabilities?.();
      if (!track || !capabilities) return;

      const advanced = [];
      if (capabilities.focusMode?.includes("continuous")) advanced.push({ focusMode: "continuous" });
      if (capabilities.exposureMode?.includes("continuous")) advanced.push({ exposureMode: "continuous" });
      if (capabilities.whiteBalanceMode?.includes("continuous")) advanced.push({ whiteBalanceMode: "continuous" });
      if (capabilities.zoom?.max && capabilities.zoom.max > 1) advanced.push({ zoom: Math.min(1.4, capabilities.zoom.max) });

      if (advanced.length > 0) await track.applyConstraints({ advanced });
    } catch {
      // Camera controls are device/browser-specific; scan remains active without them.
    }
  };

  const handleDecodedText = async (decodedText) => {
    const raw = String(decodedText || "").trim();
    if (!raw || scanned || parsingRef.current || raw === lastDecodedRef.current) return;

    parsingRef.current = true;
    lastDecodedRef.current = raw;
    setError("");

    try {
      const parsed = await parseQrPayload(raw);
      const address = parsed?.address?.trim();

      if (!StrKey.isValidEd25519PublicKey(address)) {
        throw new Error("Invalid Stellar address.");
      }

      if (parsed.amount && safeNumber(parsed.amount, 0) <= 0) {
        throw new Error("Invalid payment amount.");
      }

      setScanned(true);
      setValidAddress(address);
      onScan(parsed);
      setTimeout(() => handleClose(), 800);
    } catch (err) {
      setError(err?.message || "Invalid QR Code.");
      setTimeout(() => {
        if (!scanned) lastDecodedRef.current = "";
      }, 1500);
    } finally {
      parsingRef.current = false;
    }
  };

  const handleClose = async () => {
    // Closing just triggers state change; useEffect cleanup handles hardware release
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-[#0b0e11] overflow-hidden select-none">
      
      {/* 🟢 ULTRA-BRIGHT CAMERA VIEWPORT */}
      <div className="absolute inset-0 z-0">
        <div 
          id="qr-scanner-view" 
          className="w-full h-full [&>video]:object-cover [&>video]:brightness-[1.85] [&>video]:contrast-[1.55] [&>video]:saturate-[1.35] [&>video]:will-change-transform" 
        />
      </div>

      {/* ⚪ CLEAN INTERFACE OVERLAY (NO BLUR, NO DARKNESS) */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        
        {/* TOP HUB */}
        <div className="p-8 flex justify-between items-center bg-gradient-to-b from-black/40 to-transparent pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40 shadow-2xl">
              <QrCode size={24} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-white font-black uppercase tracking-[0.2em] text-xs">Nexa Scanner</p>
              <p className="text-cyan-500/80 text-[10px] font-black uppercase tracking-widest mt-1">Institutional Lens v4.0</p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="w-14 h-14 rounded-2xl bg-black/50 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20 active:scale-90"
          >
            <X size={28} />
          </button>
        </div>

        {/* SCAN ZONE INDICATOR */}
        <div className="flex-1 flex items-center justify-center">
            <div className="relative w-[min(320px,calc(100vw-48px))] h-[min(320px,calc(100vw-48px))]">
                <div className="absolute inset-0 rounded-[2rem] border border-white/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]" />
                {/* HIGH-CONTRAST TARGET CORNERS */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-[10px] border-l-[10px] border-cyan-400 rounded-tl-3xl shadow-[0_0_30px_rgba(34,211,238,0.6)]" />
                <div className="absolute top-0 right-0 w-16 h-16 border-t-[10px] border-r-[10px] border-cyan-400 rounded-tr-3xl shadow-[0_0_30px_rgba(34,211,238,0.6)]" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-[10px] border-l-[10px] border-cyan-400 rounded-bl-3xl shadow-[0_0_30px_rgba(34,211,238,0.6)]" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-[10px] border-r-[10px] border-cyan-400 rounded-br-3xl shadow-[0_0_30px_rgba(34,211,238,0.6)]" />

                {/* ANIMATED SCAN BEAM */}
                {!validAddress && !error && (
                    <div className="absolute left-0 right-0 h-[8px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_40px_rgba(34,211,238,1)] animate-scan-beam top-0" />
                )}

                {/* POSITIVE VERIFICATION HUB */}
                {validAddress && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 rounded-[2.5rem] border-[6px] border-emerald-400 shadow-[0_0_100px_rgba(16,185,129,0.4)]">
                        <CheckCircle size={100} className="text-emerald-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] mb-4" />
                        <span className="text-white font-black text-sm uppercase tracking-[0.5em]">Verified</span>
                    </div>
                )}
            </div>
        </div>

        {/* BOTTOM STATUS CENTER */}
        <div className="p-12 text-center bg-gradient-to-t from-black/60 to-transparent">
          {validAddress ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <p className="text-emerald-400 font-black text-2xl tracking-tighter uppercase mb-3">Identity Captured</p>
              <div className="bg-black/80 px-8 py-3 rounded-full border border-white/10 shadow-2xl inline-block">
                <p className="text-white text-[11px] font-mono font-black">{validAddress}</p>
              </div>
            </div>
          ) : error ? (
            <div className="inline-flex items-center gap-4 text-red-400 bg-black/80 px-10 py-5 rounded-[2rem] border border-red-500/30 animate-pulse shadow-2xl">
              <AlertCircle size={28} />
              <p className="text-sm font-black uppercase tracking-widest">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="inline-flex items-center gap-4 bg-cyan-500/10 border border-cyan-500/20 px-8 py-3 rounded-full shadow-2xl">
                <Zap size={16} className="text-cyan-400 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Institutional Scan Engine Active</span>
              </div>
              <div className="space-y-2">
                <p className="text-white text-3xl font-black tracking-tight">Point at Public Address</p>
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest opacity-80 leading-relaxed">
                  Fastest Detection: Center the QR Code within the frame
                </p>
              </div>
            </div>
          )}
        </div>

        {/* DYNAMIC STYLES */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes scan-beam {
            0% { top: -5%; }
            50% { top: 100%; }
            100% { top: -5%; }
          }
          .animate-scan-beam {
            animation: scan-beam 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          #qr-scanner-view video {
             width: 100% !important;
             height: 100% !important;
             object-fit: cover !important;
          }
        `}} />
      </div>
    </div>,
    document.body
  );
}
