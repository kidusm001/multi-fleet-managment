import { AsyncHandler } from '../utils/asyncHandler';

import api from './api';

class ShiftService {
    constructor() {
        // In-memory cache for shifts
        this.cache = {
            shifts: null,
            lastFetched: null,
            cacheTimeout: 5 * 60 * 1000, // 5 minutes cache timeout
        };
    }

    /**
     * Get all shifts with optional caching
     * @param {boolean} useCache - Whether to use cached data if available
     * @returns {Promise<Array>} Array of shifts
     */
    getAllShifts = AsyncHandler(async (useCache = true) => {
        // Return cached data if it's still valid
        if (useCache &&
            this.cache.shifts &&
            this.cache.lastFetched &&
            Date.now() - this.cache.lastFetched < this.cache.cacheTimeout) {
            return this.cache.shifts;
        }

        const response = await api.get('/shifts');

        // Update cache
        this.cache.shifts = response.data;
        this.cache.lastFetched = Date.now();

        return response.data;
    });

    /**
     * Get shift by ID
     * @param {number} id - Shift ID
     * @returns {Promise<Object>} Shift object
     */
    getShiftById = AsyncHandler(async (id) => {
        // Check cache first
        if (this.cache.shifts) {
            const cachedShift = this.cache.shifts.find(shift => shift.id === id);
            if (cachedShift) return cachedShift;
        }

        const response = await api.get(`/shifts/${id}`);
        return response.data;
    });

    /**
     * Get all shift end times
     * @returns {Promise<Array>} Array of shift end times
     */
    getAllShiftEndTimes = AsyncHandler(async () => {
        const response = await api.get('/shifts/endtimes');
        return response.data;
    });

    /**
     * Create a new shift
     * @param {Object} shiftData - Shift data
     * @returns {Promise<Object>} Created shift
     */
    createShift = AsyncHandler(async (shiftData) => {
        const response = await api.post('/shifts', shiftData);

        // Invalidate cache
        this.cache.shifts = null;
        this.cache.lastFetched = null;

        return response.data;
    });

    /**
     * Update a shift
     * @param {number} id - Shift ID
     * @param {Object} updates - Update data
     * @returns {Promise<Object>} Updated shift
     */
    updateShift = AsyncHandler(async (id, updates) => {
        const response = await api.put(`/shifts/${id}`, updates);

        // Update cache if it exists
        if (this.cache.shifts) {
            this.cache.shifts = this.cache.shifts.map(shift =>
                shift.id === id ? { ...shift, ...response.data } : shift
            );
        }

        return response.data;
    });

    /**
     * Delete a shift
     * @param {number} id - Shift ID
     * @returns {Promise<void>}
     */
    deleteShift = AsyncHandler(async (id) => {
        await api.delete(`/shifts/${id}`);

        // Update cache if it exists
        if (this.cache.shifts) {
            this.cache.shifts = this.cache.shifts.filter(shift => shift.id !== id);
        }
    });

    /**
     * Get shifts by time range
     * @param {Date} startTime - Start time
     * @param {Date} endTime - End time
     * @returns {Promise<Array>} Array of shifts
     */
    getShiftsByTimeRange = AsyncHandler(async (startTime, endTime) => {
        const response = await api.get('/shifts/range', {
            params: {
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
            },
        });
        return response.data;
    });

    /**
     * Get shifts with employee count
     * @returns {Promise<Array>} Array of shifts with employee counts
     */
    getShiftsWithEmployeeCount = AsyncHandler(async () => {
        const response = await api.get('/shifts/employee-count');
        return response.data;
    });

    /**
     * Clear the service cache
     */
    clearCache() {
        this.cache.shifts = null;
        this.cache.lastFetched = null;
    }
}

export const shiftService = new ShiftService(); 