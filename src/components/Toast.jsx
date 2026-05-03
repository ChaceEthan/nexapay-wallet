import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { hideToast } from "../toastSlice";

export default function Toast() {
  // 🛡️ CRASH PROTECTION: Safe selector with fallback to prevent destruction of undefined
  const toastState = useSelector((state) => state.toast) || { 
    message: "", visible: false, type: "info" 
  };
  
  const { message, visible, type } = toastState;
  const dispatch = useDispatch();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, dispatch]);

  if (!visible) return null;

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] animate-in slide-in-from-top duration-300">
      <div className={`px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 border whitespace-nowrap
        ${type === 'error' 
          ? 'bg-red-500/20 border-red-500/50 text-red-400 backdrop-blur-xl' 
          : 'bg-cyan-500 text-black border-cyan-400'}`}>
        {message}
      </div>
    </div>
  );
}