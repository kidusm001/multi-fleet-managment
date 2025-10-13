import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useRole } from '@contexts/RoleContext';
import EmployeePortalLayout from './EmployeePortalLayout';
import DashboardView from './views/Dashboard';
import RequestView from './views/Request';

/**
 * Employee Portal Root Component
 * Desktop-first responsive portal for employees to view dashboard and request shuttles
 */
function EmployeePortal() {
  const { role } = useRole();

  // Non-employees on this route should be redirected
  if (role !== 'employee') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<EmployeePortalLayout />}>
        <Route index element={<DashboardView />} />
        <Route path="request" element={<RequestView />} />
      </Route>
    </Routes>
  );
}

export default EmployeePortal;
