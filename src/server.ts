import { createContainer } from "./container";
import { createApp } from "./app";
import { config } from "./constants/config";

async function bootstrap(): Promise<void> {
  const container = createContainer();

  try {
    await container.databaseProvider.connect();
    await container.redisProvider.connect();

    const app = createApp(container);

    const server = app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
      console.log(`Health check: http://localhost:${config.port}/api/health`);
      console.log(`Environment: ${config.nodeEnv}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down...`);
      server.close(async () => {
        try {
          await container.redisProvider.disconnect();
          await container.databaseProvider.disconnect();
        } finally {
          process.exit(0);
        }
      });
    };

    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

void bootstrap();
