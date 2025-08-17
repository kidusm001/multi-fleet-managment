import React from "react";
import { useRole } from "@contexts/RoleContext";
import { useSidebar } from "@contexts/SidebarContext";
import { useTheme } from "@contexts/ThemeContext";
import { ROUTES, ROLES } from "@data/constants";
import { cn } from "@lib/utils";
import {
  LayoutDashboard,
  MapPin,
  Users,
  Menu,
  Truck,
  DollarSign,
  Settings,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const getMenuItems = (role) => {
  const baseItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      path: ROUTES.DASHBOARD,
    },
  ];

  const roleSpecificItems = {
    [ROLES.RECRUITMENT]: [
      {
        id: "employees",
        title: "Employees",
        icon: Users,
        path: ROUTES.EMPLOYEES,
      },
    ],
    [ROLES.ADMIN]: [
      {
        id: "routes",
        title: "Routes",
        icon: MapPin,
        path: ROUTES.ROUTES,
      },
      {
        id: "shuttles",
        title: "Shuttles",
        icon: Truck,
        path: ROUTES.SHUTTLES,
      },
      {
        id: "employees",
        title: "Employees",
        icon: Users,
        path: ROUTES.EMPLOYEES,
      },
      {
        id: "payroll",
        title: "Payroll",
        icon: DollarSign,
        path: ROUTES.PAYROLL,
      },
      {
        id: "settings",
        title: "Settings",
        icon: Settings,
        path: ROUTES.SETTINGS,
      },
    ],
    [ROLES.MANAGER]: [
      {
        id: "routes",
        title: "Routes",
        icon: MapPin,
        path: ROUTES.ROUTES,
      },
      {
        id: "shuttles",
        title: "Shuttles",
        icon: Truck,
        path: ROUTES.SHUTTLES,
      },
    ],
  };

  return [...baseItems, ...(roleSpecificItems[role] || [])];
};

const Sidebar = () => {
  const location = useLocation();
  const { isOpen: isCollapsed, toggleSidebar } = useSidebar();
  const { theme } = useTheme();
  const { role } = useRole();

  const isDark = theme === "dark";
  const menuItems = getMenuItems(role);

  return (
    <aside
      className={cn(
        "fixed left-0 z-40",
        "pt-[var(--topbar-height)]",
        "border-r",
        "transition-[width] duration-300 ease-in-out",
        "min-h-[calc(100%+var(--footer-height,0px))]",
        isDark
          ? "bg-[#1a2327]/95 border-white/10 backdrop-blur-md"
          : "bg-white/95 border-black/10 backdrop-blur-md"
      )}
      style={{
        width: isCollapsed
          ? "var(--sidebar-width-collapsed)"
          : "var(--sidebar-width)",
      }}
    >
      <div className="h-full overflow-y-auto scrollbar-hide">
        <div className="px-3 pt-8">
          {/* Header */}
          <div
            className={cn(
              "flex items-center mb-8",
              isCollapsed ? "justify-center px-0" : "justify-between pl-4"
            )}
          >
            <div
              className={cn(
                "flex items-center overflow-hidden transition-all duration-300",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}
            >
              <img
                src="/assets/images/MMCYTech.png"
                alt="MMCY Tech"
                className="h-8 w-8 object-contain"
              />
              <span className="ml-2 text-xl font-bold whitespace-nowrap bg-gradient-to-r from-[#f3684e] to-[#ff965b] bg-clip-text text-transparent">
                MMCY Tech
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className={cn(
                "p-2 rounded-xl transition-colors",
                "hover:bg-[#f3684e]/10",
                isDark
                  ? "text-white/70 hover:text-white"
                  : "text-gray-600 hover:text-[#f3684e]",
                isCollapsed ? "w-12 h-12" : "w-10 h-10"
              )}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu
                className={cn(
                  "h-5 w-5 transition-transform duration-300 mx-auto",
                  isCollapsed ? "rotate-180" : "rotate-0"
                )}
              />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <Link key={item.id} to={item.path}>
                <button
                  className={cn(
                    "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl",
                    "transition-all duration-200 ease-in-out",
                    "group relative overflow-hidden",
                    isCollapsed ? "justify-center" : "justify-start",
                    location.pathname === item.path
                      ? "bg-gradient-to-r from-[#f3684e] to-[#ff965b] text-white shadow-lg shadow-[#f3684e]/20"
                      : isDark
                      ? "text-white/70 hover:text-white hover:bg-white/5"
                      : "text-gray-600 hover:text-[#f3684e] hover:bg-[#f3684e]/5"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0 transition-all duration-200",
                      isCollapsed ? "mr-0" : "mr-3",
                      location.pathname === item.path
                        ? "text-white"
                        : isDark
                        ? "text-white/70 group-hover:text-white"
                        : "text-gray-400 group-hover:text-[#f3684e]"
                    )}
                  />
                  <span
                    className={cn(
                      "transition-all duration-200",
                      isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}
                  >
                    {item.title}
                  </span>
                  {isCollapsed && (
                    <div
                      className={cn(
                        "absolute left-full ml-2 px-2 py-1 rounded-md text-sm whitespace-nowrap",
                        isDark
                          ? "bg-[#1a2327] border-white/10"
                          : "bg-white border-black/10",
                        "border opacity-0 group-hover:opacity-100 transition-opacity",
                        "pointer-events-none z-50"
                      )}
                    >
                      {item.title}
                    </div>
                  )}
                </button>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
