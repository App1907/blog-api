import { config } from "../constants/config";
import { Messages } from "../constants/messages";
import { RedisKeys, RedisTTL } from "../constants/redisKeys";
import { AppError } from "./AppError";
import { CacheService } from "./cache";

export class LoginRateLimitService {
  constructor(private readonly cacheService: CacheService) {}

  private minutesLeft(ttlSeconds: number): number {
    return Math.max(1, Math.ceil(ttlSeconds / 60));
  }

  private async assertNotLocked(key: string): Promise<void> {
    const countRaw = await this.cacheService.getString(key);
    if (!countRaw) return;

    const count = Number(countRaw);
    if (count < config.loginLimit.maxAttempts) return;

    const remaining = await this.cacheService.ttl(key);
    const minutes =
      remaining > 0
        ? this.minutesLeft(remaining)
        : Math.ceil(RedisTTL.LOGIN_FAIL / 60);

    throw new AppError(Messages.tooManyLoginAttempts(minutes), 429);
  }

  async assertLoginAllowed(email: string, ip?: string): Promise<void> {
    await this.assertNotLocked(RedisKeys.loginFail(email));
    if (ip) {
      await this.assertNotLocked(RedisKeys.loginFailIp(ip));
    }
  }

  private async recordFailureOnKey(
    key: string
  ): Promise<{ locked: boolean; minutes: number }> {
    const count = await this.cacheService.incr(key);
    if (count === null) {
      return { locked: false, minutes: 0 };
    }

    if (count === 1) {
      await this.cacheService.expire(key, RedisTTL.LOGIN_FAIL);
    }

    if (count >= config.loginLimit.maxAttempts) {
      const remaining = await this.cacheService.ttl(key);
      const minutes =
        remaining > 0
          ? this.minutesLeft(remaining)
          : Math.ceil(RedisTTL.LOGIN_FAIL / 60);
      return { locked: true, minutes };
    }

    return { locked: false, minutes: 0 };
  }

  async recordLoginFailure(
    email: string,
    ip?: string
  ): Promise<{ locked: boolean; minutes: number }> {
    const emailResult = await this.recordFailureOnKey(
      RedisKeys.loginFail(email)
    );
    let ipResult = { locked: false, minutes: 0 };
    if (ip) {
      ipResult = await this.recordFailureOnKey(RedisKeys.loginFailIp(ip));
    }

    if (emailResult.locked) return emailResult;
    if (ipResult.locked) return ipResult;
    return { locked: false, minutes: 0 };
  }

  async clearLoginFailures(email: string, ip?: string): Promise<void> {
    const keys = [RedisKeys.loginFail(email)];
    if (ip) keys.push(RedisKeys.loginFailIp(ip));
    await this.cacheService.delKeys(...keys);
  }
}
