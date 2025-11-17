import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@components/Common/UI/Button";
import LoadingWrapper from "@components/Common/LoadingAnimation/LoadingWrapper";
import { motion } from "framer-motion";
import { useTheme } from "@contexts/ThemeContext";
import { useRole } from "@contexts/RoleContext";
import { useOrganization } from "@contexts/OrganizationContext";
import { ROLES, ROUTES } from "@data/constants";
import "./Home.css";

const buttonStyles = {
  primary: "relative overflow-hidden group bg-gradient-to-r from-[#f3684e] to-[#f3684e]/80 hover:from-[#f3684e]/90 hover:to-[#f3684e]/70 text-white py-3.5 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]",
  secondary: "relative overflow-hidden group border border-[#f3684e]/20 hover:border-[#f3684e]/30 bg-white/5 hover:bg-white/10 dark:text-white text-slate-900 py-3.5 px-8 rounded-xl transition-all duration-300",
};

export default function Home() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const { role } = useRole();
  const { activeOrganization, isLoadingActiveOrg, isLoadingOrganizations } = useOrganization();
  const navigate = useNavigate();

  const autoTarget = useMemo(() => {
    if (!role) {
      return null;
    }

    // Superadmin always goes to organizations (to manage all orgs)
    if (role === ROLES.SUPERADMIN) {
      return ROUTES.ORGANIZATIONS;
    }

    // Owner always goes to organizations (to select/manage orgs)
    if (role === ROLES.OWNER) {
      return ROUTES.ORGANIZATIONS;
    }

    // Driver always goes to driver portal
    if (role === ROLES.DRIVER) {
      return ROUTES.DRIVER_PORTAL;
    }

    // Employee goes to employee portal
    if (role === ROLES.EMPLOYEE) {
      return activeOrganization ? ROUTES.EMPLOYEE_PORTAL : ROUTES.ORGANIZATIONS;
    }

    // Admin, Manager need active org to go to dashboard
    if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
      return activeOrganization ? ROUTES.DASHBOARD : ROUTES.ORGANIZATIONS;
    }

    return ROUTES.DASHBOARD;
  }, [role, activeOrganization]);

  const manualTarget = useMemo(() => {
    if (!role) {
      return ROUTES.DASHBOARD;
    }

    // Superadmin always goes to organizations (to manage all orgs)
    if (role === ROLES.SUPERADMIN) {
      return ROUTES.ORGANIZATIONS;
    }

    // Owner always goes to organizations (to select/manage orgs)
    if (role === ROLES.OWNER) {
      return ROUTES.ORGANIZATIONS;
    }

    // Driver always goes to driver portal
    if (role === ROLES.DRIVER) {
      return ROUTES.DRIVER_PORTAL;
    }

    // Employee goes to employee portal
    if (role === ROLES.EMPLOYEE) {
      return activeOrganization ? ROUTES.EMPLOYEE_PORTAL : ROUTES.ORGANIZATIONS;
    }

    // Admin, Manager need active org for dashboard
    if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
      return activeOrganization ? ROUTES.DASHBOARD : ROUTES.ORGANIZATIONS;
    }

    return ROUTES.DASHBOARD;
  }, [role, activeOrganization]);

  const manualLabel = useMemo(() => {
    if (!role) {
      return "Go to Dashboard";
    }

    // Superadmin always manages organizations
    if (role === ROLES.SUPERADMIN) {
      return "Manage Organizations";
    }

    // Owner always manages organizations
    if (role === ROLES.OWNER) {
      return "Manage Organizations";
    }

    // Driver goes to driver portal
    if (role === ROLES.DRIVER) {
      return "Open Driver Portal";
    }

    // Employee goes to employee portal
    if (role === ROLES.EMPLOYEE) {
      return activeOrganization ? "Open Employee Portal" : "Select Organization";
    }

    // Admin, Manager need active org
    if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
      return activeOrganization ? "Go to Dashboard" : "Select an Organization";
    }

    return "Go to Dashboard";
  }, [role, activeOrganization]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!autoTarget) {
      return;
    }

    // Superadmin doesn't need active org, always goes to organizations immediately
    if (role === ROLES.SUPERADMIN) {
      navigate(autoTarget, { replace: true });
      return;
    }

    // Owner always goes to organizations immediately
    if (role === ROLES.OWNER) {
      navigate(autoTarget, { replace: true });
      return;
    }

    // Driver doesn't need active org, always goes to driver portal
    if (role === ROLES.DRIVER) {
      navigate(autoTarget, { replace: true });
      return;
    }

    // Employee doesn't need active org for portal, goes there directly
    if (role === ROLES.EMPLOYEE) {
      navigate(autoTarget, { replace: true });
      return;
    }

    // Admin, Manager need active org to proceed
    const requiresActiveOrganization = role === ROLES.ADMIN || role === ROLES.MANAGER;

    if (requiresActiveOrganization) {
      if (isLoadingActiveOrg || isLoadingOrganizations) {
        return;
      }

      if (!activeOrganization) {
        // Redirect to organizations to select one
        navigate(ROUTES.ORGANIZATIONS, { replace: true });
        return;
      }
    }

    // All other roles with active org (or doesn't require it) can proceed
    navigate(autoTarget, { replace: true });
  }, [activeOrganization, autoTarget, isLoading, isLoadingActiveOrg, isLoadingOrganizations, navigate, role]);

  const handlePrimaryAction = () => {
    navigate(manualTarget, { replace: manualTarget === autoTarget });
  };

  const needsOrganizationSelection = useMemo(() => {
    const organizationRoles = [ROLES.SUPERADMIN, ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER];
    return organizationRoles.includes(role) && !activeOrganization;
  }, [role, activeOrganization]);

  return (
    <LoadingWrapper isLoading={isLoading}>
      <div className={`min-h-[calc(100vh-60px)] flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-20 md:py-24 bg-gradient-to-br ${
        isDark 
          ? 'from-slate-950 via-[#1a2327] to-[#1a2327]' 
          : 'from-gray-50 via-gray-100 to-gray-200'
      }`}>
        {/* Logo Section - Updated for mobile */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 sm:mb-12 relative z-10"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 0],
            }}
            transition={{ duration: 0.5, times: [0, 0.5, 1] }}
            className={`relative flex items-center ${
              isDark 
                ? 'bg-white/80' 
                : 'bg-white/90 shadow-lg'
            } backdrop-blur-sm px-4 py-[0.2rem] rounded-[1.5rem]`}
          >
                        <motion.img
              src="/assets/images/logo-light.png"
              alt="Routegna"
              className="h-8 sm:h-12 w-auto mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            />
          </motion.div>
          <motion.div
            className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#f3684e] to-transparent"
            animate={{
              scaleX: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-3xl mx-auto"
        >
          <div className={`relative backdrop-blur-xl rounded-2xl sm:rounded-[2rem] shadow-2xl border overflow-hidden px-4 sm:px-8 py-8 sm:py-12 ${
            isDark 
              ? 'bg-black/20 border-white/10' 
              : 'bg-white/20 border-black/10'
          }`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${
              isDark 
                ? 'from-[#324048]/5' 
                : 'from-slate-100/50'
            } to-transparent`} />
            
            <div className="relative z-10 text-center">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6"
              >
                <span className={`bg-gradient-to-r ${isDark ? 'from-white to-[#f3684e]' : 'from-slate-800 to-[#f3684e]'} bg-clip-text text-transparent`}>
                  Welcome to Fleet Management
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`text-lg sm:text-xl ${isDark ? 'text-white/70' : 'text-slate-800/80'} mb-8 sm:mb-12 max-w-xl mx-auto leading-relaxed`}
              >
                Transform your transportation operations with our comprehensive fleet management solution.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <Button className={buttonStyles.primary} onClick={handlePrimaryAction}>
                  <span className="relative z-10">{manualLabel}</span>
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#f3684e]/0 via-white/10 to-[#f3684e]/0 group-hover:via-white/20 transition-all duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" />
                </Button>
                <Link to="/about">
                  <Button className={buttonStyles.secondary}>Learn More</Button>
                </Link>
              </motion.div>

              {needsOrganizationSelection && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`mt-6 text-sm ${isDark ? "text-white/70" : "text-slate-700"}`}
                >
                  You&apos;ll need to choose an organization before accessing the dashboard.
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </LoadingWrapper>
  );
}