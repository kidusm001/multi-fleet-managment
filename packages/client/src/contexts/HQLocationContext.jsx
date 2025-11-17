import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { fetchHQLocation, getCachedHQLocation } from "@/services/hqLocationService";

const HQLocationContext = createContext(undefined);

export function HQLocationProvider({ children }) {
  const [location, setLocation] = useState(() => getCachedHQLocation());
  const [isLoading, setIsLoading] = useState(() => !getCachedHQLocation());
  const [error, setError] = useState(null);

  const loadLocation = useCallback(async (options = {}) => {
    const { force = false } = options;
    setIsLoading(true);
    setError(null);

    try {
      const fetched = await fetchHQLocation({ force });
      setLocation(fetched ?? null);
      return fetched;
    } catch (err) {
      setError(err);
      setLocation(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch if we do not already have cached data
    if (location?.coords) {
      setIsLoading(false);
      return;
    }

    loadLocation().catch(() => {
      // Errors are stored in state; we deliberately swallow them here.
    });
  }, [location?.coords, loadLocation]);

  const value = useMemo(
    () => ({
      location,
      isLoading,
      error,
      refresh: () => loadLocation({ force: true }),
    }),
    [location, isLoading, error, loadLocation]
  );

  return (
    <HQLocationContext.Provider value={value}>{children}</HQLocationContext.Provider>
  );
}

export function useHQLocation() {
  const context = useContext(HQLocationContext);
  if (!context) {
    throw new Error("useHQLocation must be used within an HQLocationProvider");
  }
  return context;
}
