// BEGIN_COPILOT_CODE
import { z } from "zod";

export const createGenreSchema = z.object({
  name: z.string().min(1, { message: "A name is required" }).max(191),
  description: z
    .string()
    .min(1, { message: "A description is required" })
    .max(191),
});

export const updateGenreSchema = createGenreSchema.extend({
  // END_COPILOT_CODE
  // BEGIN_NON_COPILOT_CODE
  // the string should be of type cuid2
  // id: z.string().cuid(),
  id: z.string().cuid2(),
});
