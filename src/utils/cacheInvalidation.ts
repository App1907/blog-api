import { RedisKeys, RedisTTL } from "../constants/redisKeys";
import { CacheService } from "./cache";

export class CacheInvalidationService {
  constructor(private readonly cacheService: CacheService) {}

  async bumpPostsListVersion(): Promise<void> {
    await this.cacheService.incr(RedisKeys.postsListVersion());
  }

  async invalidatePostCaches(postId: string): Promise<void> {
    await this.cacheService.delKeys(RedisKeys.post(postId), RedisKeys.stats());
    await this.bumpPostsListVersion();
    const commentsVersionKey = RedisKeys.commentsVersion(postId);
    await this.cacheService.incr(commentsVersionKey);
    await this.cacheService.expire(
      commentsVersionKey,
      RedisTTL.COMMENTS * 60
    );
  }

  async invalidateProfile(userId: string): Promise<void> {
    await this.cacheService.delKeys(RedisKeys.user(userId));
  }

  async invalidatePostsByIds(postIds: string[]): Promise<void> {
    if (postIds.length === 0) return;
    await this.cacheService.delKeys(
      ...postIds.map((id) => RedisKeys.post(id)),
      RedisKeys.stats()
    );
    await this.bumpPostsListVersion();
  }

  async bumpCommentsVersions(postIds: string[]): Promise<void> {
    for (const postId of postIds) {
      const key = RedisKeys.commentsVersion(postId);
      await this.cacheService.incr(key);
      await this.cacheService.expire(key, RedisTTL.COMMENTS * 60);
    }
  }
}
