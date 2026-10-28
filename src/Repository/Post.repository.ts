import { Types, PipelineStage, FilterQuery } from "mongoose";
import { Post, IPost, PostStatus } from "../model/Post.model";

export interface PostListQuery {
  page: number;
  limit: number;
  search?: string;
  tag?: string;
  sort: "newest" | "oldest" | "mostCommented";
}

export interface PostListResult {
  posts: Partial<IPost>[];
  total: number;
}

export class PostRepository {
  async create(data: {
    title: string;
    body: string;
    tags: string[];
    author: Types.ObjectId;
    authorName: string;
    status?: PostStatus;
  }): Promise<IPost> {
    return Post.create(data);
  }

  async findById(id: Types.ObjectId | string): Promise<IPost | null> {
    return Post.findById(id);
  }

  async findPublishedById(id: Types.ObjectId | string): Promise<IPost | null> {
    return Post.findOne({ _id: id, status: "published" });
  }

  async updateById(
    id: Types.ObjectId | string,
    data: Partial<{
      title: string;
      body: string;
      tags: string[];
      status: PostStatus;
    }>
  ): Promise<IPost | null> {
    return Post.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id: Types.ObjectId | string): Promise<IPost | null> {
    return Post.findByIdAndDelete(id);
  }

  async findByAuthor(
    authorId: Types.ObjectId | string,
    page: number,
    limit: number
  ): Promise<PostListResult> {
    const filter = { author: authorId };
    const skip = (page - 1) * limit;

    const [result] = await Post.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          meta: [{ $count: "total" }],
        },
      },
    ]);

    return {
      posts: result?.data ?? [],
      total: result?.meta?.[0]?.total ?? 0,
    };
  }

  async listPublished(query: PostListQuery): Promise<PostListResult> {
    const filter: FilterQuery<IPost> = { status: "published" };

    if (query.search) {
      filter.title = { $regex: query.search, $options: "i" };
    }

    if (query.tag) {
      filter.tags = query.tag.toLowerCase();
    }

    let sortStage: Record<string, 1 | -1>;
    switch (query.sort) {
      case "oldest":
        sortStage = { createdAt: 1 };
        break;
      case "mostCommented":
        sortStage = { commentCount: -1, createdAt: -1 };
        break;
      default:
        sortStage = { createdAt: -1 };
    }

    const skip = (query.page - 1) * query.limit;

    const pipeline: PipelineStage[] = [
      { $match: filter },
      { $sort: sortStage },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: query.limit },
            {
              $project: {
                title: 1,
                tags: 1,
                author: 1,
                authorName: 1,
                status: 1,
                commentCount: 1,
                createdAt: 1,
                updatedAt: 1,
                // body intentionally excluded
              },
            },
          ],
          meta: [{ $count: "total" }],
        },
      },
    ];

    const [result] = await Post.aggregate(pipeline);

    return {
      posts: result?.data ?? [],
      total: result?.meta?.[0]?.total ?? 0,
    };
  }

  async updateAuthorName(
    authorId: Types.ObjectId | string,
    authorName: string
  ): Promise<number> {
    const result = await Post.updateMany({ author: authorId }, { authorName });
    return result.modifiedCount;
  }

  async incrementCommentCount(id: Types.ObjectId | string): Promise<void> {
    await Post.updateOne({ _id: id }, { $inc: { commentCount: 1 } });
  }

  async decrementCommentCount(id: Types.ObjectId | string): Promise<void> {
    await Post.updateOne(
      { _id: id, commentCount: { $gt: 0 } },
      { $inc: { commentCount: -1 } }
    );
  }

  async getStats() {
    const [result] = await Post.aggregate([
      {
        $facet: {
          totalPublished: [
            { $match: { status: "published" } },
            { $count: "count" },
          ],
          topTags: [
            { $match: { status: "published" } },
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { _id: 0, tag: "$_id", count: 1 } },
          ],
          topAuthors: [
            { $match: { status: "published" } },
            { $group: { _id: "$author", postCount: { $sum: 1 } } },
            { $sort: { postCount: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
              },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                authorId: "$_id",
                name: { $ifNull: ["$user.name", "Unknown"] },
                postCount: 1,
              },
            },
          ],
          mostCommented: [
            { $match: { status: "published" } },
            { $sort: { commentCount: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 0,
                id: { $toString: "$_id" },
                title: 1,
                commentCount: 1,
              },
            },
          ],
        },
      },
    ]);

    return {
      totalPublishedPosts: result?.totalPublished?.[0]?.count ?? 0,
      topTags: result?.topTags ?? [],
      topAuthors: (result?.topAuthors ?? []).map(
        (a: { authorId: Types.ObjectId; name: string; postCount: number }) => ({
          authorId: String(a.authorId),
          name: a.name,
          postCount: a.postCount,
        })
      ),
      mostCommentedPosts: result?.mostCommented ?? [],
    };
  }
}

export const postRepository = new PostRepository();
