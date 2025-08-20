import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from '@components/Common/ProtectedRoute';
import { ROLES } from '@data/constants';
import { AuthRoute } from '@components/Common/AuthRoute';
// Layout Components
import Sidebar from "@components/Common/Layout/Sidebar";
import Footer from "@components/Common/Layout/Footer";
import TopBar from "@components/Common/Layout/TopBar";
// Pages
import { Suspense, lazy } from 'react';
const Home = lazy(() => import('@pages/Home'));
const About = lazy(() => import('@pages/About'));
const Dashboard = lazy(() => import('@pages/Dashboard'));
const RouteManagement = lazy(() => import('@pages/RouteManagement'));
const ShuttleManagement = lazy(() => import('@pages/ShuttleManagement'));
const VehicleManagement = lazy(() => import('@pages/ShuttleManagement')); // Alias for transition
const EmployeeManagement = lazy(() => import('@pages/EmployeeManagement'));
const Payroll = lazy(() => import('@pages/Payroll'));
const Settings = lazy(() => import('@pages/Settings'));
const Login = lazy(() => import('@pages/Auth/Login'));
const NotificationDashboard = lazy(() => import('@pages/notifications/components/notification-dashboard').then(m => ({ default: m.NotificationDashboard })));
// Context
import { SidebarProvider, useSidebar } from "@contexts/SidebarContext";
import { RoleProvider } from "@contexts/RoleContext";
import { ThemeProvider, useTheme } from "@contexts/ThemeContext";
import { AuthProvider } from "@contexts/AuthContext";
import { Toaster } from 'sonner';
import { NotificationProvider } from "@contexts/NotificationContext";
import Unauthorized from "@pages/Unauthorized";
import { NotificationSound } from "@components/Common/Notifications/NotificationSound";

// Styles
import "@styles/App.css";

function AppContent() {
  const { theme } = useTheme();
  const { isOpen } = useSidebar();
  const isDark = theme === "dark";

  return (
    <div
      className={`app-container ${isDark ? "dark" : ""}`}
      data-sidebar-collapsed={!isOpen}
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/auth/login" element={
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
            <Login />
          </Suspense>
        } />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes - Require Authentication */}
        <Route
          path="*"
          element={
            <AuthRoute>
              <NotificationProvider>
                <NotificationSound />
                <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-gray-50"} transition-colors duration-300`}>
                  <TopBar />
                  <div className={`main-content backdrop-blur-xl ${isDark ? "bg-black/20" : "bg-white/20"}`}>
                    <Sidebar />
                    <main id="main" className={`content-area ${isDark ? "text-gray-100" : "text-gray-900"}`}>
                        <Routes>
                          <Route path="/" element={<Suspense fallback={<div />}> <Home /> </Suspense>} />
                          <Route path="/about" element={<Suspense fallback={<div />}> <About /> </Suspense>} />
                          <Route path="/dashboard" element={<Suspense fallback={<div className="p-6">Loading dashboard…</div>}> <Dashboard /> </Suspense>} />
                        <Route 
                          path="/routes" 
                          element={
                            <ProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ADMIN]}>
                                <Suspense fallback={<div />}> <RouteManagement /> </Suspense>
                            </ProtectedRoute>
                          } 
                        />
                          <Route path="/shuttles" element={<Suspense fallback={<div />}> <ShuttleManagement /> </Suspense>} />
                          <Route path="/vehicles" element={<Suspense fallback={<div />}> <VehicleManagement /> </Suspense>} />
                          <Route path="/employees" element={<Suspense fallback={<div />}> <EmployeeManagement /> </Suspense>} />
                          <Route path="/payroll" element={<Suspense fallback={<div />}> <Payroll /> </Suspense>} />
                          <Route path="/notifications" element={<Suspense fallback={<div />}> <NotificationDashboard /> </Suspense>} />
                          <Route path="/settings" element={<Suspense fallback={<div />}> <Settings /> </Suspense>} />
                      </Routes>
                      <Footer />
                    </main>
                  </div>
                </div>
              </NotificationProvider>
            </AuthRoute>
          }
        />
      </Routes>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RoleProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <SidebarProvider>
              <AppContent />
              <Toaster 
                position="bottom-right" 
                expand={true} 
                richColors
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--card-background, #ffffff)',
                    color: 'var(--text-primary, #000000)',
                    border: '1px solid var(--divider, #e5e7eb)'
                  },
                }}
              />
            </SidebarProvider>
          </Router>
        </RoleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
