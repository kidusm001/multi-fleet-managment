import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import RouteAssignment from "./components/RouteAssignment";
import RouteManagementView from "./components/RouteManagementView";
import CreateRoute from "./components/CreateRoute/CreateRoute";
import "./RouteManagement.css";

function RouteManagement() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from URL or navigation state
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'assignment') return 'assignment';
      if (params.get('modal') === 'create' || params.get('activeTab') === 'create') return 'create';
    } catch (e) {
      // ignore
    }
    return window.history.state?.activeTab || 'management';
  });
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());

  // Handle navigation state updates and URL param changes
  useEffect(() => {
    // If navigation state explicitly requests a switch, respect it
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      setRefreshTrigger(Date.now());
      // Remove the nav state so it doesn't persist
      const cleanState = { ...window.history.state };
      if (cleanState.activeTab) delete cleanState.activeTab;
      if (cleanState.refresh) delete cleanState.refresh;
      window.history.replaceState(cleanState, document.title);
      return;
    }

    // Otherwise, derive from URL params
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'assignment') {
      setActiveTab('assignment');
    } else if (params.get('modal') === 'create' || params.get('activeTab') === 'create') {
      setActiveTab('create');
    } else {
      setActiveTab('management');
    }
    // Trigger refresh whenever location.search changes
    setRefreshTrigger(Date.now());
  }, [location.search, location.state]);

  // Tabs are now controlled from top navigation; page reads URL/state to decide activeTab

  return (
    <div className="container mx-auto min-w-[90%]">
      <div className="rounded-[30px] border border-[var(--divider)] shadow-[0_12px_48px_-8px_rgba(66,114,255,0.15),0_8px_24px_-4px_rgba(66,114,255,0.1)] bg-[var(--card-background)]">
        {/* Top header and internal tabs removed — main nav provides the controls now. */}
        <div className="p-0">
        <div className="">
          {activeTab === "management" ? (
            <RouteManagementView refreshTrigger={refreshTrigger} />
          ) : activeTab === "assignment" ? (
            <RouteAssignment refreshTrigger={refreshTrigger} />
          ) : (
            <CreateRoute />
          )}
        </div>
      </div>
    </div>
  </div>
  );
}

export default RouteManagement;
