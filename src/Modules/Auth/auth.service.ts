import { Response } from "express";
import { config } from "../../constants/config";
import { Messages } from "../../constants/messages";
import { AppError } from "../../utils/AppError";
import {
  hashPassword,
  comparePassword,
  generateSessionToken,
  getSessionExpiryDate,
} from "../../utils/crypto";
import { userRepository } from "../../Repository/User.repository";
import { sessionRepository } from "../../Repository/Session.repository";
import { loginAttemptRepository } from "../../Repository/LoginAttempt.repository";
import { SignupInput, LoginInput } from "./auth.validation";

function setSessionCookie(res: Response, token: string): void {
  res.cookie(config.cookie.name, token, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.cookie.maxAgeMs,
  });
}

function clearSessionCookie(res: Response): void {
  res.clearCookie(config.cookie.name, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
  });
}

function sanitizeUser(user: {
  _id: unknown;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class AuthService {
  async signup(input: SignupInput) {
    const exists = await userRepository.emailExists(input.email);
    if (exists) {
      throw new AppError(Messages.EMAIL_EXISTS, 409);
    }

    const hashed = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password: hashed,
    });

    return sanitizeUser(user);
  }

  async login(input: LoginInput, userAgent: string, res: Response) {
    if (await loginAttemptRepository.isLocked(input.email)) {
      throw new AppError(Messages.TOO_MANY_LOGIN_ATTEMPTS, 429);
    }

    const user = await userRepository.findByEmail(input.email);

    const DUMMY_HASH =
      "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";
    const passwordValid = user
      ? await comparePassword(input.password, user.password)
      : await comparePassword(input.password, DUMMY_HASH);

    if (!user || !passwordValid) {
      const { locked } = await loginAttemptRepository.recordFailure(input.email);
      if (locked) {
        throw new AppError(Messages.TOO_MANY_LOGIN_ATTEMPTS, 429);
      }
      throw new AppError(Messages.INVALID_CREDENTIALS, 401);
    }

    await loginAttemptRepository.reset(input.email);

    const token = generateSessionToken();
    const expiresAt = getSessionExpiryDate();

    await sessionRepository.create({
      userId: user._id,
      token,
      expiresAt,
      userAgent: userAgent.slice(0, 512) || "unknown",
    });

    setSessionCookie(res, token);

    return {
      user: sanitizeUser(user),
      token,
      expiresAt,
    };
  }

  async logout(token: string | undefined, res: Response): Promise<void> {
    if (token) {
      await sessionRepository.deleteByToken(token);
    }
    clearSessionCookie(res);
  }

  async logoutAll(userId: string, res: Response): Promise<number> {
    const deleted = await sessionRepository.deleteAllByUserId(userId);
    clearSessionCookie(res);
    return deleted;
  }
}

export const authService = new AuthService();
