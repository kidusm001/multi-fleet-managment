import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Route, Truck, Users, Settings, DollarSign } from "lucide-react";
import { useRole } from "@contexts/RoleContext";
import { NAV_CONFIG } from "@/config/nav-config";
import { cn } from "@lib/utils";

// Icon mapping for nav items
const getNavIcon = (label) => {
  switch (label) {
    case "Dashboard":
      return Home;
    case "Routes":
      return Route;
    case "Vehicles":
      return Truck;
    case "Employees":
      return Users;
    case "Payroll":
      return DollarSign;
    case "Settings":
      return Settings;
    default:
      return Home;
  }
};

const MobileNavMenu = ({ isOpen, onClose, isDark }) => {
  const { role } = useRole();
  const location = useLocation();
  const navItems = NAV_CONFIG[role] || NAV_CONFIG.default;
  const menuRef = useRef(null);
  const firstLinkRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (isOpen && firstLinkRef.current) {
      // Focus first link when menu opens
      setTimeout(() => {
        firstLinkRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Simple focus trap
      if (e.key === "Tab") {
        const focusableElements = menuRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements?.length) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            ref={menuRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
            }}
            className={cn(
              "fixed top-0 left-0 h-full w-80 z-50 shadow-2xl md:hidden",
              isDark
                ? "bg-[#0c1222]/95 border-r border-[#4272FF]/20"
                : "bg-white/95 border-r border-gray-200"
            )}
            style={{
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-current/10">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/images/logo-light.png"
                  alt="Routegna"
                  className="h-8 w-auto"
                />
                <span className={cn(
                  "font-semibold text-lg",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Routegna
                </span>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isDark
                    ? "hover:bg-white/10 text-white"
                    : "hover:bg-gray-100 text-gray-900"
                )}
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navItems.map((item, index) => {
                const Icon = getNavIcon(item.label);
                const isActive = isActivePath(item.path);

                return (
                  <Link
                      key={item.label}
                      ref={index === 0 ? firstLinkRef : null}
                      to={item.path}
                      onClick={(_e) => {
                        // Removed notifications-specific hard reload workaround since notifications are disabled
                        // if (location.pathname === '/notifications' && item.path !== '/notifications') {
                        //   e.preventDefault();
                        //   window.location.href = item.path;
                        //   return;
                        // }
                        handleLinkClick();
                      }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                      isActive
                        ? isDark
                          ? "bg-[#4272FF]/20 text-[#4272FF] border border-[#4272FF]/30"
                          : "bg-[#4272FF]/10 text-[#4272FF] border border-[#4272FF]/20"
                        : isDark
                        ? "text-white/70 hover:text-white hover:bg-white/5"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                      "focus:outline-none focus:ring-2 focus:ring-[#4272FF]/50"
                    )}
                  >
                    <Icon 
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-current" : "text-current/70 group-hover:text-current"
                      )} 
                    />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-2 h-2 bg-[#4272FF] rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className={cn(
              "p-4 border-t border-current/10",
              isDark ? "text-white/50" : "text-gray-500"
            )}>
              <p className="text-sm text-center">
                Routegna Fleet Management
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileNavMenu;