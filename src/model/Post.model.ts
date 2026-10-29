import { Schema, model, Document, Types } from "mongoose";

export type PostStatus = "draft" | "published";

export interface IPost extends Document {
  _id: Types.ObjectId;
  title: string;
  body: string;
  tags: string[];
  author: Types.ObjectId;
  authorName: string;
  status: PostStatus;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [120, "Title must be at most 120 characters"],
    },
    body: {
      type: String,
      required: [true, "Body is required"],
      minlength: [20, "Body must be at least 20 characters"],
    },
    tags: {
      type: [
        {
          type: String,
          lowercase: true,
          trim: true,
        },
      ],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.length <= 5,
        message: "A post can have at most 5 tags",
      },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

postSchema.index({ tags: 1 });
postSchema.index({ status: 1, createdAt: -1 });

export const Post = model<IPost>("Post", postSchema);
