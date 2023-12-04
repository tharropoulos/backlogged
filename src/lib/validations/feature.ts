// BEGIN_COPILOT_CODE
import { z } from "zod";

export const createFeatureSchema = z.object({
  name: z.string().min(1, { message: "A name is required" }).max(191),
  description: z
    .string()
    .min(1, { message: "A description is required" })
    .max(191),
  image: z.string().min(1, { message: "An image URL is required" }).max(191),
});

export const updateFeatureSchema = createFeatureSchema.extend({
  id: z.string().cuid2(),
});
// END_COPILOT_CODE
