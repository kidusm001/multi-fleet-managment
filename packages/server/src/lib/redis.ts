import { createClient } from 'redis';
import crypto from 'crypto';

type RedisClientType = ReturnType<typeof createClient>;

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType | null> {
    if (redisClient) {
        return redisClient;
    }

    // Only use Redis if enabled
    const redisEnabled = process.env.REDIS_ENABLED === 'true';
    if (!redisEnabled) {
        console.log('📦 Redis caching is disabled');
        return null;
    }

    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        redisClient = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries: number) => {
                    if (retries > 10) {
                        console.error('❌ Redis max retries exceeded, disabling Redis');
                        return false;
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        redisClient.on('error', (err: Error) => {
            console.error('❌ Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });

        redisClient.on('ready', () => {
            console.log('🚀 Redis client ready');
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.error('❌ Failed to connect to Redis:', error);
        redisClient = null;
        return null;
    }
}

export async function closeRedisClient(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
}

/**
 * Generate a cache key for clustering requests
 */
export function generateClusteringCacheKey(data: {
    organizationId: string;
    employees: Array<{ id: string; latitude: number; longitude: number }>;
    vehicles: Array<{ id: string; capacity: number }>;
}): string {
    // Sort employees and vehicles by ID to ensure consistent ordering
    const sortedEmployees = [...data.employees].sort((a, b) => a.id.localeCompare(b.id));
    const sortedVehicles = [...data.vehicles].sort((a, b) => a.id.localeCompare(b.id));

    const cacheData = {
        orgId: data.organizationId,
        emp: sortedEmployees.map(e => ({ id: e.id, lat: e.latitude, lng: e.longitude })),
        veh: sortedVehicles.map(v => ({ id: v.id, cap: v.capacity }))
    };

    // Create a hash of the data for a compact cache key
    const hash = crypto
        .createHash('sha256')
        .update(JSON.stringify(cacheData))
        .digest('hex')
        .substring(0, 16);

    return `clustering:${data.organizationId}:${hash}`;
}

/**
 * Get cached clustering result
 */
export async function getCachedClusteringResult(cacheKey: string): Promise<any | null> {
    const client = await getRedisClient();
    if (!client) {
        return null;
    }

    try {
        const cached = await client.get(cacheKey);
        if (cached) {
            console.log(`🎯 Cache HIT for key: ${cacheKey}`);
            return JSON.parse(cached);
        }
        console.log(`❌ Cache MISS for key: ${cacheKey}`);
        return null;
    } catch (error) {
        console.error('❌ Error getting cached result:', error);
        return null;
    }
}

/**
 * Cache clustering result with TTL (default 1 hour)
 */
export async function setCachedClusteringResult(
    cacheKey: string,
    result: any,
    ttlSeconds: number = 3600
): Promise<void> {
    const client = await getRedisClient();
    if (!client) {
        return;
    }

    try {
        await client.setEx(cacheKey, ttlSeconds, JSON.stringify(result));
        console.log(`💾 Cached result for key: ${cacheKey} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
        console.error('❌ Error caching result:', error);
    }
}

/**
 * Invalidate all clustering cache for an organization
 */
export async function invalidateOrganizationClusteringCache(organizationId: string): Promise<void> {
    const client = await getRedisClient();
    if (!client) {
        return;
    }

    try {
        const pattern = `clustering:${organizationId}:*`;
        const keys = await client.keys(pattern);
        
        if (keys.length > 0) {
            await client.del(keys);
            console.log(`🗑️  Invalidated ${keys.length} clustering cache entries for org: ${organizationId}`);
        }
    } catch (error) {
        console.error('❌ Error invalidating cache:', error);
    }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ connected: boolean; dbSize?: number; info?: string }> {
    const client = await getRedisClient();
    if (!client) {
        return { connected: false };
    }

    try {
        const dbSize = await client.dbSize();
        const info = await client.info('stats');
        return { connected: true, dbSize, info };
    } catch (error) {
        console.error('❌ Error getting cache stats:', error);
        return { connected: false };
    }
}
