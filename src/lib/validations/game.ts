import { z } from "zod";

export const createGameSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(255),
  releaseDate: z.date(),
  franchiseId: z.string().cuid(),
  publisherId: z.string().cuid(),
  coverImage: z.string().min(1).max(255),
  backgroundImage: z.string().min(1).max(255),
});

export const gameSchema = createGameSchema.extend({
  id: z.string().cuid2(),
});
