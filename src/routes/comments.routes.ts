import { Router } from "express";
import { commentsController } from "../Modules/Comments/comments.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.delete(
  "/:id",
  requireAuth,
  asyncHandler((req, res) => commentsController.remove(req, res))
);

export default router;
