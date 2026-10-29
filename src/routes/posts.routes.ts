import { Router } from "express";
import { PostsController } from "../Modules/Posts/posts.controller";
import { CommentsController } from "../Modules/Comments/comments.controller";
import {
  createPostSchema,
  updatePostSchema,
  listPostsQuerySchema,
} from "../Modules/Posts/posts.validation";
import {
  createCommentSchema,
  listCommentsQuerySchema,
} from "../Modules/Comments/comments.validation";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { ValidateMiddleware } from "../middlewares/validate";
import { AsyncHandler } from "../utils/asyncHandler";

export function createPostsRoutes(
  postsController: PostsController,
  commentsController: CommentsController,
  authMiddleware: AuthMiddleware,
  validateMiddleware: ValidateMiddleware
): Router {
  const router = Router();

  router.get(
    "/",
    validateMiddleware.validate(listPostsQuerySchema, "query"),
    AsyncHandler.wrap(postsController.list)
  );

  router.post(
    "/",
    authMiddleware.requireAuth,
    validateMiddleware.validate(createPostSchema),
    AsyncHandler.wrap(postsController.create)
  );

  router.get("/:id", AsyncHandler.wrap(postsController.getOne));

  router.patch(
    "/:id",
    authMiddleware.requireAuth,
    validateMiddleware.validate(updatePostSchema),
    AsyncHandler.wrap(postsController.update)
  );

  router.delete(
    "/:id",
    authMiddleware.requireAuth,
    AsyncHandler.wrap(postsController.remove)
  );

  router.post(
    "/:id/comments",
    authMiddleware.requireAuth,
    validateMiddleware.validate(createCommentSchema),
    AsyncHandler.wrap(commentsController.create)
  );

  router.get(
    "/:id/comments",
    validateMiddleware.validate(listCommentsQuerySchema, "query"),
    AsyncHandler.wrap(commentsController.list)
  );

  return router;
}
