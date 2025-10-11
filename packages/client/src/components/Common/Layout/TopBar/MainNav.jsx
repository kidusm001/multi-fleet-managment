import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRole } from "@contexts/RoleContext";
import { NAV_CONFIG } from "@/config/nav-config";
import { cn } from "@lib/utils";
import { 
  LayoutDashboard, 
  Route, 
  Car, 
  Users, 
  DollarSign, 
  Settings,
  MapPin,
  UserPlus,
  Plus,
  Building2
} from "lucide-react";

// Icon mapping for navigation items
const getNavIcon = (label) => {
  const iconMap = {
    "Dashboard": LayoutDashboard,
    "Routes": Route,
    "Vehicles": Car,
    "Employees": Users,
    "Payroll": DollarSign,
    "Settings": Settings,
    "Management": MapPin,
    "Assignment": UserPlus,
    "Create Route": Plus,
    "Organizations": Building2,
    "Org Management": Building2
  };
  return iconMap[label] || LayoutDashboard;
};

// SVG-based highlight component for nav items (tapered line + center triangle)
function NavHighlight({ isDark }) {
  const color = isDark ? '#fb923c' : '#ea580c';
  return (
    <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 transition-all duration-300 pointer-events-none">
      <svg width="80" height="12" viewBox="0 0 80 12" xmlns="http://www.w3.org/2000/svg" className="block">
        <defs>
          <linearGradient id="navGrad" x1="0" x2="1">
            <stop offset="0" stopColor={color} stopOpacity="0" />
            <stop offset="0.18" stopColor={color} stopOpacity="1" />
            <stop offset="0.82" stopColor={color} stopOpacity="1" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id="navGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Tapered line */}
        <rect x="0" y="6" width="80" height="2" rx="1" fill="url(#navGrad)" filter="url(#navGlow)" />
        {/* Center upward triangle */}
        <path d="M40 0 L46 6 L34 6 Z" fill={color} />
      </svg>
    </div>
  );
}

