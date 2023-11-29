import { z } from "zod";

export const createFranchiseSchema = z.object({
  name: z.string().min(1, { message: "A name is required" }).max(255),
  description: z
    .string()
    .min(1, { message: "A description is required" })

    .max(255),
  backgroundImage: z.string().min(1).max(255),
});

export const updateFranchiseSchema = createFranchiseSchema.extend({
  id: z.string().cuid2(),
});
