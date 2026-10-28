import { Request, Response } from "express";
import { authService } from "./auth.service";
import { SignupInput, LoginInput } from "./auth.validation";
import { sendSuccess, sendMessage } from "../../utils/response";
import { Messages } from "../../constants/messages";
import { AppError } from "../../utils/AppError";

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

export class AuthController {
  async signup(req: Request, res: Response): Promise<void> {
    const user = await authService.signup(req.body as SignupInput);
    sendSuccess(res, user, Messages.SIGNUP_SUCCESS, 201);
  }

  async login(req: Request, res: Response): Promise<void> {
    const userAgent = req.get("user-agent") || "unknown";
    const result = await authService.login(
      req.body as LoginInput,
      userAgent,
      res,
      clientIp(req)
    );
    sendSuccess(res, result, Messages.LOGIN_SUCCESS);
  }

  async logout(req: Request, res: Response): Promise<void> {
    await authService.logout(req.sessionToken, res);
    sendMessage(res, Messages.LOGOUT_SUCCESS);
  }

  async logoutAll(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(Messages.UNAUTHORIZED, 401);
    }
    await authService.logoutAll(String(req.user._id), res);
    sendMessage(res, Messages.LOGOUT_ALL_SUCCESS);
  }
}

export const authController = new AuthController();
