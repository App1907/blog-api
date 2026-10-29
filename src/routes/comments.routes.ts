import { Router } from "express";
import { CommentsController } from "../Modules/Comments/comments.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AsyncHandler } from "../utils/asyncHandler";

export function createCommentsRoutes(
  commentsController: CommentsController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  router.delete(
    "/:id",
    authMiddleware.requireAuth,
    AsyncHandler.wrap(commentsController.remove)
  );

  return router;
}
