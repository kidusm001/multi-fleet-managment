import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, Navigate, useNavigate } from "react-router-dom";
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
const EmployeePortal = lazy(() => import('@pages/EmployeePortal'));
const Home = lazy(() => import('@pages/Home'));
const Profile = lazy(() => import('@pages/Profile'));

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
import ThemeToggle from "@components/Common/UI/ThemeToggle";
import { NotificationDropdown } from "@components/Common/Notifications/NotificationDropdown";
import { UserDropdown } from "@/components/Common/Layout/TopBar/user-dropdown-menu";
import { Link } from "react-router-dom";
import { cn } from "@lib/utils";
import { LayoutDashboard, Send } from "lucide-react";
import LoadingAnimation from "@components/Common/LoadingAnimation";

import "@styles/App.css";

// Employee TopBar - Minimal version for employee portal
function EmployeeTopBar() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/employee-portal' },
    { id: 'request', label: 'Request Shuttle', icon: Send, path: '/employee-portal/request' },
  ];

  const activeTab = location.pathname === '/employee-portal/request' ? 'request' : 'dashboard';

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 border-b h-[60px]",
      isDark ? "bg-slate-900/95 border-slate-700" : "bg-white/95 border-gray-200"
    )}>
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <Link to="/employee-portal" className="flex items-center space-x-2">
            <img
              src={isDark ? "/assets/images/logo-light.png" : "/assets/images/logo-dark.PNG"}
              alt="Fleet Management"
              className="h-6 sm:h-8 w-auto"
            />
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-4 sm:space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "group inline-flex items-center py-1.5 sm:py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : cn(
                        "border-transparent",
                        isDark
                          ? "text-gray-400 hover:text-gray-300 hover:border-gray-600"
                          : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      )
                )}
              >
                <Icon
                  className={cn(
                    "mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 transition-colors",
                    isActive
                      ? "text-primary"
                      : isDark
                      ? "text-gray-400 group-hover:text-gray-300"
                      : "text-gray-400 group-hover:text-gray-500"
                  )}
                  aria-hidden="true"
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <ThemeToggle />
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </div>
    </div>
  );
}

// Layout for all authenticated/protected pages
function ProtectedLayout({ isDark }) {
  const location = useLocation();
  const isHomeLanding = location.pathname === ROUTES.HOME;
  const isEmployeePortal = location.pathname.startsWith('/employee-portal');

  if (isHomeLanding) {
    return <Outlet />;
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-gray-50"} transition-colors duration-300`}>
      {isEmployeePortal ? <EmployeeTopBar /> : <TopBar />}
      <div className={`main-content backdrop-blur-xl ${isDark ? "bg-black/20" : "bg-white/20"}`}>
        <main id="main" className={`content-area ${isDark ? "text-gray-100" : "text-gray-900"} pt-[60px]`}>
          <Outlet />
          {orgsEnabled() && <ErrorBanner />}
          {!isEmployeePortal && <Footer />}
        </main>
      </div>
    </div>
  );
}