// Click outside hook
function useClickOutside(refs, handler) {
  useEffect(() => {
    function listener(e) {
      if (refs.some(ref => ref.current && ref.current.contains(e.target))) return;
      handler(e);
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [refs, handler]);
}


export default function MainNav({ isDark, onKeyDown }) {
  const { role } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = NAV_CONFIG[role] || NAV_CONFIG.default;
  const [showRoutesPanel, setShowRoutesPanel] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const panelRef = useRef(null);
  const routesBtnRef = useRef(null);

  // Helper to check for active tab/subtab
  function isActiveTab(item) {
    return location.pathname.startsWith(item.path);
  }
  function isActiveSubTab(sub) {
    const search = location.search;
    const pathname = location.pathname;
    
    // Check state from navigation first
    if (window.history.state?.activeTab) {
      const activeTab = window.history.state.activeTab;
      if (sub.label === "Assignment" && activeTab === "assignment") return true;
      if (sub.label === "Create Route" && activeTab === "create") return true;
      if (sub.label === "Management" && activeTab === "management") return true;
      return false; // If state is set but doesn't match this sub, return false
    }
    
    // Fallback to URL-based detection
    if (sub.label === "Assignment") return search.includes("tab=assignment");
    if (sub.label === "Create Route") return search.includes("modal=create") || search.includes("activeTab=create");
    // Only make Management default if no other indicators exist
    if (sub.label === "Management") {
      return pathname === "/routes" && 
        !search.includes("tab=") && 
        !search.includes("modal=") && 
        !search.includes("activeTab=");
    }
    return false;
  }

  // Custom navigation for subpaths to set correct tab state
  function handleSubNav(sub) {
    // Always navigate including a query param so the page can detect the active tab
    if (sub.label === "Assignment") {
      navigate(`/routes?tab=assignment`, { state: { activeTab: "assignment", refresh: true } });
    } else if (sub.label === "Create Route") {
      navigate(`/routes?modal=create`, { state: { activeTab: "create", refresh: true } });
    } else if (sub.label === "Management") {
      // Clear query params for management (base view)
      navigate(`/routes`, { state: { activeTab: "management", refresh: true } });
    } else {
      // Fallback to configured path
      navigate(sub.path);
    }
  }

  // Close panel when clicking outside or pressing Escape
  useClickOutside([panelRef, routesBtnRef], () => setShowRoutesPanel(false));
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") setShowRoutesPanel(false);
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Only one nav item should have subpaths: "Routes"
  return (
    <nav onKeyDown={onKeyDown} className="hidden md:flex items-center gap-1" aria-label="Primary">
      {navItems.map((item) => {
        if (item.label === "Routes" && item.subpaths) {
          const isActive = isActiveTab(item);
          const linkClass = cn(
            "px-3 py-1.5 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors duration-150 relative",
            isDark ? "hover:bg-white/10 focus-visible:ring-white/30" : "hover:bg-black/10 focus-visible:ring-black/30",
            isActive && !showRoutesPanel ? (isDark ? "text-orange-400 bg-white/10" : "text-orange-600 bg-black/10") : "",
            isActive && showRoutesPanel ? (isDark ? "text-orange-400 bg-white/10" : "text-orange-600 bg-black/10") : "",
            showRoutesPanel ? (isDark ? "bg-white/10 shadow-sm" : "bg-black/5 shadow-sm") : "",
            isDark ? "text-white" : "text-black",
            "font-sans"
          );
          return (
            <div key={item.label} className="relative">
              <button
                ref={routesBtnRef}
                className={linkClass}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  // If panel is already open, clicking again should navigate to Management tab
                  if (showRoutesPanel) {
                    navigate('/routes', { state: { activeTab: "management", refresh: true } });
                    setShowRoutesPanel(false);
                  } else {
                    setShowRoutesPanel(true);
                  }
                }}
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{ position: "relative", zIndex: 51 }}
              >
                <div className="flex items-center gap-2 transition-all duration-300">
                  {/* Icon - always visible with reduced weight */}
                  {React.createElement(getNavIcon(item.label), { 
                    size: 20,
                    strokeWidth: 1.5,
                    className: cn(
                      "transition-all duration-300 flex-shrink-0",
                      isActive ? (isDark ? "text-orange-400" : "text-orange-600") : ""
                    )
                  })}
                  {/* Text - always visible when active, expandable on hover when inactive */}
                  <span 
                    className={cn(
                      "transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                      isActive 
                        ? "max-w-24 opacity-100 ml-1" 
                        : hoveredItem === item.label 
                          ? "max-w-24 opacity-100 ml-1" 
                          : "max-w-0 opacity-0"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
                {/* SVG-based highlight when active */}
                {isActive && <NavHighlight isDark={isDark} />}
              </button>
              {/* Modern dropdown panel right below Routes button */}
              {showRoutesPanel && (
                <div
                  ref={panelRef}
                  className={cn(
                    "absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-[240px] rounded-lg border shadow-lg z-50 transition-all duration-200",
                    isDark 
                      ? "bg-[#0c1222]/95 backdrop-blur-xl border-[#4272FF]/20" 
                      : "bg-white/95 backdrop-blur-xl border-gray-200",
                    showRoutesPanel ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                  )}
                  role="menu"
                >
                  {/* Triangle pointer */}
                  <div 
                    className={cn(
                      "absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-l border-t",
                      isDark ? "bg-[#0c1222]/95 border-[#4272FF]/20" : "bg-white/95 border-gray-200"
                    )}
                  />
                  
                  <div className="relative py-2 px-1">
                    {item.subpaths.map((sub) => (
                      <button
                        key={sub.label}
                        onClick={() => {
                          if (location.pathname === '/notifications') {
                            const target = sub.path.startsWith('/') ? sub.path.split('?')[0] : '/routes';
                            window.location.href = target;
                            return;
                          }
                          handleSubNav(sub);
                          setShowRoutesPanel(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-sm font-medium transition-all duration-150 rounded-md outline-none focus-visible:ring-2 flex items-center gap-3",
                          isActiveSubTab(sub)
                            ? (isDark 
                                ? "text-orange-400 bg-orange-500/20 shadow-sm" 
                                : "text-orange-600 bg-orange-500/10 shadow-sm")
                            : (isDark 
                                ? "text-gray-300 hover:text-white hover:bg-white/10" 
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"),
                          isDark ? "focus-visible:ring-orange-400/50" : "focus-visible:ring-orange-600/50"
                        )}
                        aria-current={isActiveSubTab(sub) ? "page" : undefined}
                      >
                        {/* Icon with modern styling */}
                        <div className={cn(
                          "p-1.5 rounded-md transition-colors",
                          isActiveSubTab(sub)
                            ? (isDark ? "bg-orange-500/30" : "bg-orange-500/20")
                            : (isDark ? "bg-white/5" : "bg-gray-200/50")
                        )}>
                          {React.createElement(getNavIcon(sub.label), { 
                            size: 16,
                            strokeWidth: 2,
                            className: "flex-shrink-0"
                          })}
                        </div>
                        {/* Tab label */}
                        <span className="flex-1 text-left">{sub.label}</span>
                        {/* Active indicator */}
                        {isActiveSubTab(sub) && (
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isDark ? "bg-orange-400" : "bg-orange-600"
                          )} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }
        // Other nav items
        const isActive = isActiveTab(item);
        const linkClass = cn(
          "px-3 py-1.5 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors duration-150 relative",
          isDark ? "hover:bg-white/10 focus-visible:ring-white/30" : "hover:bg-black/10 focus-visible:ring-black/30",
          isActive ? (isDark ? "text-orange-400 bg-white/10" : "text-orange-600 bg-black/10") : "",
          isDark ? "text-white" : "text-black",
          "font-sans"
        );
        return (
          <Link
            key={item.label}
            to={item.path}
            className={linkClass}
            aria-current={isActive ? "page" : undefined}
            onClick={(e) => {
              if (location.pathname === '/notifications' && item.path !== '/notifications') {
                e.preventDefault();
                window.location.href = item.path;
                return;
              }
            }}
            onMouseEnter={() => setHoveredItem(item.label)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="flex items-center gap-2 transition-all duration-300">
              {/* Icon - always visible with reduced weight */}
              {React.createElement(getNavIcon(item.label), { 
                size: 20,
                strokeWidth: 1.5,
                className: cn(
                  "transition-all duration-300 flex-shrink-0",
                  isActive ? (isDark ? "text-orange-400" : "text-orange-600") : ""
                )
              })}
              {/* Text - always visible when active, expandable on hover when inactive */}
              <span 
                className={cn(
                  "transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                  isActive 
                    ? "max-w-32 opacity-100 ml-1" 
                    : hoveredItem === item.label 
                      ? "max-w-32 opacity-100 ml-1" 
                      : "max-w-0 opacity-0"
                )}
              >
                {item.label}
              </span>
            </div>
            {/* SVG-based highlight when active */}
            {isActive && <NavHighlight isDark={isDark} />}
          </Link>
        );
      })}
    </nav>
  );
}
