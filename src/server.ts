import app from "./app";
import { config } from "./constants/config";
import { connectDatabase, disconnectDatabase } from "./providers/database";

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();

    const server = app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
      console.log(`Health check: http://localhost:${config.port}/api/health`);
      console.log(`Environment: ${config.nodeEnv}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down...`);
      server.close(async () => {
        try {
          await disconnectDatabase();
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
