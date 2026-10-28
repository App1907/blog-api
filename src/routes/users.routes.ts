import { Router } from "express";
import { usersController } from "../Modules/Users/users.controller";
import { postsController } from "../Modules/Posts/posts.controller";
import { updateProfileSchema } from "../Modules/Users/users.validation";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => usersController.getMe(req, res))
);

router.patch(
  "/me",
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler((req, res) => usersController.updateMe(req, res))
);

router.get(
  "/me/posts",
  requireAuth,
  asyncHandler((req, res) => postsController.listMine(req, res))
);

export default router;
