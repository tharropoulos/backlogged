// BEGIN_COPILOT_CODE
import { z } from "zod";
export const createReviewSchema = z.object({
  gameId: z.string().cuid2(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(1, { message: "Content is required" }),
});

export const updateReviewSchema = createReviewSchema.extend({
  id: z.string().cuid2(),
});
// END_COPILOT_CODE
