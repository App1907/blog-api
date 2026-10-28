import { LoginAttempt, ILoginAttempt } from "../model/LoginAttempt.model";
import { config } from "../constants/config";

export class LoginAttemptRepository {
  async findByEmail(email: string): Promise<ILoginAttempt | null> {
    return LoginAttempt.findOne({ email: email.toLowerCase() });
  }

  async isLocked(email: string): Promise<boolean> {
    const record = await this.findByEmail(email);
    if (!record?.lockedUntil) return false;
    if (record.lockedUntil > new Date()) return true;
    await this.reset(email);
    return false;
  }

  async recordFailure(
    email: string
  ): Promise<{ locked: boolean; remaining: number }> {
    const normalized = email.toLowerCase();
    const now = new Date();
    let record = await this.findByEmail(normalized);

    if (!record) {
      await LoginAttempt.create({
        email: normalized,
        attempts: 1,
        windowStart: now,
        lockedUntil: null,
      });
      return {
        locked: false,
        remaining: config.loginLimit.maxAttempts - 1,
      };
    }

    const windowExpired =
      now.getTime() - record.windowStart.getTime() > config.loginLimit.windowMs;

    if (windowExpired) {
      record.attempts = 1;
      record.windowStart = now;
      record.lockedUntil = null;
      await record.save();
      return {
        locked: false,
        remaining: config.loginLimit.maxAttempts - 1,
      };
    }

    record.attempts += 1;

    if (record.attempts >= config.loginLimit.maxAttempts) {
      record.lockedUntil = new Date(now.getTime() + config.loginLimit.windowMs);
      await record.save();
      return { locked: true, remaining: 0 };
    }

    await record.save();
    return {
      locked: false,
      remaining: config.loginLimit.maxAttempts - record.attempts,
    };
  }

  async reset(email: string): Promise<void> {
    await LoginAttempt.deleteOne({ email: email.toLowerCase() });
  }
}

export const loginAttemptRepository = new LoginAttemptRepository();
