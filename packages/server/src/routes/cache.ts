import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getRedisClient, getCacheStats } from '../lib/redis';

const router = express.Router();

/**
 * @route   GET /api/cache/stats
 * @desc    Get Redis cache statistics
 * @access  Private (User)
 */
router.get('/stats', requireAuth, async (req: Request, res: Response) => {
    try {
        const stats = await getCacheStats();
        const redisEnabled = process.env.REDIS_ENABLED === 'true';
        const cacheTTL = parseInt(process.env.CLUSTERING_CACHE_TTL || '3600', 10);

        res.json({
            enabled: redisEnabled,
            cacheTTL,
            redis: stats
        });
    } catch (error) {
        console.error('Error getting cache stats:', error);
        res.status(500).json({ message: 'Failed to get cache statistics' });
    }
});

/**
 * @route   POST /api/cache/clear
 * @desc    Clear all clustering cache
 * @access  Private (Admin only)
 */
router.post('/clear', requireAuth, async (req: Request, res: Response) => {
    try {
        const redisClient = await getRedisClient();
        if (!redisClient) {
            return res.status(400).json({ 
                message: 'Redis is not enabled or not connected' 
            });
        }

        // Get all clustering cache keys
        const pattern = 'fastapi:clustering:*';
        const keys = await redisClient.keys(pattern);

        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`🗑️  Cleared ${keys.length} clustering cache entries`);
            res.json({ 
                message: 'Cache cleared successfully',
                entriesCleared: keys.length
            });
        } else {
            res.json({ 
                message: 'No cache entries found',
                entriesCleared: 0
            });
        }
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({ message: 'Failed to clear cache' });
    }
});

/**
 * @route   GET /api/cache/keys
 * @desc    List all cache keys (for debugging)
 * @access  Private (Admin only)
 */
router.get('/keys', requireAuth, async (req: Request, res: Response) => {
    try {
        const redisClient = await getRedisClient();
        if (!redisClient) {
            return res.status(400).json({ 
                message: 'Redis is not enabled or not connected' 
            });
        }

        const pattern = req.query.pattern as string || 'fastapi:clustering:*';
        const keys = await redisClient.keys(pattern);

        res.json({ 
            pattern,
            count: keys.length,
            keys: keys.slice(0, 100) // Limit to 100 keys for safety
        });
    } catch (error) {
        console.error('Error getting cache keys:', error);
        res.status(500).json({ message: 'Failed to get cache keys' });
    }
});

export default router;
