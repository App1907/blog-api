import { Request, Response } from "express";
import { commentsService } from "./comments.service";
import { sendSuccess, sendPaginated, sendMessage } from "../../utils/response";
import { Messages } from "../../constants/messages";
import { AppError } from "../../utils/AppError";
import { CreateCommentInput, ListCommentsQuery } from "./comments.validation";

export class CommentsController {
  async create(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new AppError(Messages.UNAUTHORIZED, 401);
    const comment = await commentsService.create(
      req.user,
      req.params.id as string,
      req.body as CreateCommentInput
    );
    sendSuccess(res, comment, Messages.COMMENT_CREATED, 201);
  }

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListCommentsQuery;
    const result = await commentsService.list(req.params.id as string, query);
    if (result.cache) {
      res.setHeader("X-Cache", result.cache);
    }
    sendPaginated(res, result.data, result.pagination);
  }

  async remove(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new AppError(Messages.UNAUTHORIZED, 401);
    await commentsService.remove(req.user, req.params.id as string);
    sendMessage(res, Messages.COMMENT_DELETED);
  }
}

export const commentsController = new CommentsController();
