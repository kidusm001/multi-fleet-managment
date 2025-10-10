import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from "react-router-dom";
import { ProtectedRoute } from '@components/Common/ProtectedRoute';
import { ROLES } from '@data/constants';
import { AuthRoute } from '@components/Common/AuthRoute';

import Footer from "@components/Common/Layout/Footer";
import ErrorBanner from '@components/Common/Organizations/ErrorBanner';
import TopBar from "@components/Common/Layout/TopBar";
import OrganizationGuard from "@components/Common/Guards/OrganizationGuard";

import { Suspense, lazy } from 'react';
const Home = lazy(() => import('@pages/Home'));
const About = lazy(() => import('@pages/About'));
const Dashboard = lazy(() => import('@pages/Dashboard'));
const RouteManagement = lazy(() => import('@pages/RouteManagement'));
const ShuttleManagement = lazy(() => import('@pages/ShuttleManagement'));
const VehicleManagement = lazy(() => import('@pages/ShuttleManagement'));
const EmployeeManagement = lazy(() => import('@pages/EmployeeManagement'));
const Payroll = lazy(() => import('@pages/Payroll'));
const Settings = lazy(() => import('@pages/Settings'));
const OrganizationManagement = lazy(() => import('@pages/OrganizationManagement'));
const Login = lazy(() => import('@pages/Auth/Login'));
const Signup = lazy(() => import('@pages/Auth/Signup'));
const OrganizationSelection = lazy(() => import('@pages/OrganizationSelection'));
const NotificationDashboard = lazy(() => import('@pages/notifications/components/notification-dashboard').then(m => ({ default: m.NotificationDashboard })));
const DriverPortal = lazy(() => import('@pages/DriverPortal'));

import { RoleProvider } from "@contexts/RoleContext";
import { OrganizationProvider } from "@contexts/OrganizationContext";
import { orgsEnabled } from '@lib/organization/flags';
import { ThemeProvider, useTheme } from "@contexts/ThemeContext";
import { AuthProvider } from "@contexts/AuthContext";
import { Toaster } from 'sonner';
import { NotificationProvider } from "@contexts/NotificationContext";
import { ToastProvider } from '@contexts/ToastContext';
import Unauthorized from "@pages/Unauthorized";
import { NotificationSound } from "@components/Common/Notifications/NotificationSound";

import "@styles/App.css";

// Layout for all authenticated/protected pages
function ProtectedLayout({ isDark }) {
  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-gray-50"} transition-colors duration-300`}>
      <TopBar />
      <div className={`main-content backdrop-blur-xl ${isDark ? "bg-black/20" : "bg-white/20"}`}>
        <main id="main" className={`content-area ${isDark ? "text-gray-100" : "text-gray-900"} pt-[60px]`}>
          <Outlet />
          {orgsEnabled() && <ErrorBanner />}
          <Footer />
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const location = useLocation();

  // Track previous path to detect leaving /notifications
  const prevPathRef = React.useRef(location.pathname);
  useEffect(() => {
    try {
      if (prevPathRef.current === '/notifications' && location.pathname !== '/notifications') {
        setTimeout(() => {
          const stale = document.querySelector('.notifications-page');
          if (stale) {
            window.location.href = location.pathname + location.search;
          }
        }, 140);
      }
      prevPathRef.current = location.pathname;
    } catch (e) {
      // Intentionally ignore errors in navigation cleanup
    }
  }, [location]);

  return (
    <div className={`app-container ${isDark ? "dark" : ""}`}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/auth/login"
          element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/auth/signup"
          element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
              <Signup />
            </Suspense>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Organization Selection - Protected but outside main layout */}
        <Route
          path="/organizations"
          element={
            <AuthRoute>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
                <OrganizationSelection />
              </Suspense>
            </AuthRoute>
          }
        />

        {/* Protected Routes Layout */}
        <Route
          element={
            <AuthRoute>
              <OrganizationGuard>
                <NotificationProvider>
                  <NotificationSound />
                  <ProtectedLayout isDark={isDark} />
                </NotificationProvider>
              </OrganizationGuard>
            </AuthRoute>
          }
        >
          <Route
            index
            element={<Suspense fallback={<div />}> <Home /> </Suspense>}
          />
          <Route
            path="/"
            element={<Suspense fallback={<div />}> <Home /> </Suspense>}
          />
          <Route
            path="about"
            element={<Suspense fallback={<div />}> <About /> </Suspense>}
          />
          <Route
            path="dashboard"
            element={<Suspense fallback={<div className="p-6">Loading dashboard…</div>}> <Dashboard /> </Suspense>}
          />
          <Route
            path="routes"
            element={
              <ProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ADMIN]}>
                <Suspense fallback={<div />}> <RouteManagement /> </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="shuttles"
            element={<Suspense fallback={<div />}> <ShuttleManagement /> </Suspense>}
          />
          <Route
            path="vehicles"
            element={<Suspense fallback={<div />}> <VehicleManagement /> </Suspense>}
          />
          <Route
            path="employees"
            element={<Suspense fallback={<div />}> <EmployeeManagement /> </Suspense>}
          />
            <Route
            path="payroll"
            element={<Suspense fallback={<div />}> <Payroll /> </Suspense>}
          />
          <Route
            path="organization-management"
            element={
              <ProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ADMIN]}>
                <Suspense fallback={<div />}> <OrganizationManagement /> </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={<Suspense fallback={<div />}> <NotificationDashboard /> </Suspense>}
          />
          <Route
            path="settings"
            element={<Suspense fallback={<div />}> <Settings /> </Suspense>}
          />
          {/* Driver Portal - Mobile optimized */}
          <Route
            path="driver/*"
            element={<Suspense fallback={<div />}> <DriverPortal /> </Suspense>}
          />
        </Route>
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RoleProvider>
          <ToastProvider>
            {orgsEnabled() ? (
              <OrganizationProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <AppContent />
                  <Toaster />
                </Router>
              </OrganizationProvider>
            ) : (
              <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AppContent />
                <Toaster />
              </Router>
            )}
          </ToastProvider>
        </RoleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
