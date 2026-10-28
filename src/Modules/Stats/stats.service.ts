import { postRepository } from "../../Repository/Post.repository";
import { RedisKeys, RedisTTL } from "../../constants/redisKeys";
import { CacheStatus, getJSON, setJSON } from "../../utils/cache";

export class StatsService {
  async getStats(): Promise<{ data: unknown; cache: CacheStatus }> {
    const key = RedisKeys.stats();
    const cached = await getJSON(key);

    if (cached) {
      return { data: cached, cache: "HIT" };
    }

    const stats = await postRepository.getStats();
    await setJSON(key, stats, RedisTTL.STATS);
    return { data: stats, cache: "MISS" };
  }
}

export const statsService = new StatsService();
