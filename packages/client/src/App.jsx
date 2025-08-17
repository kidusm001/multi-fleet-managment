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
import Home from "@pages/Home";
import About from "@pages/About";
import Dashboard from "@pages/Dashboard";
import RouteManagement from "@pages/RouteManagement";
import ShuttleManagement from "@pages/ShuttleManagement";
import EmployeeManagement from "@pages/EmployeeManagement";
import Payroll from "@pages/Payroll";
import Settings from "@pages/Settings";
import Login from "@pages/Auth/Login";
import { NotificationDashboard } from "@pages/notifications/components/notification-dashboard";
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
        <Route path="/auth/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes - Require Authentication */}
        <Route
          path="*"
          element={
            <AuthRoute>
              <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-gray-50"} transition-colors duration-300`}>
                <TopBar />
                <div className={`main-content backdrop-blur-xl ${isDark ? "bg-black/20" : "bg-white/20"}`}>
                  <Sidebar />
                  <main className={`content-area ${isDark ? "text-gray-100" : "text-gray-900"}`}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route 
                        path="/routes" 
                        element={
                          <ProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ADMIN]}>
                            <RouteManagement />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/shuttles" element={<ShuttleManagement />} />
                      <Route path="/employees" element={<EmployeeManagement />} />
                      <Route path="/payroll" element={<Payroll />} />
                      <Route path="/notifications" element={<NotificationDashboard />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                    <Footer />
                  </main>
                </div>
              </div>
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
              <NotificationProvider>
                <NotificationSound />
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
              </NotificationProvider>
            </SidebarProvider>
          </Router>
        </RoleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
