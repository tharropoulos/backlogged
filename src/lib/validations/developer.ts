// No copilot assistance in this
import { z } from "zod";

export const createDeveloperSchema = z.object({
  name: z.string().min(1, { message: "A name is required" }).max(255),
  description: z
    .string()
    .min(1, { message: "A description is required" })
    .max(255),
  coverImage: z.string().min(1).max(255),
  //   games: z.array(z.string().cuid2()).optional(),
});

export const developerSchema = createDeveloperSchema.extend({
  id: z.string().cuid2(),
  games: z
    .array(
      z.object({
        id: z.string().cuid2(),
        name: z.string().min(1).max(255),
        description: z.string().min(1).max(255),
        releaseDate: z.date(),
        franchiseId: z.string().cuid(),
        publisherId: z.string().cuid(),
        coverImage: z.string().min(1).max(255),
        backgroundImage: z.string().min(1).max(255),
      })
    )
    .optional(),
});
