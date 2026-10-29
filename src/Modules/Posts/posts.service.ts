import { PostRepository } from "../../Repository/Post.repository";
import { CommentRepository } from "../../Repository/Comment.repository";
import { AppError } from "../../utils/AppError";
import { Messages } from "../../constants/messages";
import { ObjectIdHelper } from "../../utils/objectId";
import { AuthUser } from "../../types/express";
import { CreatePostInput, UpdatePostInput, ListPostsQuery } from "./posts.validation";
import { ResponseHelper, PaginationMeta } from "../../utils/response";
import { RedisKeys, RedisTTL } from "../../constants/redisKeys";
import { CacheService, CacheStatus } from "../../utils/cache";
import { CacheInvalidationService } from "../../utils/cacheInvalidation";

type SerializedPost = {
  id: string;
  title: unknown;
  body?: unknown;
  tags: unknown;
  author: string;
  authorName: unknown;
  status: unknown;
  commentCount: unknown;
  createdAt: unknown;
  updatedAt: unknown;
};

export class PostsService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly commentRepository: CommentRepository,
    private readonly cacheService: CacheService,
    private readonly cacheInvalidationService: CacheInvalidationService
  ) {}

  private serializePost(
    post: Record<string, unknown> | { toObject?: () => Record<string, unknown> }
  ): SerializedPost {
    const obj =
      typeof (post as { toObject?: () => Record<string, unknown> }).toObject ===
      "function"
        ? (post as { toObject: () => Record<string, unknown> }).toObject()
        : (post as Record<string, unknown>);

    return {
      id: String(obj._id),
      title: obj.title,
      body: obj.body,
      tags: obj.tags,
      author: String(obj.author),
      authorName: obj.authorName,
      status: obj.status,
      commentCount: obj.commentCount,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }

  private serializePostListItem(post: Record<string, unknown>): SerializedPost {
    return {
      id: String(post._id),
      title: post.title,
      tags: post.tags,
      author: String(post.author),
      authorName: post.authorName,
      status: post.status,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private listCacheKey(query: ListPostsQuery, version: number): string {
    return RedisKeys.postsList({
      version,
      page: query.page,
      limit: query.limit,
      search: (query.search ?? "").toLowerCase(),
      tag: (query.tag ?? "").toLowerCase(),
      sort: query.sort,
    });
  }

  async create(user: AuthUser, input: CreatePostInput) {
    const tags = [...new Set((input.tags ?? []).map((t) => t.toLowerCase()))].slice(
      0,
      5
    );

    const post = await this.postRepository.create({
      title: input.title,
      body: input.body,
      tags,
      author: user._id,
      authorName: user.name,
      status: input.status,
    });

    await this.cacheInvalidationService.invalidatePostCaches(String(post._id));

    return this.serializePost(post);
  }

  async getPublishedById(
    id: string
  ): Promise<{ post: SerializedPost; cache: CacheStatus }> {
    const objectId = ObjectIdHelper.assert(id);
    const cacheKey = RedisKeys.post(String(objectId));

    const cached = await this.cacheService.getJSON<SerializedPost>(cacheKey);
    if (cached) {
      return { post: cached, cache: "HIT" };
    }

    const post = await this.postRepository.findPublishedById(objectId);
    if (!post) {
      throw new AppError(Messages.POST_NOT_FOUND, 404);
    }

    const serialized = this.serializePost(post);
    await this.cacheService.setJSON(cacheKey, serialized, RedisTTL.POST);
    return { post: serialized, cache: "MISS" };
  }

  async update(user: AuthUser, id: string, input: UpdatePostInput) {
    const objectId = ObjectIdHelper.assert(id);
    const post = await this.postRepository.findById(objectId);

    if (!post) {
      throw new AppError(Messages.POST_NOT_FOUND, 404);
    }

    if (String(post.author) !== String(user._id)) {
      throw new AppError(Messages.FORBIDDEN_POST, 403);
    }

    const updateData: UpdatePostInput = { ...input };
    if (updateData.tags) {
      updateData.tags = [
        ...new Set(updateData.tags.map((t) => t.toLowerCase())),
      ].slice(0, 5);
    }

    const updated = await this.postRepository.updateById(objectId, updateData);
    if (!updated) {
      throw new AppError(Messages.POST_NOT_FOUND, 404);
    }

    await this.cacheInvalidationService.invalidatePostCaches(String(objectId));
    return this.serializePost(updated);
  }

  async remove(user: AuthUser, id: string) {
    const objectId = ObjectIdHelper.assert(id);
    const post = await this.postRepository.findById(objectId);

    if (!post) {
      throw new AppError(Messages.POST_NOT_FOUND, 404);
    }

    if (String(post.author) !== String(user._id)) {
      throw new AppError(Messages.FORBIDDEN_POST, 403);
    }

    await this.commentRepository.deleteByPostId(objectId);
    await this.postRepository.deleteById(objectId);
    await this.cacheInvalidationService.invalidatePostCaches(String(objectId));

    return { id: String(objectId) };
  }

  async listPublished(query: ListPostsQuery): Promise<{
    data: SerializedPost[];
    pagination: PaginationMeta;
    cache: CacheStatus;
  }> {
    const version = await this.cacheService.getOrIncrVersion(
      RedisKeys.postsListVersion()
    );
    const key = this.listCacheKey(query, version);

    const cached = await this.cacheService.getJSON<{
      data: SerializedPost[];
      pagination: PaginationMeta;
    }>(key);

    if (cached) {
      return { ...cached, cache: "HIT" };
    }

    const { posts, total } = await this.postRepository.listPublished({
      page: query.page,
      limit: query.limit,
      search: query.search,
      tag: query.tag,
      sort: query.sort,
    });

    const payload = {
      data: posts.map((p) =>
        this.serializePostListItem(p as Record<string, unknown>)
      ),
      pagination: ResponseHelper.buildPagination(query.page, query.limit, total),
    };

    await this.cacheService.setJSON(key, payload, RedisTTL.POST_LIST);
    return { ...payload, cache: "MISS" };
  }

  async listMyPosts(user: AuthUser, page: number, limit: number) {
    const { posts, total } = await this.postRepository.findByAuthor(
      user._id,
      page,
      limit
    );

    return {
      data: posts.map((p) => this.serializePost(p as Record<string, unknown>)),
      pagination: ResponseHelper.buildPagination(page, limit, total),
    };
  }
}
