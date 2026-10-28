import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  mongodbUri: requireEnv("MONGODB_URI"),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  cookie: {
    name: process.env.COOKIE_NAME || "session_token",
    maxAgeMs: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.COOKIE_SECURE === "true",
    httpOnly: true,
    sameSite: "lax" as const,
  },
  session: {
    ttlDays: 7,
  },
  loginLimit: {
    maxAttempts: 5,
    windowSeconds: 900,
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 50,
  },
  bcryptRounds: 12,
  redis: {
    url: requireEnv("REDIS_URL", "redis://localhost:6379"),
    keyPrefix: process.env.REDIS_KEY_PREFIX || "blog_ayush:",
  },
} as const;
