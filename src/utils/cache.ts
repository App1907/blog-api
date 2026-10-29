import { RedisProvider } from "../providers/redis";

export type CacheStatus = "HIT" | "MISS";

export class CacheService {
  constructor(private readonly redisProvider: RedisProvider) {}

  private async safeRedis<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    if (!this.redisProvider.isReady()) return fallback;
    try {
      return await fn();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Redis command failed:", message);
      return fallback;
    }
  }

  async getJSON<T>(key: string): Promise<T | null> {
    return this.safeRedis(async () => {
      const raw = await this.redisProvider.getClient().get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    }, null);
  }

  async setJSON(
    key: string,
    value: unknown,
    ttlSeconds: number
  ): Promise<boolean> {
    if (ttlSeconds <= 0) return false;
    return this.safeRedis(async () => {
      await this.redisProvider
        .getClient()
        .set(key, JSON.stringify(value), "EX", ttlSeconds);
      return true;
    }, false);
  }

  async getString(key: string): Promise<string | null> {
    return this.safeRedis(
      () => this.redisProvider.getClient().get(key),
      null
    );
  }

  async setString(
    key: string,
    value: string,
    ttlSeconds: number
  ): Promise<boolean> {
    if (ttlSeconds <= 0) return false;
    return this.safeRedis(async () => {
      await this.redisProvider
        .getClient()
        .set(key, value, "EX", ttlSeconds);
      return true;
    }, false);
  }

  async delKeys(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.safeRedis(async () => {
      await this.redisProvider.getClient().del(...keys);
      return true;
    }, false);
  }

  async incr(key: string): Promise<number | null> {
    return this.safeRedis(
      () => this.redisProvider.getClient().incr(key),
      null
    );
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.safeRedis(async () => {
      await this.redisProvider.getClient().expire(key, ttlSeconds);
      return true;
    }, false);
  }

  async ttl(key: string): Promise<number> {
    return this.safeRedis(
      () => this.redisProvider.getClient().ttl(key),
      -2
    );
  }

  async sadd(key: string, member: string): Promise<void> {
    await this.safeRedis(async () => {
      await this.redisProvider.getClient().sadd(key, member);
      return true;
    }, false);
  }

  async srem(key: string, member: string): Promise<void> {
    await this.safeRedis(async () => {
      await this.redisProvider.getClient().srem(key, member);
      return true;
    }, false);
  }

  async smembers(key: string): Promise<string[]> {
    return this.safeRedis(
      () => this.redisProvider.getClient().smembers(key),
      []
    );
  }

  async getOrIncrVersion(key: string): Promise<number> {
    return this.safeRedis(async () => {
      const current = await this.redisProvider.getClient().get(key);
      if (current !== null) return Number(current) || 0;
      await this.redisProvider.getClient().set(key, "0");
      return 0;
    }, 0);
  }
}
