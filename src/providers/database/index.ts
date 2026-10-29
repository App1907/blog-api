import mongoose from "mongoose";
import { config } from "../../constants/config";

export class DatabaseProvider {
  async connect(): Promise<void> {
    mongoose.set("strictQuery", true);

    await mongoose.connect(config.mongodbUri);

    console.log(`MongoDB connected: ${mongoose.connection.name}`);

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }
}
