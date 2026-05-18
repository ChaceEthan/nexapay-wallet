import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Html5Qrcode } from "html5-qrcode";
import { StrKey } from "@stellar/stellar-sdk";
import { X, ScanLine, AlertCircle, CheckCircle, Focus } from "lucide-react";
import { api, backendPath, parseQrPayload, safeNumber } from "@/services/api";
import { playFeedback } from "@/utils/feedback";

const getResolvedAddress = async (address) => {
  try {
    const response = await api.get(backendPath(`/api/resolve-address/${encodeURIComponent(address)}`));
    const data = response.data?.data || response.data || {};
    const resolved =
      data.address ||
      data.publicKey ||
      data.account ||
      data.destination ||
      data.recipient ||
      address;

    return String(resolved).trim();
  } catch {
    return address;
  }
};

export default function QRScannerModal({ onClose, onScan }) {
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState("");
  const [validAddress, setValidAddress] = useState(null);

  const scannerIdRef = useRef(`qr-scanner-view-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef(null);
  const mountedRef = useRef(false);
  const startingRef = useRef(false);
  const closingRef = useRef(false);
  const parsingRef = useRef(false);
  const lastDecodedRef = useRef("");

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    startingRef.current = false;

    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      // The camera may already be released by the browser.
    }

    try {
      scanner.clear();
    } catch {
      // Clear is best-effort after stop.
    }

    if (typeof window !== "undefined" && window.__nexaQrScanner === scanner) {
      window.__nexaQrScanner = null;
    }
  }, []);

  const handleClose = useCallback(async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    await stopScanner();
    onClose?.();
  }, [onClose, stopScanner]);

  const tuneCameraTrack = useCallback(async () => {
    try {
      const video = document.querySelector(`#${scannerIdRef.current} video`);
      const track = video?.srcObject?.getVideoTracks?.()[0];
      const capabilities = track?.getCapabilities?.();
      if (!track || !capabilities) return;

      const advanced = [];
      if (capabilities.focusMode?.includes("continuous")) advanced.push({ focusMode: "continuous" });
      if (capabilities.exposureMode?.includes("continuous")) advanced.push({ exposureMode: "continuous" });
      if (capabilities.whiteBalanceMode?.includes("continuous")) advanced.push({ whiteBalanceMode: "continuous" });
      if (capabilities.zoom?.max && capabilities.zoom.max > 1) advanced.push({ zoom: Math.min(1.25, capabilities.zoom.max) });

      if (advanced.length > 0) await track.applyConstraints({ advanced });
    } catch {
      // Device camera controls vary; scanning still works without them.
    }
  }, []);

  const handleDecodedText = useCallback(async (decodedText) => {
    const raw = String(decodedText || "").trim();
    if (!raw || scanned || parsingRef.current || raw === lastDecodedRef.current) return;

    parsingRef.current = true;
    lastDecodedRef.current = raw;
    setError("");

    try {
      const parsed = await parseQrPayload(raw);
      const address = String(parsed?.address || "").trim();

      if (!StrKey.isValidEd25519PublicKey(address)) {
        throw new Error("Invalid Stellar address.");
      }

      if (parsed.amount && safeNumber(parsed.amount, 0) <= 0) {
        throw new Error("Invalid payment amount.");
      }

      const resolvedAddress = await getResolvedAddress(address);
      if (!StrKey.isValidEd25519PublicKey(resolvedAddress)) {
        throw new Error("Resolved address is invalid.");
      }

      const payload = { ...parsed, address: resolvedAddress };
      setScanned(true);
      setValidAddress(resolvedAddress);
      playFeedback();
      onScan?.(payload);
      window.setTimeout(() => {
        handleClose();
      }, 350);
    } catch (err) {
      setError(err?.message || "Invalid QR code.");
      window.setTimeout(() => {
        if (mountedRef.current && !scanned) lastDecodedRef.current = "";
      }, 1200);
    } finally {
      parsingRef.current = false;
    }
  }, [handleClose, onScan, scanned]);

  const startScanner = useCallback(async () => {
    if (startingRef.current || scannerRef.current || closingRef.current) return;
    if (typeof window === "undefined" || !mountedRef.current) return;

    startingRef.current = true;
    setError("");

    try {
      if (window.__nexaQrScanner && window.__nexaQrScanner !== scannerRef.current) {
        try {
          if (window.__nexaQrScanner.isScanning) await window.__nexaQrScanner.stop();
          window.__nexaQrScanner.clear();
        } catch {
          // Previous scanner instance is stale; continue with a fresh one.
        }
        window.__nexaQrScanner = null;
      }

      const scanner = new Html5Qrcode(scannerIdRef.current);
      scannerRef.current = scanner;
      window.__nexaQrScanner = scanner;

      await scanner.start(
        {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight, 340));
            return { width: edge, height: edge };
          },
          aspectRatio: 1,
          disableFlip: true,
          rememberLastUsedCamera: false,
        },
        handleDecodedText,
        () => {}
      );

      await tuneCameraTrack();
    } catch {
      await stopScanner();
      if (mountedRef.current) {
        setError("Camera access failed. Check permissions and try again.");
      }
    } finally {
      startingRef.current = false;
    }
  }, [handleDecodedText, stopScanner, tuneCameraTrack]);

  useEffect(() => {
    mountedRef.current = true;
    const timer = window.setTimeout(startScanner, 100);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-[#0b0e11] overflow-hidden select-none">
      <div className="absolute inset-0 z-0">
        <div
          id={scannerIdRef.current}
          className="w-full h-full [&>video]:object-cover [&>video]:brightness-[1.7] [&>video]:contrast-[1.35] [&>video]:saturate-[1.1]"
        />
      </div>

      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        <div className="p-5 sm:p-8 flex justify-between items-center bg-gradient-to-b from-black/45 to-transparent pointer-events-auto">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40 shadow-2xl">
              <ScanLine size={24} className="text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-black uppercase tracking-[0.2em] text-xs">Nexa Scanner</p>
              <p className="text-cyan-500/80 text-[10px] font-black uppercase tracking-widest mt-1">Secure address scan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black/55 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20 active:scale-90"
            aria-label="Close scanner"
          >
            <X size={26} />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-[min(320px,calc(100vw-48px))] h-[min(320px,calc(100vw-48px))]">
            <div className="absolute inset-0 rounded-[2rem] border border-white/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]" />
            <div className="absolute top-0 left-0 w-16 h-16 border-t-[10px] border-l-[10px] border-cyan-400 rounded-tl-3xl shadow-[0_0_30px_rgba(34,211,238,0.6)]" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-[10px] border-r-[10px] border-cyan-400 rounded-tr-3xl shadow-[0_0_30px_rgba(34,211,238,0.6)]" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-[10px] border-l-[10px] border-cyan-400 rounded-bl-3xl shadow-[0_0_30px_rgba(34,211,238,0.6)]" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-[10px] border-r-[10px] border-cyan-400 rounded-br-3xl shadow-[0_0_30px_rgba(34,211,238,0.6)]" />

            {!validAddress && !error && (
              <div className="absolute left-0 right-0 h-[8px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_40px_rgba(34,211,238,1)] animate-scan-beam top-0" />
            )}

            {validAddress && (
              <div className="absolute inset-0 bg-emerald-500/20 flex flex-col items-center justify-center rounded-[2.5rem] border-[6px] border-emerald-400 shadow-[0_0_100px_rgba(16,185,129,0.4)]">
                <CheckCircle size={96} className="text-emerald-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] mb-4" />
                <span className="text-white font-black text-sm uppercase tracking-[0.5em]">Verified</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-10 text-center bg-gradient-to-t from-black/65 to-transparent">
          {validAddress ? (
            <div>
              <p className="text-emerald-400 font-black text-xl sm:text-2xl tracking-tighter uppercase mb-3">Identity Captured</p>
              <div className="bg-black/80 px-4 sm:px-8 py-3 rounded-full border border-white/10 shadow-2xl inline-block max-w-full">
                <p className="text-white text-[10px] sm:text-[11px] font-mono font-black break-all">{validAddress}</p>
              </div>
            </div>
          ) : error ? (
            <div className="inline-flex items-center gap-3 text-red-400 bg-black/80 px-5 sm:px-8 py-4 rounded-[1.5rem] border border-red-500/30 shadow-2xl max-w-full">
              <AlertCircle size={24} className="shrink-0" />
              <p className="text-xs sm:text-sm font-black uppercase tracking-widest">{error}</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/20 px-5 sm:px-8 py-3 rounded-full shadow-2xl">
                <Focus size={16} className="text-cyan-400 animate-pulse" />
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-white">Scan Engine Active</span>
              </div>
              <div className="space-y-2">
                <p className="text-white text-2xl sm:text-3xl font-black tracking-tight">Point at Public Address</p>
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest opacity-80 leading-relaxed">
                  Supports Stellar payment links and G addresses
                </p>
              </div>
            </div>
          )}
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes scan-beam {
            0% { top: -5%; }
            50% { top: 100%; }
            100% { top: -5%; }
          }
          .animate-scan-beam {
            animation: scan-beam 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          #${scannerIdRef.current} video {
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
