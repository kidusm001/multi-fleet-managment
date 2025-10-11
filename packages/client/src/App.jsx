import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, Navigate } from "react-router-dom";
import { ProtectedRoute } from '@components/Common/ProtectedRoute';
import { ROLES, ROUTES } from '@data/constants';
import { AuthRoute } from '@components/Common/AuthRoute';

import Footer from "@components/Common/Layout/Footer";
import ErrorBanner from '@components/Common/Organizations/ErrorBanner';
import TopBar from "@components/Common/Layout/TopBar";
import OrganizationGuard from "@components/Common/Guards/OrganizationGuard";

import { Suspense, lazy } from 'react';
const Dashboard = lazy(() => import('@pages/Dashboard'));
const RouteManagement = lazy(() => import('@pages/RouteManagement'));
const VehicleManagement = lazy(() => import('@pages/ShuttleManagement'));
const EmployeeManagement = lazy(() => import('@pages/EmployeeManagement'));
const Payroll = lazy(() => import('@pages/Payroll'));
const Settings = lazy(() => import('@pages/Settings'));
const OrganizationManagement = lazy(() => import('@pages/OrganizationManagement'));
const Login = lazy(() => import('@pages/Auth/Login'));
const Signup = lazy(() => import('@pages/Auth/Signup'));
const OrganizationSelection = lazy(() => import('@pages/OrganizationSelection'));
const NotificationDashboard = lazy(() => import('@pages/notifications/components/notification-dashboard').then(m => ({ default: m.NotificationDashboard })));
const MobileNotificationWrapper = lazy(() => import('@pages/notifications/components/MobileNotificationWrapper').then(m => ({ default: m.MobileNotificationWrapper })));
const DriverPortal = lazy(() => import('@pages/DriverPortal'));

import { RoleProvider, useRole } from "@contexts/RoleContext";
import { OrganizationProvider } from "@contexts/OrganizationContext";
import { orgsEnabled } from '@lib/organization/flags';
import { ThemeProvider, useTheme } from "@contexts/ThemeContext";
import { AuthProvider } from "@contexts/AuthContext";
import { Toaster } from 'sonner';
import { NotificationProvider } from "@contexts/NotificationContext";
import { ToastProvider } from '@contexts/ToastContext';
import Unauthorized from "@pages/Unauthorized";
import { NotificationSound } from "@components/Common/Notifications/NotificationSound";
import { useViewport } from "@hooks/useViewport";

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

