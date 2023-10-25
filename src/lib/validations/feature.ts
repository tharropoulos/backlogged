//NOTE: Written by Copilot Chat
import { z } from "zod";

export const createFeatureSchema = z.object({
  name: z.string().min(1, { message: "A name is required" }).max(255),
  description: z
    .string()
    .min(1, { message: "A description is required" })
    .max(255),
});

export const featureSchema = createFeatureSchema.extend({
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
