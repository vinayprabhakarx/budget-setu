import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthProvider';
import { ToastProvider } from './context/ToastProvider';
import { DateFilterProvider } from './context/DateFilterProvider';
import { ImportProcessProvider } from './context/ImportProcessContext';
import { MainLayout } from './components/layout/MainLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { CookieBanner } from './components/shared/CookieBanner';

// Pages - Protected
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/app/Dashboard';
import { Analytics } from './pages/app/Analytics';
import { Transactions } from './pages/app/Transactions';
import { Budgets } from './pages/app/Budgets';

import { Accounts } from './pages/app/Accounts';
import { ImportDetails } from './pages/app/ImportDetails';
import { Profile } from './pages/settings/Profile';
import { BackupRestore } from './pages/settings/BackupRestore';
import { DeleteAccount } from './pages/settings/DeleteAccount';

// Pages - Admin
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminUserManagement } from './pages/admin/AdminUserManagement';
import { AdminSystemLogs } from './pages/admin/AdminSystemLogs';
import { AdminContactSubmissions } from './pages/admin/AdminContactSubmissions';
import { AdminMerchantRules } from './pages/admin/AdminMerchantRules';

// Pages - Public & Legal
import { Hero } from './pages/public/Hero';
import { Pricing } from './pages/public/Pricing';
import { About } from './pages/public/About';
import { Contact } from './pages/public/Contact';
import { Privacy } from './pages/legal/Privacy';
import { Terms } from './pages/legal/Terms';
import { CookiePolicy } from './pages/legal/CookiePolicy';
import { DataDeletion } from './pages/settings/DataDeletion';
import { EmailVerification } from './pages/auth/EmailVerification';
import { EmailVerificationCode } from './pages/auth/EmailVerificationCode';
import { EmailVerificationResult } from './pages/auth/EmailVerificationResult';
import { PasswordReset } from './pages/auth/PasswordReset';
import { PasswordResetConfirm } from './pages/auth/PasswordResetConfirm';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

// Protected Route Wrapper for Normal Users
const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base text-brand flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if ((user as {role?: string}).role === 'ADMIN') {
    // Allow admins to access profile settings, but redirect other user pages to admin panel
    if (!location.pathname.startsWith('/profile') && !location.pathname.startsWith('/delete-account') && !location.pathname.startsWith('/backup-restore')) {
      return <Navigate to="/dashboard" replace />;
    }
    return <AdminLayout><Outlet /></AdminLayout>;
  }

  return <MainLayout><Outlet /></MainLayout>;
};

// Admin Route Wrapper
const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base text-brand flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Fallback to type checking or cast to any if role is missing in types
  if ((user as {role?: string}).role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <AdminLayout><Outlet /></AdminLayout>;
};

// Universal Dashboard Route Wrapper
const DashboardRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base text-brand flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if ((user as {role?: string}).role === 'ADMIN') {
    return <AdminLayout><AdminOverview /></AdminLayout>;
  }

  return <MainLayout><Dashboard /></MainLayout>;
};

// Public Only Route Wrapper (e.g. Login page)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base text-brand flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <DateFilterProvider>
            <ImportProcessProvider>
              <Routes>
              {/* Public Marketing & Info Pages */}
              <Route path="/" element={<Hero />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* Legal & Compliance Pages */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/data-deletion" element={<DataDeletion />} />

              {/* Public Authentications */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/magic-link" element={<EmailVerificationCode />} />
              <Route path="/verify-email/confirm" element={<EmailVerificationResult />} />
              <Route path="/reset-password" element={<PasswordReset />} />
              <Route path="/reset-password/confirm" element={<PasswordResetConfirm />} />

              {/* Universal Dashboard */}
              <Route path="/dashboard" element={<DashboardRoute />} />

              {/* Private Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/transactions" element={<Transactions />} />
                
                {/* Budget Routes */}
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/budgets/recurring" element={<Budgets />} />
                <Route path="/budgets/goals" element={<Budgets />} />
                
                {/* Account Routes */}
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/accounts/import" element={<Accounts />} />
                <Route path="/accounts/import/:importId" element={<ImportDetails />} />
                
                {/* Settings Routes */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/backup-restore" element={<BackupRestore />} />
                <Route path="/delete-account" element={<DeleteAccount />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/users" element={<AdminUserManagement />} />
                <Route path="/contact-submissions" element={<AdminContactSubmissions />} />
                <Route path="/logs" element={<AdminSystemLogs />} />
                <Route path="/admin/merchant-rules" element={<AdminMerchantRules />} />
              </Route>

              {/* Catch all redirecting */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <CookieBanner />
            </ImportProcessProvider>
          </DateFilterProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
