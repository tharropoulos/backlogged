import { z } from "zod";
import { gameSchema } from "./game";

export const createGenreSchema = z.object({
  name: z.string().min(1, { message: "A name is required" }).max(191),
  description: z
    .string()
    .min(1, { message: "A description is required" })
    .max(191),
});

export const genreSchema = createGenreSchema.extend({
  id: z.string().cuid2(),
  games: z.array(gameSchema).optional(),
});
