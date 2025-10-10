import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import MobileTopBar from './components/MobileTopBar';
import MobileBottomNav from './components/MobileBottomNav';

/**
 * Mobile Driver Portal Layout
 * Wraps all driver portal views with mobile-optimized navigation
 */
function MobileDriverPortal({ tabletMode = false }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();

  // Hide bottom nav on navigation view for full-screen map
  const isNavigationView = location.pathname.includes('/navigate');

  return (
    <div 
      className={cn(
        "min-h-screen flex flex-col",
        isDark ? "bg-[#0c1222]" : "bg-gray-50"
      )}
    >
      {/* Mobile Top Bar */}
      <MobileTopBar tabletMode={tabletMode} />

      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 overflow-y-auto",
          isNavigationView ? "pt-14" : "pt-14 pb-20",
          tabletMode ? "px-6" : "px-4"
        )}
        style={{
          minHeight: isNavigationView 
            ? 'calc(100vh - 56px)' 
            : 'calc(100vh - 56px - 60px)'
        }}
      >
        <Outlet />
      </main>

      {/* Bottom Navigation (hidden on navigation view) */}
      {!isNavigationView && (
        <MobileBottomNav tabletMode={tabletMode} />
      )}
    </div>
  );
}

export default MobileDriverPortal;
