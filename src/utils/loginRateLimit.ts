import { config } from "../constants/config";
import { Messages } from "../constants/messages";
import { RedisKeys, RedisTTL } from "../constants/redisKeys";
import { AppError } from "./AppError";
import { delKeys, expire, getString, incr, ttl } from "./cache";

function minutesLeft(ttlSeconds: number): number {
  return Math.max(1, Math.ceil(ttlSeconds / 60));
}

async function assertNotLocked(key: string): Promise<void> {
  const countRaw = await getString(key);
  if (!countRaw) return;

  const count = Number(countRaw);
  if (count < config.loginLimit.maxAttempts) return;

  const remaining = await ttl(key);
  const minutes =
    remaining > 0 ? minutesLeft(remaining) : Math.ceil(RedisTTL.LOGIN_FAIL / 60);

  throw new AppError(
    Messages.tooManyLoginAttempts(minutes),
    429
  );
}

export async function assertLoginAllowed(email: string, ip?: string): Promise<void> {
  await assertNotLocked(RedisKeys.loginFail(email));
  if (ip) {
    await assertNotLocked(RedisKeys.loginFailIp(ip));
  }
}

async function recordFailureOnKey(key: string): Promise<{ locked: boolean; minutes: number }> {
  const count = await incr(key);
  if (count === null) {
    return { locked: false, minutes: 0 };
  }

  if (count === 1) {
    await expire(key, RedisTTL.LOGIN_FAIL);
  }

  if (count >= config.loginLimit.maxAttempts) {
    const remaining = await ttl(key);
    const minutes =
      remaining > 0 ? minutesLeft(remaining) : Math.ceil(RedisTTL.LOGIN_FAIL / 60);
    return { locked: true, minutes };
  }

  return { locked: false, minutes: 0 };
}

export async function recordLoginFailure(
  email: string,
  ip?: string
): Promise<{ locked: boolean; minutes: number }> {
  const emailResult = await recordFailureOnKey(RedisKeys.loginFail(email));
  let ipResult = { locked: false, minutes: 0 };
  if (ip) {
    ipResult = await recordFailureOnKey(RedisKeys.loginFailIp(ip));
  }

  if (emailResult.locked) return emailResult;
  if (ipResult.locked) return ipResult;
  return { locked: false, minutes: 0 };
}

export async function clearLoginFailures(email: string, ip?: string): Promise<void> {
  const keys = [RedisKeys.loginFail(email)];
  if (ip) keys.push(RedisKeys.loginFailIp(ip));
  await delKeys(...keys);
}
