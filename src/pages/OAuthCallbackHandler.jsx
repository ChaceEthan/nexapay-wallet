// import React, { useEffect } from 'react'; // No longer needed
// import { useLocation, useNavigate } from 'react-router-dom'; // No longer needed
// import { useDispatch } from 'react-redux'; // No longer needed
// import { setToken } from '../authSlice.js'; // setToken removed, not exported
import { useNavigate } from 'react-router-dom'; // Only navigate is needed now
import { Loader2 } from 'lucide-react'; // For loading spinner

/**
 * OAuthCallbackHandler
 * Handles the final step of server-side OAuth redirect flows (e.g., Apple).
 * Extracts tokens from the URL and directs the user to either onboarding or the selector.
 * 
 * 🔴 CRITICAL: With the complete removal of the sign-in system, this component
 * should no longer be functional. Its purpose was tied to authentication.
 * It is now repurposed to immediately redirect to the main wallet flow.
 */
export default function OAuthCallbackHandler() {
  // const location = useLocation(); // Not needed as we no longer process URL params
  const navigate = useNavigate();
  // const dispatch = useDispatch(); // Not needed as setToken is removed

  useEffect(() => {
    // Immediately redirect to the primary wallet entry point.
    // The App.jsx root will then handle further routing based on wallet state.
    // This ensures no lingering auth logic or incorrect states.
    console.warn("OAuthCallbackHandler hit, redirecting to root wallet flow.");
    
    // We can directly navigate to the root, and App.jsx's logic will take over.
    // For clarity, we can still determine initial entry points like so:
        const wallets = JSON.parse(localStorage.getItem("nexa_wallets") || "[]");
        
        if (wallets.length === 0) {
          navigate('/welcome', { replace: true }); // FIX 3: Start onboarding if no wallets
        } else {
          // FIX 3: If wallets exist, check for PIN setup or go to wallet selection
          navigate(localStorage.getItem("nexa_pin") ? '/select-wallet' : '/set-pin', { replace: true });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]); // Only navigate is a dependency

  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center text-white p-6">
      <div className="w-full max-w-md bg-[#1e2329] border border-[#2b3139] rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center gap-6 text-center">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
        <h2 className="text-2xl font-bold">Securing Session...</h2>
      </div>
    </div>
  );
}