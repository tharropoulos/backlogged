import { z } from "zod";

//NOTE: Written by Copilot
export const createReviewSchema = z.object({
  gameId: z.string().cuid2(),
  rating: z.number().min(1).max(5).nullable(),
  content: z.string().min(1).max(5000),
});

export const reviewSchema = createReviewSchema.extend({
  userId: z.string().cuid2(),
  id: z.string().cuid2(),
  likes: z
    .array(
      z.object({
        userId: z.string().cuid2(),
      })
    )
    .nullish(),
  comments: z
    .array(
      z.object({
        userId: z.string().cuid2(),
        content: z.string().min(1).max(5000),
      })
    )
    .nullish(),
  // likes: z.object({
  //   userId: z.string().cuid2(),
  // }),
});