// Driver-only layout (no admin features)
function DriverLayout({ isDark }) {
  const location = useLocation();
  const isDriverPortal = location.pathname.startsWith('/driver');
  
  // Driver portal handles its own layout completely
  if (isDriverPortal) {
    return <Outlet />;
  }
  
  // For notifications and other allowed routes, show minimal layout
  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-gray-50"} transition-colors duration-300`}>
      <TopBar driverMode={true} />
      <div className={`main-content backdrop-blur-xl ${isDark ? "bg-black/20" : "bg-white/20"}`}>
        <main id="main" className={`content-area ${isDark ? "text-gray-100" : "text-gray-900"} pt-[60px]`}>
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const { role } = useRole();
  const isDark = theme === 'dark';
  const isDriver = role === ROLES.DRIVER;
  const isEmployee = role === ROLES.EMPLOYEE;
  const isSuperAdmin = role === ROLES.SUPERADMIN;
  const isOwner = role === ROLES.OWNER;
  const isAdmin = role === ROLES.ADMIN || isOwner || isSuperAdmin;
  const isManager = role === ROLES.MANAGER;
  const viewport = useViewport();
  const isMobile = viewport === 'mobile';

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

        {/* Root redirect based on roles */}
        {isDriver && <Route index element={<Navigate to={ROUTES.DRIVER_PORTAL} replace />} />}
        {isSuperAdmin && <Route index element={<Navigate to={ROUTES.ORGANIZATIONS} replace />} />}
        {isOwner && <Route index element={<Navigate to={ROUTES.ORGANIZATIONS} replace />} />}
        {isAdmin && <Route index element={<Navigate to={ROUTES.ORGANIZATION_MANAGEMENT} replace />} />}
        {isManager && <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />}
        {isEmployee && <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />}

        {/* Protected Routes Layout - Role-based */}
        <Route
          element={
            <AuthRoute>
              <OrganizationGuard>
                <NotificationProvider>
                  <NotificationSound />
                  {isDriver ? (
                    <DriverLayout isDark={isDark} />
                  ) : (
                    <ProtectedLayout isDark={isDark} />
                  )}
                </NotificationProvider>
              </OrganizationGuard>
            </AuthRoute>
          }
        >
          {/* Driver-only routes */}
          {isDriver ? (
            <>
              <Route index element={<Navigate to={ROUTES.DRIVER_PORTAL} replace />} />
              <Route
                path="driver/*"
                element={<Suspense fallback={<div />}> <DriverPortal /> </Suspense>}
              />
              <Route
                path="notifications"
                element={
                  <Suspense fallback={<div />}> 
                    {isMobile ? <MobileNotificationWrapper /> : <NotificationDashboard />} 
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={<Suspense fallback={<div />}> <Settings /> </Suspense>}
              />
              {/* Redirect all other routes to driver portal */}
              <Route path="*" element={<Navigate to={ROUTES.DRIVER_PORTAL} replace />} />
            </>
          ) : isEmployee ? (
            <>
              <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              <Route
                path="dashboard"
                element={<Suspense fallback={<div className="p-6">Loading dashboard…</div>}> <Dashboard /> </Suspense>}
              />
              <Route
                path="notifications"
                element={
                  <Suspense fallback={<div />}> 
                    {isMobile ? <MobileNotificationWrapper /> : <NotificationDashboard />} 
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={<Suspense fallback={<div />}> <Settings /> </Suspense>}
              />
              <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            </>
          ) : isManager ? (
            <>
              <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              <Route
                path="dashboard"
                element={<Suspense fallback={<div className="p-6">Loading dashboard…</div>}> <Dashboard /> </Suspense>}
              />
              <Route
                path="routes"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
                    <Suspense fallback={<div />}> <RouteManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="vehicles"
                element={<Suspense fallback={<div />}> <VehicleManagement /> </Suspense>}
              />
              <Route
                path="employees"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
                    <Suspense fallback={<div />}> <EmployeeManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="notifications"
                element={
                  <Suspense fallback={<div />}> 
                    {isMobile ? <MobileNotificationWrapper /> : <NotificationDashboard />} 
                  </Suspense>
                }
              />
              <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            </>
          ) : isAdmin ? (
            <>
              <Route index element={<Navigate to={ROUTES.ORGANIZATION_MANAGEMENT} replace />} />
              <Route
                path="dashboard"
                element={<Suspense fallback={<div className="p-6">Loading dashboard…</div>}> <Dashboard /> </Suspense>}
              />
              <Route
                path="routes"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <Suspense fallback={<div />}> <RouteManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="vehicles"
                element={<Suspense fallback={<div />}> <VehicleManagement /> </Suspense>}
              />
              <Route
                path="employees"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <Suspense fallback={<div />}> <EmployeeManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="payroll"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <Suspense fallback={<div />}> <Payroll /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="organization-management"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <Suspense fallback={<div />}> <OrganizationManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="notifications"
                element={
                  <Suspense fallback={<div />}> 
                    {isMobile ? <MobileNotificationWrapper /> : <NotificationDashboard />} 
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={<Suspense fallback={<div />}> <Settings /> </Suspense>}
              />
              <Route path="*" element={<Navigate to={ROUTES.ORGANIZATION_MANAGEMENT} replace />} />
            </>
          ) : (isSuperAdmin || isOwner) ? (
            <>
              <Route index element={<Navigate to={ROUTES.ORGANIZATIONS} replace />} />
              <Route
                path="dashboard"
                element={<Suspense fallback={<div className="p-6">Loading dashboard…</div>}> <Dashboard /> </Suspense>}
              />
              <Route
                path="routes"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.OWNER]}>
                    <Suspense fallback={<div />}> <RouteManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="vehicles"
                element={<Suspense fallback={<div />}> <VehicleManagement /> </Suspense>}
              />
              <Route
                path="employees"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.OWNER]}>
                    <Suspense fallback={<div />}> <EmployeeManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="payroll"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.OWNER]}>
                    <Suspense fallback={<div />}> <Payroll /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="organizations"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.OWNER]}>
                    <Suspense fallback={<div />}> <OrganizationSelection /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="organization-management"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.OWNER]}>
                    <Suspense fallback={<div />}> <OrganizationManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="notifications"
                element={
                  <Suspense fallback={<div />}> 
                    {isMobile ? <MobileNotificationWrapper /> : <NotificationDashboard />} 
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={<Suspense fallback={<div />}> <Settings /> </Suspense>}
              />
              <Route path="*" element={<Navigate to={ROUTES.ORGANIZATIONS} replace />} />
            </>
          ) : (
            <>
              {/* Fallback for unknown roles */}
              <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              <Route
                path="dashboard"
                element={<Suspense fallback={<div className="p-6">Loading dashboard…</div>}> <Dashboard /> </Suspense>}
              />
              <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            </>
          )}
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
