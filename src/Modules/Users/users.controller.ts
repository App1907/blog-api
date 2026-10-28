import { Request, Response } from "express";
import { usersService } from "./users.service";
import { sendSuccess } from "../../utils/response";
import { Messages } from "../../constants/messages";
import { AppError } from "../../utils/AppError";
import { UpdateProfileInput } from "./users.validation";

export class UsersController {
  async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(Messages.UNAUTHORIZED, 401);
    }
    const { profile, cache } = await usersService.getMe(req.user);
    res.setHeader("X-Cache", cache);
    sendSuccess(res, profile);
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
