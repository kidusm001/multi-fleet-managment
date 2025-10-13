import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Employee Portal Layout
 * Provides layout for Dashboard and Request views (tabs moved to main navigation)
 */
export default function EmployeePortalLayout() {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
