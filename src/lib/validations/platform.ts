// BEGIN_COPILOT_CODE
import { z } from "zod";

export const createPlatformSchema = z.object({
  name: z.string().min(1, { message: "A name is required" }).max(192),
  description: z
    .string()
    .min(1, { message: "A description is required" })
    .max(191),
  image: z.string().min(1, { message: "An image URL is required" }).max(191),
});

export const updatePlatformSchema = createPlatformSchema.extend({
  // REWRITE_1: use cuid2 instead of cuid
  // id: z.string().cuid(),
  id: z.string().cuid2(),
});
// END_COPILOT_CODE
