// BEGIN_COPILOT_CODE
import { z } from "zod";

export const createGameSchema = z.object({
  name: z.string().min(1, { message: "A name is required" }).max(191),
  description: z
    .string()
    .min(1, { message: "A description is required" })
    .max(191),
  coverImage: z
    .string()
    .min(1, { message: "A cover image URL is required" })
    .max(191),
  backgroundImage: z
    .string()
    .min(1, { message: "A background image URL is required" })
    .max(191),
  releaseDate: z.date(),
  franchiseId: z.string().cuid2(),
  publisherId: z.string().cuid2(),
});

export const updateGameSchema = createGameSchema.extend({
  id: z.string().cuid2(),
});
// END_COPILOT_CODE
