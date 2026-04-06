import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Assuming Dashboard exists in pages/ or src/. 
// If Dashboard is missing, the build will fail here.
// Based on your structure, Auth is in src/
import Dashboard from "./components/Dashboard"; 
import Auth from "./Auth";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[80vh] max-w-6xl mx-auto p-4 md:p-6 text-center text-red-100 bg-red-950/30 rounded-xl">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <pre className="mt-4 text-xs text-rose-300 break-words">{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
      <Route path="/auth" element={<ErrorBoundary><Auth /></ErrorBoundary>} />
      <Route path="/signin" element={<Navigate to="/auth?mode=signin" replace />} />
      <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
