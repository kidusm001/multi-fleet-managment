import { useCallback, useRef } from 'react';
import { optimizeRoute as optimizeRouteService } from '@services/routeOptimization';

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function useRouteOptimizer() {
    const routeCache = useRef(new Map());

    const clearExpiredCache = useCallback(() => {
        const now = Date.now();
        for (const [key, value] of routeCache.current.entries()) {
            if (now - value.timestamp > CACHE_EXPIRY) {
                routeCache.current.delete(key);
            }
        }
    }, []);

    const getCacheKey = useCallback((route) => {
        if (!route?.coordinates?.length) return null;
        return JSON.stringify({
            coordinates: route.coordinates,
            areas: route.areas || [],
        });
    }, []);

    const optimizeRoute = useCallback(async (route) => {
        if (!route?.coordinates?.length) {
            throw new Error('Invalid route data');
        }

        // Clear expired cache entries
        clearExpiredCache();

        // Check cache
        const cacheKey = getCacheKey(route);
        const cachedRoute = routeCache.current.get(cacheKey);

        if (cachedRoute && Date.now() - cachedRoute.timestamp < CACHE_EXPIRY) {
            return cachedRoute.data;
        }

        try {
            // Optimize route using web worker
            const optimizedRoute = await optimizeRouteService(route);

            // Cache the result
            routeCache.current.set(cacheKey, {
                data: optimizedRoute,
                timestamp: Date.now(),
            });

            return optimizedRoute;
        } catch (error) {
            console.error('Route optimization error:', error);
            throw new Error('Failed to optimize route');
        }
    }, [clearExpiredCache, getCacheKey]);

    return { optimizeRoute };
} 