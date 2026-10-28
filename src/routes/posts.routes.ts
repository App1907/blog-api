import { Router } from "express";
import { postsController } from "../Modules/Posts/posts.controller";
import { commentsController } from "../Modules/Comments/comments.controller";
import {
  createPostSchema,
  updatePostSchema,
  listPostsQuerySchema,
} from "../Modules/Posts/posts.validation";
import {
  createCommentSchema,
  listCommentsQuerySchema,
} from "../Modules/Comments/comments.validation";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/",
  validate(listPostsQuerySchema, "query"),
  asyncHandler((req, res) => postsController.list(req, res))
);

router.post(
  "/",
  requireAuth,
  validate(createPostSchema),
  asyncHandler((req, res) => postsController.create(req, res))
);

router.get(
  "/:id",
  asyncHandler((req, res) => postsController.getOne(req, res))
);

router.patch(
  "/:id",
  requireAuth,
  validate(updatePostSchema),
  asyncHandler((req, res) => postsController.update(req, res))
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler((req, res) => postsController.remove(req, res))
);

router.post(
  "/:id/comments",
  requireAuth,
  validate(createCommentSchema),
  asyncHandler((req, res) => commentsController.create(req, res))
);

router.get(
  "/:id/comments",
  validate(listCommentsQuerySchema, "query"),
  asyncHandler((req, res) => commentsController.list(req, res))
);

export default router;
