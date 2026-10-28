import { RedisKeys, RedisTTL } from "../constants/redisKeys";
import { delKeys, expire, incr } from "./cache";

export async function bumpPostsListVersion(): Promise<void> {
  await incr(RedisKeys.postsListVersion());
}

export async function invalidatePostCaches(postId: string): Promise<void> {
  await delKeys(RedisKeys.post(postId), RedisKeys.stats());
  await bumpPostsListVersion();
  const commentsVersionKey = RedisKeys.commentsVersion(postId);
  await incr(commentsVersionKey);
  await expire(commentsVersionKey, RedisTTL.COMMENTS * 60);
}

export async function invalidateProfile(userId: string): Promise<void> {
  await delKeys(RedisKeys.user(userId));
}
