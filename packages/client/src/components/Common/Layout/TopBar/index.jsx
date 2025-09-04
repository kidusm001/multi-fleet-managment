import React, { useState, useEffect, useRef } from "react";
import { createAuthClient } from "better-auth/react";
import { useTheme } from "@contexts/ThemeContext";
import { useRole } from "@contexts/RoleContext";
import { useNavigate, Link } from "react-router-dom";
import ThemeToggle from "@components/Common/UI/ThemeToggle";
import {
  Search,
  X,
  Clock,
  MapPin,
  Car,
  FileText,
  User,
  LayoutGrid,
  Menu,
} from "lucide-react";
import { ROLES, ROLE_LABELS } from "@data/constants";
import { cn } from "@lib/utils";
import { NotificationDropdown } from "@components/Common/Notifications/NotificationDropdown";
import { UserDropdown } from "@/components/Common/Layout/TopBar/user-dropdown-menu";
import { Loader2 } from "lucide-react";
import { useClickOutside } from "../../../../hooks/useClickOutside";
import { searchService } from "../../../../services/searchService";
import MobileNavMenu from "./MobileNavMenu";
import MainNav from "./MainNav";
import OrganizationSwitcher from "@components/Common/Organizations/OrganizationSwitcher";

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
      return <LayoutGrid className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

function TopBar() {
  const { theme } = useTheme();
  const { role } = useRole();
  const navigate = useNavigate();
  const isDark = theme === "dark";
  const logoSrc = isDark
    ? "/assets/images/logo-light.png"
    : "/assets/images/logo-dark.PNG";
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  const {
    data: session,
    isPending,
  } = useSession();

  const [username, setUsername] = useState("Loading...");

  // Check if screen height is compact
  const [isCompactHeight, setIsCompactHeight] = useState(false);

  useEffect(() => {
    const checkHeight = () => {
      setIsCompactHeight(window.innerHeight < 360);
    };
    
    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, []);

  useEffect(() => {
    if (!isPending && session?.user) {
      const fallbackName = session.user.email?.split('@')[0] || 'User';
      setUsername(session.user.name || fallbackName);
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
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-200",
          isCompactHeight ? "h-[56px] px-4" : "h-[60px] px-6",
          isDark
            ? "bg-[#0c1222]/80 border-[#4272FF]/10"
            : "bg-white/80 border-[#4272FF]/5",
          "border-b"
        )}
      >
        <div className="flex items-center justify-between h-full max-w-[2000px] mx-auto">
          {/* Left section: Mobile menu + Logo */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={cn(
                "md:hidden p-2 rounded-lg transition-colors",
                isDark
                  ? "hover:bg-white/10 text-white"
                  : "hover:bg-gray-100 text-gray-900"
              )}
              aria-label="Open navigation"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logoSrc}
                alt="Routegna"
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Center section: MainNav and SearchBar (desktop only) */}
          <div className="hidden md:flex flex-1 items-center justify-between">
            <MainNav isDark={isDark} />
            <div className="flex items-center gap-6 flex-1 justify-center max-w-2xl">
              {import.meta.env.VITE_ENABLE_ORGANIZATIONS === 'true' && (
                <OrganizationSwitcher isDark={isDark} />
              )}
              <div className="flex-1 flex justify-center max-w-lg">
              <div className="relative search-container w-full">
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
                      "bg-transparent border-none outline-none pl-2 pr-8 text-sm w-full transition-all duration-200",
                      isDark
                        ? "placeholder:text-white/40 text-white"
                        : "placeholder:text-black/40 text-black"
                    )}
                    placeholder={
                      role === ROLES.ADMIN
                        ? "Search routes, employees, shuttles... (Ctrl+K)"
                        : role === ROLES.MANAGER
                        ? "Search routes and shuttles... (Ctrl+K)"
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
                      "absolute top-full mt-1 w-full rounded-md border bg-popover p-2 shadow-md z-50",
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
            </div>
            <div className="w-[200px]"></div> {/* Spacer retained to balance layout end */}
          </div>

          {/* Right section: User/Notifications/Theme */}
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

      {/* Mobile Navigation Menu */}
      <MobileNavMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isDark={isDark}
      />
    </>
  );
}

export default TopBar;
