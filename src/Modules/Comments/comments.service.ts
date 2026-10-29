import { CommentRepository } from "../../Repository/Comment.repository";
import { PostRepository } from "../../Repository/Post.repository";
import { AppError } from "../../utils/AppError";
import { Messages } from "../../constants/messages";
import { ObjectIdHelper } from "../../utils/objectId";
import { AuthUser } from "../../types/express";
import { CreateCommentInput, ListCommentsQuery } from "./comments.validation";
import { ResponseHelper, PaginationMeta } from "../../utils/response";
import { RedisKeys, RedisTTL } from "../../constants/redisKeys";
import { CacheService, CacheStatus } from "../../utils/cache";
import { CacheInvalidationService } from "../../utils/cacheInvalidation";

type SerializedComment = {
  id: string;
  postId: string;
  userId: string;
  userName: unknown;
  text: unknown;
  createdAt: unknown;
  updatedAt: unknown;
};

export class CommentsService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly postRepository: PostRepository,
    private readonly cacheService: CacheService,
    private readonly cacheInvalidationService: CacheInvalidationService
  ) {}

  private serializeComment(
    comment:
      | Record<string, unknown>
      | { toObject?: () => Record<string, unknown> }
  ): SerializedComment {
    const obj =
      typeof (comment as { toObject?: () => Record<string, unknown> })
        .toObject === "function"
        ? (comment as { toObject: () => Record<string, unknown> }).toObject()
        : (comment as Record<string, unknown>);

    return {
      id: String(obj._id),
      postId: String(obj.postId),
      userId: String(obj.userId),
      userName: obj.userName,
      text: obj.text,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }

  async create(user: AuthUser, postId: string, input: CreateCommentInput) {
    const objectId = ObjectIdHelper.assert(postId);
    const post = await this.postRepository.findById(objectId);

    if (!post) {
      throw new AppError(Messages.POST_NOT_FOUND, 404);
    }

    if (post.status !== "published") {
      throw new AppError(Messages.POST_NOT_PUBLISHED, 400);
    }

    const comment = await this.commentRepository.create({
      postId: objectId,
      userId: user._id,
      userName: user.name,
      text: input.text,
    });

    await this.postRepository.incrementCommentCount(objectId);
    await this.cacheInvalidationService.invalidatePostCaches(String(objectId));

    return this.serializeComment(comment);
  }

  async list(
    postId: string,
    query: ListCommentsQuery
  ): Promise<{
    data: SerializedComment[];
    pagination: PaginationMeta;
    cache?: CacheStatus;
  }> {
    const objectId = ObjectIdHelper.assert(postId);

    const post = await this.postRepository.findById(objectId);
    if (!post || post.status !== "published") {
      throw new AppError(Messages.POST_NOT_FOUND, 404);
    }

    if (query.after && !ObjectIdHelper.isValid(query.after)) {
      throw new AppError(Messages.INVALID_OBJECT_ID, 400);
    }

    const canCache = !query.after && query.page === 1;
    if (canCache) {
      const version = await this.cacheService.getOrIncrVersion(
        RedisKeys.commentsVersion(String(objectId))
      );
      const key = RedisKeys.commentsList(
        String(objectId),
        version,
        query.page,
        query.limit
      );
      const cached = await this.cacheService.getJSON<{
        data: SerializedComment[];
        pagination: PaginationMeta;
      }>(key);

      if (cached) {
        return { ...cached, cache: "HIT" };
      }

      const { comments, total } = await this.commentRepository.listByPost(
        objectId,
        query.page,
        query.limit,
        query.after
      );

      const payload = {
        data: comments.map((c) =>
          this.serializeComment(c as unknown as Record<string, unknown>)
        ),
        pagination: ResponseHelper.buildPagination(
          query.page,
          query.limit,
          total
        ),
      };

      await this.cacheService.setJSON(key, payload, RedisTTL.COMMENTS);
      return { ...payload, cache: "MISS" };
    }

    const { comments, total } = await this.commentRepository.listByPost(
      objectId,
      query.page,
      query.limit,
      query.after
    );

    return {
      data: comments.map((c) =>
        this.serializeComment(c as unknown as Record<string, unknown>)
      ),
      pagination: ResponseHelper.buildPagination(query.page, query.limit, total),
    };
  }

  async remove(user: AuthUser, commentId: string) {
    const objectId = ObjectIdHelper.assert(commentId);
    const comment = await this.commentRepository.findById(objectId);

    if (!comment) {
      throw new AppError(Messages.COMMENT_NOT_FOUND, 404);
    }

    const post = await this.postRepository.findById(comment.postId);

    const isCommentAuthor = String(comment.userId) === String(user._id);
    const isPostAuthor = post ? String(post.author) === String(user._id) : false;

    if (!isCommentAuthor && !isPostAuthor) {
      throw new AppError(Messages.FORBIDDEN_COMMENT, 403);
    }

    await this.commentRepository.deleteById(objectId);
    await this.postRepository.decrementCommentCount(comment.postId);
    await this.cacheInvalidationService.invalidatePostCaches(
      String(comment.postId)
    );

    return { id: String(objectId) };
  }
}
