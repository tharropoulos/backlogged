// BEGIN_COPILOT_CODE
import { z } from "zod";

// BEGIN_NON_COPILOT_CODE
// REWRITE_1: export const
// const createDeveloperSchema = z.object({
export const createDeveloperSchema = z.object({
  // END_NON_COPILOT_CODE

  // REWRITE_3: add message
  // name: z
  // .string()
  // .min(1, "Name must be at least 1 character")
  // .max(191, "Name must be at most 191 characters"),

  // REWRITE_4: correct error message
  name: z.string().min(1, { message: "A name is required" }).max(191),
  description: z
    .string()
    .min(1, { message: "A description is required" })
    .max(191),
  image: z.string().min(1, { message: "An image URL is required" }).max(191),
});

// REWRITE_2: extend instead of creating new one
export const updateDeveloperSchema = createDeveloperSchema.extend({
  id: z.string().cuid2(),
});

// export const updateDeveloperSchema = z.object({
//   id: z.string(),
//   name: z.string().max(191).optional(),
//   description: z.string().max(191).optional(),
//   image: z.string().max(191).optional(),
// });

// END_COPILOT_CODE
