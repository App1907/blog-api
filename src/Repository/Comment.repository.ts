import { Types, PipelineStage } from "mongoose";
import { Comment, IComment } from "../model/Comment.model";

export interface CommentListResult {
  comments: IComment[];
  total: number;
}

export class CommentRepository {
  async create(data: {
    postId: Types.ObjectId;
    userId: Types.ObjectId;
    userName: string;
    text: string;
  }): Promise<IComment> {
    return Comment.create(data);
  }

  async findById(id: Types.ObjectId | string): Promise<IComment | null> {
    return Comment.findById(id);
  }

  async deleteById(id: Types.ObjectId | string): Promise<IComment | null> {
    return Comment.findByIdAndDelete(id);
  }

  async deleteByPostId(postId: Types.ObjectId | string): Promise<number> {
    const result = await Comment.deleteMany({ postId });
    return result.deletedCount;
  }

  async listByPost(
    postId: Types.ObjectId | string,
    page: number,
    limit: number,
    after?: string
  ): Promise<CommentListResult> {
    const match: Record<string, unknown> = { postId: new Types.ObjectId(String(postId)) };

    // Cursor-based pagination (bonus): fetch comments older than `after`
    if (after && Types.ObjectId.isValid(after)) {
      match._id = { $lt: new Types.ObjectId(after) };
    }

    const skip = after ? 0 : (page - 1) * limit;

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          meta: [{ $count: "total" }],
        },
      },
    ];

    // For cursor mode, total should be all comments on the post (not filtered by after)
    if (after) {
      const [result, total] = await Promise.all([
        Comment.aggregate([
          { $match: match },
          { $sort: { createdAt: -1, _id: -1 } },
          { $limit: limit },
        ]),
        Comment.countDocuments({ postId }),
      ]);

      return {
        comments: result as IComment[],
        total,
      };
    }

    const [result] = await Comment.aggregate(pipeline);

    return {
      comments: (result?.data ?? []) as IComment[],
      total: result?.meta?.[0]?.total ?? 0,
    };
  }
}

export const commentRepository = new CommentRepository();
