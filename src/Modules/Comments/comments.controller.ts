import { Request, Response } from "express";
import { CommentsService } from "./comments.service";
import { ResponseHelper } from "../../utils/response";
import { Messages } from "../../constants/messages";
import { AppError } from "../../utils/AppError";
import { CreateCommentInput, ListCommentsQuery } from "./comments.validation";

export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError(Messages.UNAUTHORIZED, 401);
    const comment = await this.commentsService.create(
      req.user,
      req.params.id as string,
      req.body as CreateCommentInput
    );
    ResponseHelper.sendSuccess(res, comment, Messages.COMMENT_CREATED, 201);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as ListCommentsQuery;
    const result = await this.commentsService.list(
      req.params.id as string,
      query
    );
    if (result.cache) {
      res.setHeader("X-Cache", result.cache);
    }
    ResponseHelper.sendPaginated(res, result.data, result.pagination);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError(Messages.UNAUTHORIZED, 401);
    await this.commentsService.remove(req.user, req.params.id as string);
    ResponseHelper.sendMessage(res, Messages.COMMENT_DELETED);
  };
}
