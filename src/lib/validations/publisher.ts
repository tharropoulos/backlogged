// Entirely copilot generated, needed to explicit with copilot, else it will generate nonsense
import { z } from "zod";

export const createPublisherSchema = z.object({
  name: z.string().min(1, { message: "A name is required" }).max(255),
  description: z
    .string()
    .min(1, { message: "A description is required" })
    .max(255),
  coverImage: z.string().min(1).max(255),
});

export const publisherSchema = createPublisherSchema.extend({
  id: z.string().cuid(),
  // NOTE: Copilot generated this, with no input from me
  games: z
    .array(
      z.object({
        id: z.string().cuid(),
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
