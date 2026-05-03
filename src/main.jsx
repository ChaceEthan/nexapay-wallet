import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux"; 
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import store from "./store.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css"; 
 
// 🛡️ Vite Stability: Prevent ERR_NETWORK_CHANGED crashes
// Catch dynamic import failures (common during network swaps) and force a clean reload
const handlePreloadError = (event) => {
  console.warn("Network change detected, refreshing modules...");
  window.location.reload();
};

window.addEventListener('vite:preloadError', handlePreloadError);
window.addEventListener('error', (e) => {
  if (e.message?.includes('FetchRemoteError') || e.message?.includes('Failed to fetch dynamically imported module')) {
    handlePreloadError();
  }
});

// 🛡️ Production Security: Runtime log suppression
if (import.meta.env.PROD) {
  window.console.log = () => {};
  window.console.info = () => {};
  window.console.warn = () => {};
  // console.error is typically retained for critical error tracking
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
);