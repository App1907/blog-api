import { config } from "../constants/config";
import { RedisKeys } from "../constants/redisKeys";
import { CacheService } from "./cache";

export class SessionCacheService {
  private readonly sessionSetTtl = config.session.ttlDays * 24 * 60 * 60;

  constructor(private readonly cacheService: CacheService) {}

  async cacheSession(
    token: string,
    userId: string,
    ttlSeconds: number
  ): Promise<void> {
    if (ttlSeconds <= 0) return;
    await this.cacheService.setString(
      RedisKeys.session(token),
      userId,
      ttlSeconds
    );
    const setKey = RedisKeys.userSessions(userId);
    await this.cacheService.sadd(setKey, token);
    await this.cacheService.expire(setKey, this.sessionSetTtl);
  }

  async getCachedSessionUserId(token: string): Promise<string | null> {
    return this.cacheService.getString(RedisKeys.session(token));
  }

  async removeCachedSession(token: string, userId?: string): Promise<void> {
    const uid =
      userId ?? (await this.cacheService.getString(RedisKeys.session(token)));
    await this.cacheService.delKeys(RedisKeys.session(token));
    if (uid) {
      await this.cacheService.srem(RedisKeys.userSessions(uid), token);
    }
  }

  async removeAllCachedSessions(userId: string): Promise<void> {
    const tokens = await this.cacheService.smembers(
      RedisKeys.userSessions(userId)
    );
    if (tokens.length > 0) {
      await this.cacheService.delKeys(
        ...tokens.map((t) => RedisKeys.session(t))
      );
    }
    await this.cacheService.delKeys(RedisKeys.userSessions(userId));
  }

  remainingTtlSeconds(expiresAt: Date): number {
    return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  }
}
