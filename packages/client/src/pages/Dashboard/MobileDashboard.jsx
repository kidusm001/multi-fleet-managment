import React from 'react';
import { Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTheme } from '@contexts/ThemeContext';
import MobileTopBar from './components/MobileTopBar';
import MobileBottomNav from './components/MobileBottomNav';

/**
 * Mobile Dashboard Layout Wrapper
 * Provides mobile-optimized layout for all users (admin, fleet manager, etc.)
 * Uses same patterns as Driver Portal for consistency
 */
function MobileDashboard({ tabletMode = false }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Fixed Header */}
      <MobileTopBar />
      
      {/* Main Content - Scrollable */}
      <main 
        className={`${tabletMode ? 'pt-16 pb-20' : 'pt-14 pb-16'} overflow-y-auto`}
        style={{ 
          height: 'calc(100vh - 56px - 60px)',
          WebkitOverflowScrolling: 'touch' 
        }}
      >
        <Outlet />
      </main>
      
      {/* Fixed Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

MobileDashboard.propTypes = {
  tabletMode: PropTypes.bool,
};

export default MobileDashboard;
