import { postRepository } from "../../Repository/Post.repository";
import { commentRepository } from "../../Repository/Comment.repository";
import { AppError } from "../../utils/AppError";
import { Messages } from "../../constants/messages";
import { assertObjectId } from "../../utils/objectId";
import { AuthUser } from "../../types/express";
import { CreatePostInput, UpdatePostInput, ListPostsQuery } from "./posts.validation";
import { buildPagination, PaginationMeta } from "../../utils/response";
import { RedisKeys, RedisTTL } from "../../constants/redisKeys";
import {
  CacheStatus,
  getJSON,
  getOrIncrVersion,
  setJSON,
} from "../../utils/cache";
import { invalidatePostCaches } from "../../utils/cacheInvalidation";

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

function serializePost(
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

function serializePostListItem(post: Record<string, unknown>): SerializedPost {
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

function listCacheKey(query: ListPostsQuery, version: number): string {
  return RedisKeys.postsList({
    version,
    page: query.page,
    limit: query.limit,
    search: (query.search ?? "").toLowerCase(),
    tag: (query.tag ?? "").toLowerCase(),
    sort: query.sort,
  });
}

export class PostsService {
  async create(user: AuthUser, input: CreatePostInput) {
    const tags = [...new Set((input.tags ?? []).map((t) => t.toLowerCase()))].slice(
      0,
      5
    );

    const post = await postRepository.create({
      title: input.title,
      body: input.body,
      tags,
      author: user._id,
      authorName: user.name,
      status: input.status,
    });

    await invalidatePostCaches(String(post._id));

    return serializePost(post);
  }

  async getPublishedById(
    id: string
  ): Promise<{ post: SerializedPost; cache: CacheStatus }> {
    const objectId = assertObjectId(id);
    const cacheKey = RedisKeys.post(String(objectId));

    const cached = await getJSON<SerializedPost>(cacheKey);
    if (cached) {
      return { post: cached, cache: "HIT" };
    }

    const post = await postRepository.findPublishedById(objectId);
    if (!post) {
      throw new AppError(Messages.POST_NOT_FOUND, 404);
    }

    const serialized = serializePost(post);
    await setJSON(cacheKey, serialized, RedisTTL.POST);
    return { post: serialized, cache: "MISS" };
  }

  async update(user: AuthUser, id: string, input: UpdatePostInput) {
    const objectId = assertObjectId(id);
    const post = await postRepository.findById(objectId);

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

    const updated = await postRepository.updateById(objectId, updateData);
    if (!updated) {
      throw new AppError(Messages.POST_NOT_FOUND, 404);
    }

    await invalidatePostCaches(String(objectId));
    return serializePost(updated);
  }

  async remove(user: AuthUser, id: string) {
    const objectId = assertObjectId(id);
    const post = await postRepository.findById(objectId);

    if (!post) {
      throw new AppError(Messages.POST_NOT_FOUND, 404);
    }

    if (String(post.author) !== String(user._id)) {
      throw new AppError(Messages.FORBIDDEN_POST, 403);
    }

    await commentRepository.deleteByPostId(objectId);
    await postRepository.deleteById(objectId);
    await invalidatePostCaches(String(objectId));

    return { id: String(objectId) };
  }

  async listPublished(query: ListPostsQuery): Promise<{
    data: SerializedPost[];
    pagination: PaginationMeta;
    cache: CacheStatus;
  }> {
    const version = await getOrIncrVersion(RedisKeys.postsListVersion());
    const key = listCacheKey(query, version);

    const cached = await getJSON<{
      data: SerializedPost[];
      pagination: PaginationMeta;
    }>(key);

    if (cached) {
      return { ...cached, cache: "HIT" };
    }

    const { posts, total } = await postRepository.listPublished({
      page: query.page,
      limit: query.limit,
      search: query.search,
      tag: query.tag,
      sort: query.sort,
    });

    const payload = {
      data: posts.map((p) => serializePostListItem(p as Record<string, unknown>)),
      pagination: buildPagination(query.page, query.limit, total),
    };

    await setJSON(key, payload, RedisTTL.POST_LIST);
    return { ...payload, cache: "MISS" };
  }

  async listMyPosts(user: AuthUser, page: number, limit: number) {
    const { posts, total } = await postRepository.findByAuthor(
      user._id,
      page,
      limit
    );

    return {
      data: posts.map((p) => serializePost(p as Record<string, unknown>)),
      pagination: buildPagination(page, limit, total),
    };
  }
}

export const postsService = new PostsService();
