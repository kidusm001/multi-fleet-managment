import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import RouteAssignment from "./components/RouteAssignment";
import RouteManagementView from "./components/RouteManagementView";
import CreateRoute from "./components/CreateRoute/CreateRoute";
import "./RouteManagement.css";

function RouteManagement() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("management");
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());

  // Handle navigation state updates
  useEffect(() => {
    if (location.state?.refresh) {
      // Switch to management tab if specified
      if (location.state.activeTab) {
        setActiveTab(location.state.activeTab);
      }
      // Trigger refresh
      setRefreshTrigger(Date.now());
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleTabChange = (event) => {
    switch (event.target.id) {
      case "radio-1":
        setActiveTab("management");
        break;
      case "radio-2":
        setActiveTab("assignment");
        break;
      case "radio-3":
        setActiveTab("create");
        break;
    }
  };

  return (
    <div className="container mx-auto min-w-[90%]">
      <div className="rounded-[30px] border border-[var(--divider)] shadow-[0_12px_48px_-8px_rgba(66,114,255,0.15),0_8px_24px_-4px_rgba(66,114,255,0.1)] bg-[var(--card-background)]">
        <div className="flex justify-between items-center p-6 border-b border-[var(--divider)]">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Routes
          </h1>

          <div className="container">
            <div className="tabs">
              <input
                type="radio"
                id="radio-1"
                name="tabs"
                checked={activeTab === "management"}
                onChange={handleTabChange}
              />
              <label className="tab" htmlFor="radio-1">
                Management
              </label>
              <input
                type="radio"
                id="radio-2"
                name="tabs"
                checked={activeTab === "assignment"}
                onChange={handleTabChange}
              />
              <label className="tab" htmlFor="radio-2">
                Assignment
              </label>
              <input
                type="radio"
                id="radio-3"
                name="tabs"
                checked={activeTab === "create"}
                onChange={handleTabChange}
              />
              <label className="tab" htmlFor="radio-3">
                Create Route
              </label>
              <span className="glider"></span>
            </div>
          </div>
        </div>

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
  );
}

export default RouteManagement;
