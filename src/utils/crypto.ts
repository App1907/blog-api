import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { config } from "../constants/config";

export class CryptoService {
  generateSessionToken(): string {
    return randomBytes(32).toString("hex");
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.bcryptRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  getSessionExpiryDate(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.session.ttlDays);
    return expiresAt;
  }
}
