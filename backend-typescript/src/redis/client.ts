/**
 * Redis Client Singleton
 * Provides Redis connections for pub/sub and caching
 */

import { createClient, type RedisClientType } from "redis";

let redisClient: RedisClientType | null = null;
let subscriberClient: RedisClientType | null = null;
let isConnected = false;

/**
 * Get or create the main Redis client
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && isConnected) {
    return redisClient;
  }

  const url = process.env.REDIS_URL || "redis://localhost:6379";

  redisClient = createClient({ url });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
    isConnected = false;
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis client connected");
    isConnected = true;
  });

  redisClient.on("disconnect", () => {
    console.log("⚠️ Redis client disconnected");
    isConnected = false;
  });

  await redisClient.connect();
  return redisClient;
}

/**
 * Get or create a dedicated subscriber client
 * Redis requires separate connections for pub/sub
 */
export async function getSubscriberClient(): Promise<RedisClientType> {
  if (subscriberClient) {
    return subscriberClient;
  }

  const url = process.env.REDIS_URL || "redis://localhost:6379";

  subscriberClient = createClient({ url });

  subscriberClient.on("error", (err) => {
    console.error("Redis Subscriber Error:", err);
  });

  subscriberClient.on("connect", () => {
    console.log("✅ Redis subscriber connected");
  });

  await subscriberClient.connect();
  return subscriberClient;
}

/**
 * Close all Redis connections
 */
export async function closeRedisConnections(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  if (subscriberClient) {
    await subscriberClient.quit();
    subscriberClient = null;
  }
  isConnected = false;
  console.log("🛑 Redis connections closed");
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return isConnected;
}
