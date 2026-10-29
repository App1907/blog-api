import { Request, Response } from "express";
import { UsersService } from "./users.service";
import { ResponseHelper } from "../../utils/response";
import { Messages } from "../../constants/messages";
import { AppError } from "../../utils/AppError";
import { UpdateProfileInput } from "./users.validation";

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  getMe = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(Messages.UNAUTHORIZED, 401);
    }
    const { profile, cache } = await this.usersService.getMe(req.user);
    res.setHeader("X-Cache", cache);
    ResponseHelper.sendSuccess(res, profile);
  };

  updateMe = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(Messages.UNAUTHORIZED, 401);
    }
    const updated = await this.usersService.updateMe(
      String(req.user._id),
      req.body as UpdateProfileInput
    );
    ResponseHelper.sendSuccess(res, updated, Messages.PROFILE_UPDATED);
  };
}
