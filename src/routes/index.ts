import { Router } from "express";
import { Container } from "../container";
import { createAuthRoutes } from "./auth.routes";
import { createUsersRoutes } from "./users.routes";
import { createPostsRoutes } from "./posts.routes";
import { createCommentsRoutes } from "./comments.routes";
import { createStatsRoutes } from "./stats.routes";

export function createApiRouter(container: Container): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  router.use(
    "/auth",
    createAuthRoutes(
      container.authController,
      container.authMiddleware,
      container.validateMiddleware
    )
  );
  router.use(
    "/users",
    createUsersRoutes(
      container.usersController,
      container.postsController,
      container.authMiddleware,
      container.validateMiddleware
    )
  );
  router.use(
    "/posts",
    createPostsRoutes(
      container.postsController,
      container.commentsController,
      container.authMiddleware,
      container.validateMiddleware
    )
  );
  router.use(
    "/comments",
    createCommentsRoutes(container.commentsController, container.authMiddleware)
  );
  router.use("/stats", createStatsRoutes(container.statsController));

  return router;
}
