import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { SignupInput, LoginInput } from "./auth.validation";
import { ResponseHelper } from "../../utils/response";
import { Messages } from "../../constants/messages";
import { AppError } from "../../utils/AppError";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private clientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0].trim();
    }
    return req.ip || req.socket.remoteAddress || "unknown";
  }

  signup = async (req: Request, res: Response): Promise<void> => {
    const user = await this.authService.signup(req.body as SignupInput);
    ResponseHelper.sendSuccess(res, user, Messages.SIGNUP_SUCCESS, 201);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const userAgent = req.get("user-agent") || "unknown";
    const result = await this.authService.login(
      req.body as LoginInput,
      userAgent,
      res,
      this.clientIp(req)
    );
    ResponseHelper.sendSuccess(res, result, Messages.LOGIN_SUCCESS);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    await this.authService.logout(req.sessionToken, res);
    ResponseHelper.sendMessage(res, Messages.LOGOUT_SUCCESS);
  };

  logoutAll = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(Messages.UNAUTHORIZED, 401);
    }
    await this.authService.logoutAll(String(req.user._id), res);
    ResponseHelper.sendMessage(res, Messages.LOGOUT_ALL_SUCCESS);
  };
}
