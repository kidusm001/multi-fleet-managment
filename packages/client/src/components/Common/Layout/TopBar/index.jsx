import React, { useState, useEffect, useRef } from "react";
import { createAuthClient } from "better-auth/react";
import { useTheme } from "@contexts/ThemeContext";
import { useRole } from "@contexts/RoleContext";
import { useNavigate, Link } from "react-router-dom";
import ThemeToggle from "@components/Common/UI/ThemeToggle";
import {
  Search,
  LogOut,
  X,
  ArrowRight,
  Clock,
  MapPin,
  Calendar,
  Car,
  User,
  FileText,
} from "lucide-react";
import { ROLES, ROLE_LABELS } from "@data/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Common/UI/Select";
import { cn } from "@lib/utils";
import { Badge } from "@/components/Common/UI/Badge";
import { NotificationDropdown } from "@components/Common/Notifications/NotificationDropdown";
import { authClient } from "@lib/auth-client"; // Import authClient
import { UserDropdown } from "@/components/Common/Layout/TopBar/user-dropdown-menu";
import { useUser } from "@contexts/UserContext";
import { Button } from "@components/Common/UI/Button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Layout, Bus } from "lucide-react";
import { useClickOutside } from "../../../../hooks/useClickOutside";
import { Input } from "@/components/Common/UI/Input";
import { Bug } from "lucide-react";
import { searchService } from "../../../../services/searchService";

const { useSession } = createAuthClient();

// Icon mapping for search result types
const TypeIcon = ({ type }) => {
  switch (type) {
    case "page":
      return <FileText className="w-4 h-4" />;
    case "route":
      return <MapPin className="w-4 h-4" />;
    case "shuttle":
      return <Car className="w-4 h-4" />;
    case "employee":
      return <User className="w-4 h-4" />;
    case "driver":
      return <User className="w-4 h-4" />;
    case "shift":
      return <Clock className="w-4 h-4" />;
    case "department":
      return <Layout className="w-4 h-4" />;
    case "candidate":
      return <User className="w-4 h-4 text-blue-500" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

function TopBar() {
  const { theme } = useTheme();
  const { role, setRole } = useRole();
  const navigate = useNavigate();
  const isDark = theme === "dark";
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  const {
    data: session,
    isPending,
    error: sessionError,
    refetch,
  } = useSession();

  const [username, setUsername] = useState("Loading...");

  useEffect(() => {
    if (!isPending && session?.user) {
      setUsername(session.user.name);
      console.log("Session loaded:", session.user);
    }
  }, [session, isPending]);

  // Handle outside click to close search results
  useClickOutside([searchInputRef, searchResultsRef], () => {
    setShowSearchResults(false);
  });

  const handleSearchInputChange = (e) => {
    const inputValue = e.target.value;
    setSearchInput(inputValue);
    // Log input change
    console.log(`[TopBar] Search input changed to: "${inputValue}"`);

    // Trigger immediate search for responsive feeling
    if (inputValue.length >= 1) {
      setIsSearching(true);
      setShowSearchResults(true);

      // Don't wait for debounce, trigger search immediately
      searchService
        .search(inputValue, role)
        .then((results) => {
          console.log(
            `[TopBar] Immediate search found ${results?.length || 0} results`
          );
          setSearchResults(results);
          setShowSearchResults(results.length > 0);
          setIsSearching(false);
        })
        .catch((error) => {
          console.error("[TopBar] Immediate search error:", error);
          setIsSearching(false);
        });
    } else {
      // Clear results when search is empty
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSearchResultClick = (result) => {
    // Navigate to the appropriate route
    const path = searchService.getRoutePath(result);

    // Check if the path is an object with pathname and state
    if (path && typeof path === "object" && path.pathname) {
      // For routes, this will include the selectedRouteId and openDrawer flag
      // which will be used by RouteManagementView to open the drawer
      navigate(path.pathname, { state: path.state });
    } else {
      // Handle string paths as before
      navigate(path);
    }

    // Clear search and hide results
    setSearchInput("");
    setShowSearchResults(false);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 backdrop-blur-xl h-[60px]",
        isDark
          ? "bg-[#0c1222]/80 border-[#4272FF]/10"
          : "bg-white/80 border-[#4272FF]/5",
        "border-b"
      )}
    >
      <div className="flex items-center justify-between px-6 h-full max-w-[2000px] mx-auto">
        {/* Left section */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/assets/images/RoutegnaTech.png"
              alt="Routegna Tech"
              className="h-8 w-auto"
            />
          </Link>

          <div className="relative search-container">
            <div
              className={cn(
                "flex items-center rounded-xl px-3 py-1.5 transition-all duration-200",
                isDark
                  ? "bg-white/5 hover:bg-white/10"
                  : "bg-black/5 hover:bg-black/10"
              )}
            >
              <button className="flex items-center">
                {isSearching ? (
                  <Loader2
                    className={cn(
                      "w-4 h-4 animate-spin",
                      isDark ? "text-white/40" : "text-black/40"
                    )}
                  />
                ) : (
                  <Search
                    className={cn(
                      "w-4 h-4",
                      isDark ? "text-white/40" : "text-black/40"
                    )}
                  />
                )}
              </button>
              <input
                ref={searchInputRef}
                className={cn(
                  "bg-transparent border-none outline-none pl-2 pr-8 text-sm w-64 transition-all duration-200",
                  isDark
                    ? "placeholder:text-white/40 text-white"
                    : "placeholder:text-black/40 text-black",
                  "focus:w-80"
                )}
                placeholder={
                  role === ROLES.ADMIN
                    ? "Search routes, employees, shuttles... (Ctrl+K)"
                    : role === ROLES.MANAGER
                    ? "Search routes and shuttles... (Ctrl+K)"
                    : role === ROLES.RECRUITMENT
                    ? "Search candidates, employees, routes... (Ctrl+K)"
                    : "Search routes... (Ctrl+K)"
                }
                value={searchInput}
                onChange={handleSearchInputChange}
                style={{ colorScheme: isDark ? "dark" : "light" }}
              />
              {searchInput ? (
                <button
                  onClick={() => setSearchInput("")}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2",
                    isDark ? "text-white/40" : "text-black/40",
                    "hover:text-opacity-100 transition-opacity"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <span
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                    isDark ? "text-white/40" : "text-black/40"
                  )}
                >
                  ⌘K
                </span>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div
                ref={searchResultsRef}
                className={cn(
                  "absolute top-full mt-1 w-full rounded-md border bg-popover p-2 shadow-md",
                  isDark
                    ? "bg-gray-800/90 border-gray-700"
                    : "bg-white/90 border-gray-200"
                )}
              >
                {isSearching ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Searching...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-2 text-center text-muted-foreground">
                    No results found. Try a different search term.
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.type}-${result.id || index}`}
                        className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 hover:bg-accent"
                        onClick={() => handleSearchResultClick(result)}
                      >
                        <TypeIcon type={result.type} />
                        <div className="ml-2">
                          <div className="font-medium">{result.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {result.subtitle}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          <NotificationDropdown />

          <ThemeToggle />
          <UserDropdown
            username={username}
            email={session?.user?.email}
            role={ROLE_LABELS[role]}
          />
        </div>
      </div>
    </header>
  );
}

export default TopBar;
