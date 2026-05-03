import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * Global Back Button Component
 * Responsive floating UI for mobile and desktop navigation.
 * Only appears on sub-pages (not home/auth by default).
 */
export default function GlobalBackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Hide on root pages where "Back" doesn't make sense
  const hiddenOn = ["/signin", "/signup", "/dashboard", "/"];
  if (hiddenOn.includes(pathname)) return null;

  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        position: 'fixed',
        width: 'auto',
        maxWidth: 'max-content',
        height: 'auto',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      className="bottom-6 right-6 md:top-6 md:left-[17rem] 
                 w-12 h-12 md:w-auto md:h-auto px-0 md:px-4 md:py-2 
                 bg-[#1e2329] border border-gray-800 
                 text-gray-300 hover:text-cyan-400 hover:border-cyan-500
                 rounded-full md:rounded-xl shadow-2xl transition-all active:scale-95
                 group backdrop-blur-xl"
      aria-label="Go Back"
    >
      <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      <span className="hidden md:inline text-xs font-black uppercase tracking-tighter">Back</span>
    </button>
  );
}
