import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
