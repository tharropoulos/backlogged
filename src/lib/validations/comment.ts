// BEGIN_COPILOT_CODE
import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string(),
  reviewId: z.string().cuid2(),
  // REWRITE_1: Make parentId nullable
  //   parentId: z.string().nullable.cuid2(),
  parentId: z.string().cuid2().nullish(),
});
// END_COPILOT_CODE
