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
     * Server handles role-based permissions and organization filtering
     * @param {string} query - Search query
     * @param {string} role - User role (optional, server determines from session)
     * @param {number} limit - Maximum number of results to return
     * @returns {Promise<Array>} Search results
     */
    async search(query, role, limit = 20) {
        console.log(`[SEARCH] Search called with query: "${query}"`);

        // Allow even single character searches for better responsiveness
        if (!query || query.trim().length < 1) {
            console.log('[SEARCH] Search query empty, returning empty results');
            return [];
        }

        try {
            const url = new URL('/api/search', window.location.origin);
            url.searchParams.append('query', query);
            url.searchParams.append('limit', limit);

            console.log(`[SEARCH] Fetching from: ${url.toString()}`);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include' // Important for session cookies
            });

            if (!response.ok) {
                console.error(`[SEARCH] API returned status ${response.status}`);
                return [];
            }

            const data = await response.json();
            
            if (data && data.results) {
                console.log(`[SEARCH] Found ${data.results.length} results`);
                return data.results;
            }

            console.log('[SEARCH] API returned invalid response format');
            return [];
        } catch (error) {
            console.error('[SEARCH] Search API error:', error);
            return [];
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

        // For entity types, determine the path based on type
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
                return '/employees';
            
            case "shuttle":
            case "vehicle":
                return '/shuttles';
            
            case "driver":
                return '/driver-management';
            
            case "shift":
                return {
                    pathname: '/settings',
                    state: { activeTab: 'shifts' }
                };
            
            case "department":
                return {
                    pathname: '/settings',
                    state: { activeTab: 'departments' }
                };
            
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