import { commentRepository } from "../../Repository/Comment.repository";
import { postRepository } from "../../Repository/Post.repository";
import { AppError } from "../../utils/AppError";
import { Messages } from "../../constants/messages";
import { assertObjectId, isValidObjectId } from "../../utils/objectId";
import { AuthUser } from "../../types/express";
import { CreateCommentInput, ListCommentsQuery } from "./comments.validation";
import { buildPagination, PaginationMeta } from "../../utils/response";

type SerializedComment = {
  id: string;
  postId: string;
  userId: string;
  userName: unknown;
  text: unknown;
  createdAt: unknown;
  updatedAt: unknown;
};

function serializeComment(
  comment: Record<string, unknown> | { toObject?: () => Record<string, unknown> }
): SerializedComment {
  const obj =
    typeof (comment as { toObject?: () => Record<string, unknown> }).toObject ===
    "function"
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

export class CommentsService {
  async create(user: AuthUser, postId: string, input: CreateCommentInput) {
    const objectId = assertObjectId(postId);
    const post = await postRepository.findById(objectId);

    if (!post) {
      throw new AppError(Messages.POST_NOT_FOUND, 404);
    }

    if (post.status !== "published") {
      throw new AppError(Messages.POST_NOT_PUBLISHED, 400);
    }

    const comment = await commentRepository.create({
      postId: objectId,
      userId: user._id,
      userName: user.name,
      text: input.text,
    });

    await postRepository.incrementCommentCount(objectId);
    return serializeComment(comment);
  }

  async list(
    postId: string,
    query: ListCommentsQuery
  ): Promise<{ data: SerializedComment[]; pagination: PaginationMeta }> {
    const objectId = assertObjectId(postId);

    const post = await postRepository.findById(objectId);
    if (!post) {
      throw new AppError(Messages.POST_NOT_FOUND, 404);
    }

    if (query.after && !isValidObjectId(query.after)) {
      throw new AppError(Messages.INVALID_OBJECT_ID, 400);
    }

    const { comments, total } = await commentRepository.listByPost(
      objectId,
      query.page,
      query.limit,
      query.after
    );

    return {
      data: comments.map((c) =>
        serializeComment(c as unknown as Record<string, unknown>)
      ),
      pagination: buildPagination(query.page, query.limit, total),
    };
  }

  async remove(user: AuthUser, commentId: string) {
    const objectId = assertObjectId(commentId);
    const comment = await commentRepository.findById(objectId);

    if (!comment) {
      throw new AppError(Messages.COMMENT_NOT_FOUND, 404);
    }

    const post = await postRepository.findById(comment.postId);
    const isCommentAuthor = String(comment.userId) === String(user._id);
    const isPostAuthor = post ? String(post.author) === String(user._id) : false;

    if (!isCommentAuthor && !isPostAuthor) {
      throw new AppError(Messages.FORBIDDEN_COMMENT, 403);
    }

    await commentRepository.deleteById(objectId);
    await postRepository.decrementCommentCount(comment.postId);

    return { id: String(objectId) };
  }
}

export const commentsService = new CommentsService();
