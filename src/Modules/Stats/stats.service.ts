import { PostRepository } from "../../Repository/Post.repository";
import { RedisKeys, RedisTTL } from "../../constants/redisKeys";
import { CacheService, CacheStatus } from "../../utils/cache";

export class StatsService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly cacheService: CacheService
  ) {}

  async getStats(): Promise<{ data: unknown; cache: CacheStatus }> {
    const key = RedisKeys.stats();
    const cached = await this.cacheService.getJSON(key);

    if (cached) {
      return { data: cached, cache: "HIT" };
    }

    const stats = await this.postRepository.getStats();
    await this.cacheService.setJSON(key, stats, RedisTTL.STATS);
    return { data: stats, cache: "MISS" };
  }
}
