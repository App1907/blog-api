import { userRepository } from "../../Repository/User.repository";
import { postRepository } from "../../Repository/Post.repository";
import { AppError } from "../../utils/AppError";
import { Messages } from "../../constants/messages";
import { AuthUser } from "../../types/express";
import { UpdateProfileInput } from "./users.validation";
import { RedisKeys, RedisTTL } from "../../constants/redisKeys";
import { CacheStatus, delKeys, getJSON, setJSON } from "../../utils/cache";
import {
  bumpPostsListVersion,
  invalidateProfile,
} from "../../utils/cacheInvalidation";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

function sanitizeUser(user: AuthUser | {
  _id: unknown;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}): UserProfile {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class UsersService {
  async getMe(
    user: AuthUser
  ): Promise<{ profile: UserProfile; cache: CacheStatus }> {
    const key = RedisKeys.user(String(user._id));
    const cached = await getJSON<UserProfile>(key);

    if (cached) {
      return { profile: cached, cache: "HIT" };
    }

    const profile = sanitizeUser(user);
    await setJSON(key, profile, RedisTTL.PROFILE);
    return { profile, cache: "MISS" };
  }

  async updateMe(userId: string, input: UpdateProfileInput) {
    const updated = await userRepository.updateName(userId, input.name);
    if (!updated) {
      throw new AppError(Messages.NOT_FOUND, 404);
    }

    await postRepository.updateAuthorName(userId, input.name);
    await invalidateProfile(userId);
    await delKeys(RedisKeys.stats());
    await bumpPostsListVersion();

    return sanitizeUser(updated);
  }
}

export const usersService = new UsersService();
