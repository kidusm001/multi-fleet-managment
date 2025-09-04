import api from './api';

/**
 * Service for searching across multiple entity types with role-based filtering
 */
class SearchService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 1 * 60 * 1000; // 1 minute cache timeout
        console.log('Search service initialized');
    }

    /**
     * Clear the search cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Search across different entities based on user role
     * @param {string} query - Search query
     * @param {string} role - User role
     * @param {number} limit - Maximum number of results to return
     * @returns {Promise<Array>} Search results
     */
    async search(query, role, limit = 20) {
        console.log(`[SEARCH] Search called with query: "${query}", role: "${role}"`);

        // Allow even single character searches for better responsiveness
        if (!query || query.trim().length < 1) {
            console.log('[SEARCH] Search query empty, returning empty results');
            return [];
        }

        // Check if it's likely a route search
        const cleanQuery = query.trim().toLowerCase();
        const isRouteQuery = ['route', 'rout', 'rte', 'rt'].some(term =>
            cleanQuery.includes(term) ||
            (term.length > 2 && term.startsWith(cleanQuery))
        );

    // Using provided role as-is
    const effectiveRole = role;

        // Log if search appears to be route-related
        if (isRouteQuery) {
            console.log(`[SEARCH] Query "${cleanQuery}" appears to be route-related`);
        }

        try {
            // Make the API call
            const requestParams = {
                query,
                limit,
                role: effectiveRole,
                isRouteQuery: isRouteQuery
            };
            console.log(`[SEARCH] Making API search request: search with params:`, requestParams);

            // Force direct API fetch to bypass any potential axios issues
            try {
                const url = new URL('/api/search', window.location.origin);
                url.searchParams.append('query', query);
                url.searchParams.append('limit', limit);
                url.searchParams.append('role', effectiveRole);

                // Add isRouteQuery parameter if detected
                if (isRouteQuery) {
                    url.searchParams.append('isRouteQuery', 'true');
                }

                console.log(`[SEARCH] Direct fetch URL: ${url.toString()}`);

                const fetchResponse = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    credentials: 'include'
                });

                if (!fetchResponse.ok) {
                    throw new Error(`API returned status ${fetchResponse.status}`);
                }

                const data = await fetchResponse.json();
                console.log('[SEARCH] Direct fetch response:', data);

                if (data && data.results) {
                    if (data.results.length === 0) {
                        console.log('[SEARCH] API returned zero results');
                        return [];
                    }

                    console.log(`[SEARCH] API returned ${data.results.length} results`);
                    return data.results;
                }
            } catch (fetchError) {
                console.error('[SEARCH] Direct fetch failed:', fetchError);
                // Fall back to axios if fetch fails
            }

            // If fetch approach failed, try the regular axios approach
            const response = await api.get('/search', {
                params: requestParams
            });

            console.log('[SEARCH] API search response status:', response.status);

            if (response.data) {
                console.log('[SEARCH] API response data:', response.data);
            }

            if (response.data && response.data.results) {
                if (response.data.results.length === 0) {
                    console.log('[SEARCH] API returned zero results');
                    return [];
                }

                console.log(`[SEARCH] API returned ${response.data.results.length} results of types:`,
                    response.data.results.map(r => r.type).reduce((acc, type) => {
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                    }, {}));
                return response.data.results;
            } else {
                console.log('[SEARCH] API returned invalid response format:', response.data);
                return [];
            }
        } catch (error) {
            console.error('[SEARCH] Search API error:', error);
            console.error('[SEARCH] Error details:', error.response?.data || error.message);
            throw error; // Re-throw to handle in component
        }
    }

    /**
     * Get the route path for a search result
     * @param {Object} result - Search result item
     * @returns {string|Object} Route path or route object with pathname and state
     */
    getRoutePath(result) {
        // If the result has a specific path (pages), use it
        if (result.path) {
            return result.path;
        }

        // For entity types, determine the path based on type according to user's requirements
        switch (result.type) {
            case "page":
                return result.path || "/dashboard";
            case "route":
                // Return an object with pathname and state to open the drawer for this route
                return {
                    pathname: '/routes',
                    state: { selectedRouteId: result.id, openDrawer: true }
                };
            case "employee":
                return `/employees`; // Employees go to /employees (no ID)
            case "shuttle":
                return `/shuttles`; // Shuttles go to /shuttles (no ID)
            case "driver":
                return `/drivers`; // Drivers go to /drivers (no ID)
            case "shift":
                return {
                    pathname: '/settings',
                    state: { activeTab: 'shifts' }
                }; // Shifts go to /settings with shifts tab active
            // Legacy type removed
            case "department":
                return {
                    pathname: '/settings',
                    state: { activeTab: 'departments' }
                }; // Departments go to /settings with departments tab active
            default:
                return "/dashboard";
        }
    }

    /**
     * Perform a quick action based on search result type
     * @param {Object} result - Search result item
     * @returns {Promise<boolean>} Success status
     */
    async performQuickAction(result) {
        try {
            switch (result.type) {
                case "route":
                    // Example: Toggle route active status
                    await api.patch(`/routes/${result.id}/toggle-status`);
                    return true;

                case "shuttle":
                    // Example: View shuttle details in a modal
                    // This would typically be handled by the UI component
                    return true;

                default:
                    return false;
            }
        } catch (error) {
            console.error('Quick action error:', error);
            return false;
        }
    }
}

// Create and export a singleton instance
export const searchService = new SearchService(); 