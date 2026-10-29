import { UserRepository } from "../../Repository/User.repository";
import { PostRepository } from "../../Repository/Post.repository";
import { CommentRepository } from "../../Repository/Comment.repository";
import { AppError } from "../../utils/AppError";
import { Messages } from "../../constants/messages";
import { AuthUser } from "../../types/express";
import { UpdateProfileInput } from "./users.validation";
import { RedisKeys, RedisTTL } from "../../constants/redisKeys";
import { CacheService, CacheStatus } from "../../utils/cache";
import { CacheInvalidationService } from "../../utils/cacheInvalidation";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly postRepository: PostRepository,
    private readonly commentRepository: CommentRepository,
    private readonly cacheService: CacheService,
    private readonly cacheInvalidationService: CacheInvalidationService
  ) {}

  private sanitizeUser(
    user:
      | AuthUser
      | {
          _id: unknown;
          name: string;
          email: string;
          createdAt: Date;
          updatedAt: Date;
        }
  ): UserProfile {
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getMe(
    user: AuthUser
  ): Promise<{ profile: UserProfile; cache: CacheStatus }> {
    const key = RedisKeys.user(String(user._id));
    const cached = await this.cacheService.getJSON<UserProfile>(key);

    if (cached) {
      return { profile: cached, cache: "HIT" };
    }

    const profile = this.sanitizeUser(user);
    await this.cacheService.setJSON(key, profile, RedisTTL.PROFILE);
    return { profile, cache: "MISS" };
  }

  async updateMe(userId: string, input: UpdateProfileInput) {
    const updated = await this.userRepository.updateName(userId, input.name);
    if (!updated) {
      throw new AppError(Messages.NOT_FOUND, 404);
    }

    await this.postRepository.updateAuthorName(userId, input.name);
    await this.commentRepository.updateUserName(userId, input.name);

    const authoredPostIds = (
      await this.postRepository.findIdsByAuthor(userId)
    ).map((id) => String(id));
    const commentedPostIds = (
      await this.commentRepository.findPostIdsByUser(userId)
    ).map((id) => String(id));

    await this.cacheInvalidationService.invalidateProfile(userId);
    await this.cacheInvalidationService.invalidatePostsByIds(authoredPostIds);
    await this.cacheInvalidationService.bumpCommentsVersions(commentedPostIds);

    return this.sanitizeUser(updated);
  }
}
