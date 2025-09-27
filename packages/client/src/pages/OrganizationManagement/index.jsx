import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Users, 
  Settings as SettingsIcon,
  MapPin,
  UserPlus,
  Crown,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import organization components
import OrganizationOverview from "./components/OrganizationOverview";
import OrganizationAdmin from "@components/Common/Organizations/OrganizationAdmin";
import OrganizationSettings from "./components/OrganizationSettings";
import LocationManagement from "./components/LocationManagement";

const tabs = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "members", label: "Members", icon: Users },
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function OrganizationManagement() {
  useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Check location state to see if we need to activate a specific tab
  useEffect(() => {
    if (location.state?.activeTab && tabs.some(tab => tab.id === location.state.activeTab)) {
      setActiveTab(location.state.activeTab);
      
      // Clear the state to prevent it from persisting on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OrganizationOverview />;
      case "members":
        return <OrganizationAdmin />;
      case "locations":
        return <LocationManagement />;
      case "settings":
        return <OrganizationSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-[1400px]">
      {/* Organization Management Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Organization Management</h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Manage your organization settings, members, and permissions
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8 border-b border-[var(--divider)]">
        <div className="flex flex-wrap gap-2 sm:gap-4 md:gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200",
                  isActive
                    ? "text-[var(--primary)] border-[var(--primary)] bg-[var(--primary)]/5"
                    : "text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:border-[var(--divider)]"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="min-h-[600px]"
        >
          <div className="bg-[var(--card-background)] rounded-lg border border-[var(--divider)] shadow-sm">
            {renderContent()}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}