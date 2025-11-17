import IORedis from 'ioredis';

let redisConnection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (redisConnection) {
    return redisConnection;
  }

  const redisEnabled = process.env.REDIS_ENABLED === 'true';
  const bullmqEnabled = process.env.BULLMQ_ENABLED === 'true';

  if (!redisEnabled || !bullmqEnabled) {
    throw new Error('Redis and BullMQ must be enabled for job processing');
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redisConnection.on('error', (err: Error) => {
    console.error('❌ BullMQ Redis connection error:', err);
  });

  redisConnection.on('connect', () => {
    console.log('✅ BullMQ Redis connected');
  });

  redisConnection.on('ready', () => {
    console.log('🚀 BullMQ Redis ready');
  });

  return redisConnection;
}

export async function closeRedisConnection(): Promise<void> {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
    console.log('✅ BullMQ Redis connection closed');
  }
}

export { redisConnection };
