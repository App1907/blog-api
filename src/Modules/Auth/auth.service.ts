import { Response } from "express";
import { config } from "../../constants/config";
import { Messages } from "../../constants/messages";
import { AppError } from "../../utils/AppError";
import { CryptoService } from "../../utils/crypto";
import { UserRepository } from "../../Repository/User.repository";
import { SessionRepository } from "../../Repository/Session.repository";
import { LoginRateLimitService } from "../../utils/loginRateLimit";
import { SessionCacheService } from "../../utils/sessionCache";
import { SignupInput, LoginInput } from "./auth.validation";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly cryptoService: CryptoService,
    private readonly loginRateLimitService: LoginRateLimitService,
    private readonly sessionCacheService: SessionCacheService
  ) {}

  private setSessionCookie(res: Response, token: string): void {
    res.cookie(config.cookie.name, token, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAgeMs,
    });
  }

  private clearSessionCookie(res: Response): void {
    res.clearCookie(config.cookie.name, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
    });
  }

  private sanitizeUser(user: {
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

  async signup(input: SignupInput) {
    const exists = await this.userRepository.emailExists(input.email);
    if (exists) {
      throw new AppError(Messages.EMAIL_EXISTS, 409);
    }

    const hashed = await this.cryptoService.hashPassword(input.password);
    const user = await this.userRepository.create({
      name: input.name,
      email: input.email,
      password: hashed,
    });

    return this.sanitizeUser(user);
  }

  async login(
    input: LoginInput,
    userAgent: string,
    res: Response,
    ip?: string
  ) {
    await this.loginRateLimitService.assertLoginAllowed(input.email, ip);

    const user = await this.userRepository.findByEmail(input.email);

    const DUMMY_HASH =
      "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";
    const passwordValid = user
      ? await this.cryptoService.comparePassword(input.password, user.password)
      : await this.cryptoService.comparePassword(input.password, DUMMY_HASH);

    if (!user || !passwordValid) {
      const { locked, minutes } =
        await this.loginRateLimitService.recordLoginFailure(input.email, ip);
      if (locked) {
        throw new AppError(Messages.tooManyLoginAttempts(minutes), 429);
      }
      throw new AppError(Messages.INVALID_CREDENTIALS, 401);
    }

    await this.loginRateLimitService.clearLoginFailures(input.email, ip);

    const token = this.cryptoService.generateSessionToken();
    const expiresAt = this.cryptoService.getSessionExpiryDate();

    await this.sessionRepository.create({
      userId: user._id,
      token,
      expiresAt,
      userAgent: userAgent.slice(0, 512) || "unknown",
    });

    await this.sessionCacheService.cacheSession(
      token,
      String(user._id),
      this.sessionCacheService.remainingTtlSeconds(expiresAt)
    );
    this.setSessionCookie(res, token);

    return {
      user: this.sanitizeUser(user),
      token,
      expiresAt,
    };
  }

  async logout(token: string | undefined, res: Response): Promise<void> {
    if (token) {
      await this.sessionRepository.deleteByToken(token);
      await this.sessionCacheService.removeCachedSession(token);
    }
    this.clearSessionCookie(res);
  }

  async logoutAll(userId: string, res: Response): Promise<number> {
    const deleted = await this.sessionRepository.deleteAllByUserId(userId);
    await this.sessionCacheService.removeAllCachedSessions(userId);
    this.clearSessionCookie(res);
    return deleted;
  }
}
