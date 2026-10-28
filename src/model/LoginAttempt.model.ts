import { Schema, model, Document } from "mongoose";
import { config } from "../constants/config";

export interface ILoginAttempt extends Document {
  email: string;
  attempts: number;
  windowStart: Date;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const loginAttemptSchema = new Schema<ILoginAttempt>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    windowStart: {
      type: Date,
      default: Date.now,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

loginAttemptSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: Math.ceil(config.loginLimit.windowMs / 1000) * 2 }
);

export const LoginAttempt = model<ILoginAttempt>(
  "LoginAttempt",
  loginAttemptSchema
);
