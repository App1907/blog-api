import { Router } from "express";
import { UsersController } from "../Modules/Users/users.controller";
import { PostsController } from "../Modules/Posts/posts.controller";
import { updateProfileSchema } from "../Modules/Users/users.validation";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { ValidateMiddleware } from "../middlewares/validate";
import { AsyncHandler } from "../utils/asyncHandler";

export function createUsersRoutes(
  usersController: UsersController,
  postsController: PostsController,
  authMiddleware: AuthMiddleware,
  validateMiddleware: ValidateMiddleware
): Router {
  const router = Router();

  router.get(
    "/me",
    authMiddleware.requireAuth,
    AsyncHandler.wrap(usersController.getMe)
  );

  router.patch(
    "/me",
    authMiddleware.requireAuth,
    validateMiddleware.validate(updateProfileSchema),
    AsyncHandler.wrap(usersController.updateMe)
  );

  router.get(
    "/me/posts",
    authMiddleware.requireAuth,
    AsyncHandler.wrap(postsController.listMine)
  );

  return router;
}
