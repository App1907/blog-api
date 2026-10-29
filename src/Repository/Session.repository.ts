import { Types } from "mongoose";
import { Session, ISession } from "../model/Session.model";

export class SessionRepository {
  async create(data: {
    userId: Types.ObjectId;
    token: string;
    expiresAt: Date;
    userAgent: string;
  }): Promise<ISession> {
    return Session.create(data);
  }

  async findByToken(token: string): Promise<ISession | null> {
    return Session.findOne({ token, expiresAt: { $gt: new Date() } });
  }

  async deleteByToken(token: string): Promise<boolean> {
    const result = await Session.deleteOne({ token });
    return result.deletedCount > 0;
  }

  async deleteAllByUserId(userId: Types.ObjectId | string): Promise<number> {
    const result = await Session.deleteMany({ userId });
    return result.deletedCount;
  }
}