// Driver-only layout (no admin features)
function DriverLayout({ isDark }) {
  const location = useLocation();
  const isDriverPortal = location.pathname.startsWith('/driver');
  const isHomeLanding = location.pathname === ROUTES.HOME;
  
  // Driver portal handles its own layout completely
  if (isDriverPortal) {
    return <Outlet />;
  }

  if (isHomeLanding) {
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
  const isAdmin = role === ROLES.ADMIN;
  const isManager = role === ROLES.MANAGER;
  const viewport = useViewport();
  const isMobile = viewport === 'mobile';

  const location = useLocation();
  const homeElement = (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Home />
    </Suspense>
  );

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
      <Routes key={`routes-${role}`}>
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
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <LoadingAnimation />
                </div>
              }>
                <OrganizationSelection />
              </Suspense>
            </AuthRoute>
          }
        />

        {/* Root redirect based on roles */}
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
              <Route index element={homeElement} />
              <Route
                path="driver/*"
                element={<Suspense fallback={<div>Loading...</div>}> <DriverPortal /> </Suspense>}
              />
              <Route
                path="notifications"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    {isMobile ? <MobileNotificationWrapper /> : <NotificationDashboard />}
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={<Suspense fallback={<div>Loading...</div>}> <Settings /> </Suspense>}
              />
              <Route
                path="profile"
                element={<Suspense fallback={<div>Loading...</div>}> <Profile /> </Suspense>}
              />
              {/* Redirect all other routes to driver portal */}
              <Route path="*" element={<Navigate to={ROUTES.DRIVER_PORTAL} replace />} />
            </>
          ) : isEmployee ? (
            <>
              <Route index element={homeElement} />
              <Route
                path="employee-portal/*"
                element={<Suspense fallback={<div>Loading...</div>}> <EmployeePortal /> </Suspense>}
              />
              <Route
                path="organizations"
                element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingAnimation /></div>}> <OrganizationSelection /> </Suspense>}
              />
              <Route
                path="dashboard"
                element={<Suspense fallback={<div className="p-6">Loading dashboard…</div>}> <Dashboard /> </Suspense>}
              />
              <Route
                path="notifications"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    {isMobile ? <MobileNotificationWrapper /> : <NotificationDashboard />}
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={<Suspense fallback={<div>Loading...</div>}> <Settings /> </Suspense>}
              />
              <Route
                path="profile"
                element={<Suspense fallback={<div>Loading...</div>}> <Profile /> </Suspense>}
              />
              <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            </>
          ) : isManager ? (
            <>
              <Route index element={homeElement} />
              <Route
                path="dashboard"
                element={<Suspense fallback={<div className="p-6">Loading dashboard…</div>}> <Dashboard /> </Suspense>}
              />
              <Route
                path="routes"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
                    <Suspense fallback={<div>Loading...</div>}> <RouteManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="vehicles"
                element={<Suspense fallback={<div>Loading...</div>}> <VehicleManagement /> </Suspense>}
              />
              <Route
                path="employees"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
                    <Suspense fallback={<div>Loading...</div>}> <EmployeeManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="notifications"
                element={
                  <Suspense fallback={<div>Loading...</div>}> 
                    {isMobile ? <MobileNotificationWrapper /> : <NotificationDashboard />} 
                  </Suspense>
                }
              />
              <Route
                path="profile"
                element={<Suspense fallback={<div>Loading...</div>}> <Profile /> </Suspense>}
              />
              <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            </>
          ) : isAdmin ? (
            <>
              <Route index element={homeElement} />
              <Route
                path="dashboard"
                element={<Suspense fallback={<div className="p-6">Loading dashboard…</div>}> <Dashboard /> </Suspense>}
              />
              <Route
                path="routes"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <Suspense fallback={<div>Loading...</div>}> <RouteManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="vehicles"
                element={<Suspense fallback={<div>Loading...</div>}> <VehicleManagement /> </Suspense>}
              />
              <Route
                path="employees"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <Suspense fallback={<div>Loading...</div>}> <EmployeeManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="payroll"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <Suspense fallback={<div>Loading...</div>}> <Payroll /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="organization-management"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <Suspense fallback={<div>Loading...</div>}> <OrganizationManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="notifications"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    {isMobile ? <MobileNotificationWrapper /> : <NotificationDashboard />}
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={<Suspense fallback={<div>Loading...</div>}> <Settings /> </Suspense>}
              />
              <Route
                path="profile"
                element={<Suspense fallback={<div>Loading...</div>}> <Profile /> </Suspense>}
              />
              <Route path="*" element={<Navigate to={ROUTES.ORGANIZATION_MANAGEMENT} replace />} />
            </>
          ) : (isSuperAdmin || isOwner) ? (
            <>
              <Route index element={isSuperAdmin ? <Navigate to="/organizations" replace /> : homeElement} />
              <Route
                path="dashboard"
                element={<Suspense fallback={<div className="p-6">Loading dashboard…</div>}> <Dashboard /> </Suspense>}
              />
              <Route
                path="routes"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.OWNER]}>
                    <Suspense fallback={<div>Loading...</div>}> <RouteManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="vehicles"
                element={<Suspense fallback={<div>Loading...</div>}> <VehicleManagement /> </Suspense>}
              />
              <Route
                path="employees"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.OWNER]}>
                    <Suspense fallback={<div>Loading...</div>}> <EmployeeManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="payroll"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.OWNER]}>
                    <Suspense fallback={<div>Loading...</div>}> <Payroll /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="organizations"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.OWNER]}>
                    <Suspense fallback={<div>Loading...</div>}> <OrganizationSelection /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="organization-management"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.OWNER]}>
                    <Suspense fallback={<div>Loading...</div>}> <OrganizationManagement /> </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="notifications"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    {isMobile ? <MobileNotificationWrapper /> : <NotificationDashboard />}
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={<Suspense fallback={<div>Loading...</div>}> <Settings /> </Suspense>}
              />
              <Route
                path="profile"
                element={<Suspense fallback={<div>Loading...</div>}> <Profile /> </Suspense>}
              />
              <Route path="*" element={<Navigate to={ROUTES.ORGANIZATIONS} replace />} />
            </>
          ) : (
            <>
              {/* Fallback for unknown roles (including basic users without org) */}
              <Route index element={homeElement} />
              {/* Basic users without active org should be redirected to organizations by OrganizationGuard */}
              {/* If they somehow get here, redirect them to organization selection */}
              <Route path="*" element={<Navigate to="/organizations" replace />} />
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
