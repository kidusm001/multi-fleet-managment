import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Truck, 
  Building2, 
  Clock, 
  Bus,
  LayoutDashboard,
  UserCog
} from "lucide-react";
import Button from "@components/Common/UI/Button";
import { cn } from "@/lib/utils";

// Import settings components
import Dashboard from "./components/Dashboard";
import DriverManagement from "./components/DriverManagement";
import DepartmentManagement from "./components/DepartmentManagement";
import ShiftManagement from "./components/ShiftManagement";
import UserManagement from "./components/UserManagement";
import EmployeeManagement from "./components/EmployeeManagement";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "employees", label: "Employees", icon: Users },
  { id: "drivers", label: "Drivers", icon: Truck },
  { id: "departments", label: "Departments", icon: Building2 },
  { id: "shifts", label: "Shifts", icon: Clock },
  { id: "users", label: "Users", icon: UserCog },
  { id: "shuttles", label: "Shuttles", icon: Bus },
];

export default function Settings() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Check location state to see if we need to activate a specific tab
  useEffect(() => {
    if (location.state?.activeTab && tabs.some(tab => tab.id === location.state.activeTab)) {
      setActiveTab(location.state.activeTab);
      
      // Clear the state to prevent it from persisting on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleTabChange = (tabId) => {
    if (tabId === "shuttles") {
      navigate("/shuttle-management");
      return;
    }
    setActiveTab(tabId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "employees":
        return <EmployeeManagement 
          navigateToDepartments={() => handleTabChange("departments")}
          navigateToShifts={() => handleTabChange("shifts")}
        />;
      case "drivers":
        return <DriverManagement />;
      case "departments":
        return <DepartmentManagement />;
      case "shifts":
        return <ShiftManagement />;
      case "users":
        return <UserManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-[1400px]">
      {/* Settings Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Admin Settings</h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Manage your organization's settings and configurations
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8 border-b border-[var(--divider)]">
        <div className="flex flex-wrap gap-2 sm:gap-4 md:gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}