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
  redis: {
    url: requireEnv("REDIS_URL", "redis://localhost:6379"),
    keyPrefix: process.env.REDIS_KEY_PREFIX || "blog_ayush:",
  },
} as const;
