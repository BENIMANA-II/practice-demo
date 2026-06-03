// App entry: sets up routing and decides which pages are public and which need login.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { IconContext } from '@phosphor-icons/react';

import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { ROUTES } from '@/lib/constants';

import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';
import RecoverPage from '@/pages/RecoverPage';
import DashboardPage from '@/pages/DashboardPage';
import ProductPage from '@/pages/ProductPage';
import WarehousePage from '@/pages/WarehousePage';
import TransactionPage from '@/pages/TransactionPage';
import ReportsPage from '@/pages/ReportsPage';

// Shared chrome for authenticated pages (Navbar + page content).
function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Navbar />
      {children}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <IconContext.Provider value={{ weight: 'regular' }}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path={ROUTES.landing} element={<LandingPage />} />
            <Route path={ROUTES.login} element={<AuthPage />} />
            <Route path={ROUTES.register} element={<AuthPage />} />
            <Route path={ROUTES.recover} element={<RecoverPage />} />

            {/* Protected routes */}
            <Route path={ROUTES.dashboard} element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
            <Route path={ROUTES.products} element={<ProtectedLayout><ProductPage /></ProtectedLayout>} />
            <Route path={ROUTES.warehouses} element={<ProtectedLayout><WarehousePage /></ProtectedLayout>} />
            <Route path={ROUTES.transactions} element={<ProtectedLayout><TransactionPage /></ProtectedLayout>} />
            <Route path={ROUTES.reports} element={<ProtectedLayout><ReportsPage /></ProtectedLayout>} />

            <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </IconContext.Provider>
  );
}
