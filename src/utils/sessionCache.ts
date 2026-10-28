import { config } from "../constants/config";
import { RedisKeys } from "../constants/redisKeys";
import {
  delKeys,
  expire,
  getString,
  sadd,
  setString,
  smembers,
  srem,
} from "./cache";

const SESSION_SET_TTL = config.session.ttlDays * 24 * 60 * 60;

export async function cacheSession(
  token: string,
  userId: string,
  ttlSeconds: number
): Promise<void> {
  if (ttlSeconds <= 0) return;
  await setString(RedisKeys.session(token), userId, ttlSeconds);
  const setKey = RedisKeys.userSessions(userId);
  await sadd(setKey, token);
  await expire(setKey, SESSION_SET_TTL);
}

export async function getCachedSessionUserId(
  token: string
): Promise<string | null> {
  return getString(RedisKeys.session(token));
}

export async function removeCachedSession(
  token: string,
  userId?: string
): Promise<void> {
  const uid = userId ?? (await getString(RedisKeys.session(token)));
  await delKeys(RedisKeys.session(token));
  if (uid) {
    await srem(RedisKeys.userSessions(uid), token);
  }
}

export async function removeAllCachedSessions(userId: string): Promise<void> {
  const tokens = await smembers(RedisKeys.userSessions(userId));
  if (tokens.length > 0) {
    await delKeys(...tokens.map((t) => RedisKeys.session(t)));
  }
  await delKeys(RedisKeys.userSessions(userId));
}

export function remainingTtlSeconds(expiresAt: Date): number {
  return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
}
