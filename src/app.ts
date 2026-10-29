import express, { Express } from "express";
import cookieParser from "cookie-parser";
import { Container } from "./container";
import { createApiRouter } from "./routes";

export class App {
  readonly express: Express;

  constructor(private readonly container: Container) {
    this.express = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandlers();
  }

  private setupMiddleware(): void {
    this.express.use(express.json({ limit: "1mb" }));
    this.express.use(express.urlencoded({ extended: true }));
    this.express.use(cookieParser());
    this.express.disable("x-powered-by");
  }

  private setupRoutes(): void {
    this.express.use("/api", createApiRouter(this.container));
  }

  private setupErrorHandlers(): void {
    this.express.use(this.container.errorMiddleware.notFoundHandler);
    this.express.use(this.container.errorMiddleware.errorHandler);
  }
}

export function createApp(container: Container): Express {
  return new App(container).express;
}
