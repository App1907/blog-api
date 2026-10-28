import { postRepository } from "../../Repository/Post.repository";

export class StatsService {
  async getStats() {
    return postRepository.getStats();
  }
}

export const statsService = new StatsService();
