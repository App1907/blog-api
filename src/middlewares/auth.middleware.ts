import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { config } from "../constants/config";
import { Messages } from "../constants/messages";
import { sessionRepository } from "../Repository/Session.repository";
import { userRepository } from "../Repository/User.repository";
import { sendError } from "../utils/response";
import { AuthUser } from "../types/express";

async function resolveUserFromToken(token: string): Promise<AuthUser | null> {
  const session = await sessionRepository.findByToken(token);
  if (!session) return null;

  const user = await userRepository.findById(session.userId);
  if (!user) {
    await sessionRepository.deleteByToken(token);
    return null;
  }

  return {
    _id: user._id as Types.ObjectId,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
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
