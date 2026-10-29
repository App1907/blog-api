import { Router } from "express";
import { AuthController } from "../Modules/Auth/auth.controller";
import { signupSchema, loginSchema } from "../Modules/Auth/auth.validation";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { ValidateMiddleware } from "../middlewares/validate";
import { AsyncHandler } from "../utils/asyncHandler";

export function createAuthRoutes(
  authController: AuthController,
  authMiddleware: AuthMiddleware,
  validateMiddleware: ValidateMiddleware
): Router {
  const router = Router();

  router.post(
    "/signup",
    validateMiddleware.validate(signupSchema),
    AsyncHandler.wrap(authController.signup)
  );

  router.post(
    "/login",
    validateMiddleware.validate(loginSchema),
    AsyncHandler.wrap(authController.login)
  );

  router.post(
    "/logout",
    authMiddleware.requireAuth,
    AsyncHandler.wrap(authController.logout)
  );

  router.post(
    "/logout-all",
    authMiddleware.requireAuth,
    AsyncHandler.wrap(authController.logoutAll)
  );

  return router;
}
