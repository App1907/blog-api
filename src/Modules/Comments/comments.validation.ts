import { z } from "zod";
import { config } from "../../constants/config";

export const createCommentSchema = z.object({
  text: z
    .string({ required_error: "Comment text is required" })
    .trim()
    .min(1, "Comment must be at least 1 character")
    .max(500, "Comment must be at most 500 characters"),
});

export const listCommentsQuerySchema = z.object({
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
  after: z.string().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;
