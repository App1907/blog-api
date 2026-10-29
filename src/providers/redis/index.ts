import Redis from "ioredis";
import { config } from "../../constants/config";

export class RedisProvider {
  private client: Redis | null = null;

  getClient(): Redis {
    if (!this.client) {
      throw new Error("Redis has not been connected yet");
    }
    return this.client;
  }

  isReady(): boolean {
    return this.client !== null && this.client.status === "ready";
  }

  async connect(): Promise<Redis> {
    if (this.client && this.client.status === "ready") {
      return this.client;
    }

    this.client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    this.client.on("error", (err) => {
      console.error("Redis error:", err.message);
    });

    await this.client.connect();
    console.log("Redis connected");
    return this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}
