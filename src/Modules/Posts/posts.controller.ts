import { Request, Response } from "express";
import { PostsService } from "./posts.service";
import { ResponseHelper } from "../../utils/response";
import { Messages } from "../../constants/messages";
import { AppError } from "../../utils/AppError";
import {
  CreatePostInput,
  UpdatePostInput,
  ListPostsQuery,
} from "./posts.validation";
import { config } from "../../constants/config";

export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError(Messages.UNAUTHORIZED, 401);
    const post = await this.postsService.create(
      req.user,
      req.body as CreatePostInput
    );
    ResponseHelper.sendSuccess(res, post, Messages.POST_CREATED, 201);
  };

  getOne = async (req: Request, res: Response): Promise<void> => {
    const { post, cache } = await this.postsService.getPublishedById(
      req.params.id as string
    );
    res.setHeader("X-Cache", cache);
    ResponseHelper.sendSuccess(res, post);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError(Messages.UNAUTHORIZED, 401);
    const post = await this.postsService.update(
      req.user,
      req.params.id as string,
      req.body as UpdatePostInput
    );
    ResponseHelper.sendSuccess(res, post, Messages.POST_UPDATED);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError(Messages.UNAUTHORIZED, 401);
    await this.postsService.remove(req.user, req.params.id as string);
    ResponseHelper.sendMessage(res, Messages.POST_DELETED);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as ListPostsQuery;
    const result = await this.postsService.listPublished(query);
    res.setHeader("X-Cache", result.cache);
    ResponseHelper.sendPaginated(res, result.data, result.pagination);
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError(Messages.UNAUTHORIZED, 401);

    const page = Math.max(
      1,
      Number(req.query.page) || config.pagination.defaultPage
    );
    const limit = Math.min(
      config.pagination.maxLimit,
      Math.max(1, Number(req.query.limit) || config.pagination.defaultLimit)
    );

    const result = await this.postsService.listMyPosts(req.user, page, limit);
    ResponseHelper.sendPaginated(res, result.data, result.pagination);
  };
}
