import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useRole } from '@contexts/RoleContext';
import { useViewport } from '@hooks/useViewport';
import MobileDriverPortal from './MobileDriverPortal';
import DashboardView from './views/Dashboard';
import RoutesListView from './views/RoutesList';
import RouteDetailView from './views/RouteDetail';
import NavigationView from './views/Navigation';
import ScheduleView from './views/Schedule';
import ProfileView from './views/Profile';

/**
 * Driver Portal Root Component
 * Determines whether to show mobile or desktop view based on viewport and role
 */
function DriverPortal() {
  const { role } = useRole();
  const viewport = useViewport();

  // Enable tablet mode for all users on tablet devices (car infotainment, mounted tablets)
  const tabletMode = viewport === 'tablet';

  // Non-drivers on desktop should use main dashboard
  if (viewport === 'desktop' && role !== 'driver') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<MobileDriverPortal tabletMode={tabletMode} />}>
        <Route index element={<DashboardView />} />
        <Route path="routes" element={<RoutesListView />} />
        <Route path="route/:id" element={<RouteDetailView />} />
        <Route path="navigate/:routeId/:stopId" element={<NavigationView />} />
        <Route path="schedule" element={<ScheduleView />} />
        <Route path="profile" element={<ProfileView />} />
      </Route>
    </Routes>
  );
}

export default DriverPortal;
