import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { config } from "../constants/config";
import { Messages } from "../constants/messages";
import { sessionRepository } from "../Repository/Session.repository";
import { userRepository } from "../Repository/User.repository";
import { sendError } from "../utils/response";
import { AuthUser } from "../types/express";
import {
  cacheSession,
  getCachedSessionUserId,
  remainingTtlSeconds,
  removeCachedSession,
} from "../utils/sessionCache";

async function loadAuthUser(userId: string): Promise<AuthUser | null> {
  const user = await userRepository.findById(userId);
  if (!user) return null;
  return {
    _id: user._id as Types.ObjectId,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function resolveUserFromToken(token: string): Promise<AuthUser | null> {
  const cachedUserId = await getCachedSessionUserId(token);

  // Redis hit: use userId directly (no session query) — Mongo is still used for the user doc
  if (cachedUserId) {
    const user = await loadAuthUser(cachedUserId);
    if (!user) {
      await removeCachedSession(token, cachedUserId);
      return null;
    }
    return user;
  }

  const session = await sessionRepository.findByToken(token);
  if (!session) return null;

  const user = await loadAuthUser(String(session.userId));
  if (!user) {
    await sessionRepository.deleteByToken(token);
    return null;
  }

  await cacheSession(
    token,
    String(session.userId),
    remainingTtlSeconds(session.expiresAt)
  );

  return user;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[config.cookie.name] as string | undefined;

    if (!token) {
      sendError(res, Messages.UNAUTHORIZED, 401);
      return;
    }

    const user = await resolveUserFromToken(token);

    if (!user) {
      res.clearCookie(config.cookie.name);
      sendError(res, Messages.INVALID_SESSION, 401);
      return;
    }

    req.user = user;
    req.sessionToken = token;
    next();
  } catch (err) {
    next(err);
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[config.cookie.name] as string | undefined;
    if (!token) {
      next();
      return;
    }

    const user = await resolveUserFromToken(token);
    if (user) {
      req.user = user;
      req.sessionToken = token;
    }

    next();
  } catch {
    next();
  }
}
