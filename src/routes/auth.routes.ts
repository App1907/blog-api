import { Router } from "express";
import { authController } from "../Modules/Auth/auth.controller";
import { signupSchema, loginSchema } from "../Modules/Auth/auth.validation";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/signup",
  validate(signupSchema),
  asyncHandler((req, res) => authController.signup(req, res))
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler((req, res) => authController.login(req, res))
);

router.post(
  "/logout",
  requireAuth,
  asyncHandler((req, res) => authController.logout(req, res))
);

router.post(
  "/logout-all",
  requireAuth,
  asyncHandler((req, res) => authController.logoutAll(req, res))
);

export default router;
