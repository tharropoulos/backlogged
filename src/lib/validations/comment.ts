import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string(),
  reviewId: z.string(),
  parentId: z.string().optional(),
});
