import Redis from "ioredis";
import { config } from "../../constants/config";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    throw new Error("Redis has not been connected yet");
  }
  return redis;
}

export function isRedisReady(): boolean {
  return redis !== null && redis.status === "ready";
}

export async function connectRedis(): Promise<Redis> {
  if (redis && redis.status === "ready") {
    return redis;
  }

  redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  redis.on("error", (err) => {
    console.error("Redis error:", err.message);
  });

  await redis.connect();
  console.log("Redis connected");
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
