import React, { useState, useEffect, useRef } from "react";
import { useSession } from "@lib/auth-client";
import { useTheme } from "@contexts/ThemeContext";
import { useRole } from "@contexts/RoleContext";
import { useNavigate, Link } from "react-router-dom";
import ThemeToggle from "@components/Common/UI/ThemeToggle";
import {
  Clock,
  MapPin,
  Car,
  FileText,
  User,
  LayoutGrid
} from "lucide-react";
import { ROLE_LABELS } from "@data/constants";
import { cn } from "@lib/utils";
import { NotificationDropdown } from "@components/Common/Notifications/NotificationDropdown";
import { UserDropdown } from "@/components/Common/Layout/TopBar/user-dropdown-menu";
import { useClickOutside } from "../../../../hooks/useClickOutside";
import MainNav from "./MainNav";
import SearchBar from "./SearchBar";
import { searchService } from "../../../../services/searchService";


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
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  const {
    data: session,
    isPending,
  } = useSession();

  const [username, setUsername] = useState("Loading...");
  const handleNavKeyDown = (e) => {
    if (e.key === 'Escape') {
      const el = document.activeElement;
      if (el && typeof el.blur === 'function') el.blur();
    }
  };

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
        {/* Left section: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logoSrc}
            alt="Routegna"
            className="h-14 w-auto"
          />
        </Link>

        {/* Center section: MainNav and SearchBar */}
        <div className="flex-1 flex items-center justify-between">
          <MainNav isDark={isDark} onKeyDown={handleNavKeyDown} />
          <div className="flex-1 flex justify-center">
            <SearchBar
              isDark={isDark}
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              isSearching={isSearching}
              searchInputRef={searchInputRef}
              searchResultsRef={searchResultsRef}
              showSearchResults={showSearchResults}
              searchResults={searchResults}
              handleSearchInputChange={handleSearchInputChange}
              handleSearchResultClick={handleSearchResultClick}
              role={role}
              TypeIcon={TypeIcon}
            />
          </div>
          <div className="w-[200px]"></div> {/* Spacer to balance the layout */}
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
  );
}

export default TopBar;
