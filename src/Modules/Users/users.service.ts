import { userRepository } from "../../Repository/User.repository";
import { postRepository } from "../../Repository/Post.repository";
import { AppError } from "../../utils/AppError";
import { Messages } from "../../constants/messages";
import { AuthUser } from "../../types/express";
import { UpdateProfileInput } from "./users.validation";

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
  getMe(user: AuthUser): UserProfile {
    return sanitizeUser(user);
  }

  async updateMe(userId: string, input: UpdateProfileInput) {
    const updated = await userRepository.updateName(userId, input.name);
    if (!updated) {
      throw new AppError(Messages.NOT_FOUND, 404);
    }

    await postRepository.updateAuthorName(userId, input.name);
    return sanitizeUser(updated);
  }
}

export const usersService = new UsersService();
