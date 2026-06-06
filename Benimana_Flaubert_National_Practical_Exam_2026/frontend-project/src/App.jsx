import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import RecoverPage from "@/pages/RecoverPage";
import DashboardPage from "@/pages/DashboardPage";
import CustomerPage from "@/pages/CustomerPage";
import VehiclePage from "@/pages/VehiclePage";
import ReservationPage from "@/pages/ReservationPage";
import ReportsPage from "@/pages/ReportsPage";
import UsersPage from "@/pages/UsersPage";

// Wraps protected pages with the shared Navbar.
// adminOnly pages redirect non-admins back to the dashboard.
function ProtectedLayout({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (adminOnly && user && user.Role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <ProtectedRoute>
      <Navbar />
      <main>{children}</main>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/recover" element={<RecoverPage />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
        <Route path="/customers" element={<ProtectedLayout><CustomerPage /></ProtectedLayout>} />
        <Route path="/vehicles" element={<ProtectedLayout><VehiclePage /></ProtectedLayout>} />
        <Route path="/reservations" element={<ProtectedLayout><ReservationPage /></ProtectedLayout>} />
        <Route path="/reports" element={<ProtectedLayout><ReportsPage /></ProtectedLayout>} />
        <Route path="/users" element={<ProtectedLayout adminOnly><UsersPage /></ProtectedLayout>} />
      </Routes>
      <Toaster />
    </>
  );
}
