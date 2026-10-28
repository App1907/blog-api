import { getRedis, isRedisReady } from "../providers/redis";

async function safeRedis<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isRedisReady()) return fallback;
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Redis command failed:", message);
    return fallback;
  }
}

export async function getJSON<T>(key: string): Promise<T | null> {
  return safeRedis(async () => {
    const raw = await getRedis().get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }, null);
}

export async function setJSON(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<boolean> {
  if (ttlSeconds <= 0) return false;
  return safeRedis(async () => {
    await getRedis().set(key, JSON.stringify(value), "EX", ttlSeconds);
    return true;
  }, false);
}

export async function delKeys(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await safeRedis(async () => {
    await getRedis().del(...keys);
    return true;
  }, false);
}

export type CacheStatus = "HIT" | "MISS";
