import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { config } from "../constants/config";
import { Messages } from "../constants/messages";
import { SessionRepository } from "../Repository/Session.repository";
import { UserRepository } from "../Repository/User.repository";
import { ResponseHelper } from "../utils/response";
import { AuthUser } from "../types/express";
import { SessionCacheService } from "../utils/sessionCache";

export class AuthMiddleware {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly userRepository: UserRepository,
    private readonly sessionCacheService: SessionCacheService
  ) {}

  private async loadAuthUser(userId: string): Promise<AuthUser | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;
    return {
      _id: user._id as Types.ObjectId,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private clearSessionCookie(res: Response): void {
    res.clearCookie(config.cookie.name, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
    });
  }

  private async resolveUserFromToken(token: string): Promise<AuthUser | null> {
    const cachedUserId =
      await this.sessionCacheService.getCachedSessionUserId(token);

    // Redis may be stale after logout — always confirm the session still exists in Mongo
    if (cachedUserId) {
      const session = await this.sessionRepository.findByToken(token);
      if (!session) {
        await this.sessionCacheService.removeCachedSession(token, cachedUserId);
        return null;
      }

      const user = await this.loadAuthUser(cachedUserId);
      if (!user) {
        await this.sessionRepository.deleteByToken(token);
        await this.sessionCacheService.removeCachedSession(token, cachedUserId);
        return null;
      }
      return user;
    }

    const session = await this.sessionRepository.findByToken(token);
    if (!session) return null;

    const user = await this.loadAuthUser(String(session.userId));
    if (!user) {
      await this.sessionRepository.deleteByToken(token);
      return null;
    }

    await this.sessionCacheService.cacheSession(
      token,
      String(session.userId),
      this.sessionCacheService.remainingTtlSeconds(session.expiresAt)
    );

    return user;
  }

  requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = req.cookies?.[config.cookie.name] as string | undefined;

      if (!token) {
        ResponseHelper.sendError(res, Messages.UNAUTHORIZED, 401);
        return;
      }

      const user = await this.resolveUserFromToken(token);

      if (!user) {
        this.clearSessionCookie(res);
        ResponseHelper.sendError(res, Messages.INVALID_SESSION, 401);
        return;
      }

      req.user = user;
      req.sessionToken = token;
      next();
    } catch (err) {
      next(err);
    }
  };

  optionalAuth = async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = req.cookies?.[config.cookie.name] as string | undefined;
      if (!token) {
        next();
        return;
      }

      const user = await this.resolveUserFromToken(token);
      if (user) {
        req.user = user;
        req.sessionToken = token;
      }

      next();
    } catch {
      next();
    }
  };
}
