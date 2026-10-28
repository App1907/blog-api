import { z } from "zod";
import { config } from "../../constants/config";

const tagSchema = z
  .string()
  .trim()
  .min(1, "Tag cannot be empty")
  .max(30, "Tag must be at most 30 characters")
  .transform((t) => t.toLowerCase());

export const createPostSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title must be at most 120 characters"),
  body: z
    .string({ required_error: "Body is required" })
    .min(20, "Body must be at least 20 characters"),
  tags: z
    .array(tagSchema)
    .max(5, "A post can have at most 5 tags")
    .optional()
    .default([]),
  status: z.enum(["draft", "published"]).optional().default("draft"),
});

export const updatePostSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Title must be at least 5 characters")
      .max(120, "Title must be at most 120 characters")
      .optional(),
    body: z
      .string()
      .min(20, "Body must be at least 20 characters")
      .optional(),
    tags: z.array(tagSchema).max(5, "A post can have at most 5 tags").optional(),
    status: z.enum(["draft", "published"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listPostsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : config.pagination.defaultPage))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : config.pagination.defaultLimit))
    .pipe(z.number().int().min(1).max(config.pagination.maxLimit)),
  search: z.string().trim().optional(),
  tag: z.string().trim().toLowerCase().optional(),
  sort: z
    .enum(["newest", "oldest", "mostCommented"])
    .optional()
    .default("newest"),
});

export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
