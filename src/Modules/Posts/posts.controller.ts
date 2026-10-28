import { Request, Response } from "express";
import { postsService } from "./posts.service";
import { sendSuccess, sendPaginated, sendMessage } from "../../utils/response";
import { Messages } from "../../constants/messages";
import { AppError } from "../../utils/AppError";
import {
  CreatePostInput,
  UpdatePostInput,
  ListPostsQuery,
} from "./posts.validation";
import { config } from "../../constants/config";

export class PostsController {
  async create(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new AppError(Messages.UNAUTHORIZED, 401);
    const post = await postsService.create(req.user, req.body as CreatePostInput);
    sendSuccess(res, post, Messages.POST_CREATED, 201);
  }

  async getOne(req: Request, res: Response): Promise<void> {
    const { post, cache } = await postsService.getPublishedById(
      req.params.id as string
    );
    res.setHeader("X-Cache", cache);
    sendSuccess(res, post);
  }

  async update(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new AppError(Messages.UNAUTHORIZED, 401);
    const post = await postsService.update(
      req.user,
      req.params.id as string,
      req.body as UpdatePostInput
    );
    sendSuccess(res, post, Messages.POST_UPDATED);
  }

  async remove(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new AppError(Messages.UNAUTHORIZED, 401);
    await postsService.remove(req.user, req.params.id as string);
    sendMessage(res, Messages.POST_DELETED);
  }

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListPostsQuery;
    const result = await postsService.listPublished(query);
    res.setHeader("X-Cache", result.cache);
    sendPaginated(res, result.data, result.pagination);
  }

  async listMine(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new AppError(Messages.UNAUTHORIZED, 401);

    const page = Math.max(
      1,
      Number(req.query.page) || config.pagination.defaultPage
    );
    const limit = Math.min(
      config.pagination.maxLimit,
      Math.max(1, Number(req.query.limit) || config.pagination.defaultLimit)
    );

    const result = await postsService.listMyPosts(req.user, page, limit);
    sendPaginated(res, result.data, result.pagination);
  }
}

export const postsController = new PostsController();
