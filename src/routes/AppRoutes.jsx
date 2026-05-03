import { Routes, Route } from "react-router-dom";

import Dashboard from "@/pages/Dashboard.jsx";
import Trade from "@/pages/Trade.jsx";
import Markets from "@/pages/Markets.jsx";
import Defi from "@/pages/DeFi.jsx";
import Settings from "@/pages/Settings.jsx";

import ProtectedRoute from "@/components/ProtectedRoute.jsx";

// 🔥 ADD THIS
import NotFound from "@/pages/NotFound.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trade" element={<Trade />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/defi" element={<Defi />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* 🔥 IMPORTANT: CATCH ALL ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  ); 
}