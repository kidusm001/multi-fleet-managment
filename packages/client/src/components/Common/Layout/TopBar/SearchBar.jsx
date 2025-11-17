import React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@lib/utils";

export default function SearchBar({
  isDark,
  searchInput,
  setSearchInput,
  isSearching,
  searchInputRef,
  searchResultsRef,
  showSearchResults,
  searchResults,
  handleSearchInputChange,
  handleSearchResultClick,
  role,
  TypeIcon,
}) {
  return (
    <div className="relative search-container flex-1 flex justify-center">
      <div
        className={cn(
          "flex items-center rounded-xl px-3 py-1.5 transition-all duration-200 max-w-lg mx-auto relative",
          isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"
        )}
      >
        <button className="flex items-center z-10">
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
            isDark ? "placeholder:text-white/40 text-white" : "placeholder:text-black/40 text-black",
            "focus:w-80 font-sans"
          )}
          placeholder={
            role === "admin"
              ? "Search routes, employees, shuttles... (Ctrl+K)"
              : role === "fleetManager"
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
              "absolute right-3 top-1/2 -translate-y-1/2 z-10",
              isDark ? "text-white/40" : "text-black/40",
              "hover:text-opacity-100 transition-opacity"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>
      {/* Search Results Dropdown */}
      {showSearchResults && (
        <div
          ref={searchResultsRef}
          className={cn(
            "absolute top-full mt-1 w-full rounded-md border bg-popover p-2 shadow-md z-50",
            isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-black"
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
                  className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 hover:bg-blue-900/30 transition-colors duration-150"
                  onClick={() => handleSearchResultClick(result)}
                >
                  <TypeIcon type={result.type} />
                  <div className="ml-2">
                    <div className="font-normal font-sans">{result.title}</div>
                    <div className="text-xs text-muted-foreground font-sans">
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
  );
}
