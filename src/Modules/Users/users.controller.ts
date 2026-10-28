import { Request, Response } from "express";
import { usersService } from "./users.service";
import { sendSuccess } from "../../utils/response";
import { Messages } from "../../constants/messages";
import { AppError } from "../../utils/AppError";
import { UpdateProfileInput } from "./users.validation";

export class UsersController {
  getMe(req: Request, res: Response): void {
    if (!req.user) {
      throw new AppError(Messages.UNAUTHORIZED, 401);
    }
    sendSuccess(res, usersService.getMe(req.user));
  }

  async updateMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(Messages.UNAUTHORIZED, 401);
    }
    const updated = await usersService.updateMe(
      String(req.user._id),
      req.body as UpdateProfileInput
    );
    sendSuccess(res, updated, Messages.PROFILE_UPDATED);
  }
}

export const usersController = new UsersController();
