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

export async function getString(key: string): Promise<string | null> {
  return safeRedis(() => getRedis().get(key), null);
}

export async function setString(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<boolean> {
  if (ttlSeconds <= 0) return false;
  return safeRedis(async () => {
    await getRedis().set(key, value, "EX", ttlSeconds);
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

export async function incr(key: string): Promise<number | null> {
  return safeRedis(() => getRedis().incr(key), null);
}

export async function expire(key: string, ttlSeconds: number): Promise<void> {
  await safeRedis(async () => {
    await getRedis().expire(key, ttlSeconds);
    return true;
  }, false);
}

export async function ttl(key: string): Promise<number> {
  return safeRedis(() => getRedis().ttl(key), -2);
}

export async function sadd(key: string, member: string): Promise<void> {
  await safeRedis(async () => {
    await getRedis().sadd(key, member);
    return true;
  }, false);
}

export async function srem(key: string, member: string): Promise<void> {
  await safeRedis(async () => {
    await getRedis().srem(key, member);
    return true;
  }, false);
}

export async function smembers(key: string): Promise<string[]> {
  return safeRedis(() => getRedis().smembers(key), []);
}

export async function getOrIncrVersion(key: string): Promise<number> {
  const value = await safeRedis(async () => {
    const current = await getRedis().get(key);
    if (current !== null) return Number(current) || 0;
    await getRedis().set(key, "0");
    return 0;
  }, 0);
  return value;
}

export type CacheStatus = "HIT" | "MISS";
