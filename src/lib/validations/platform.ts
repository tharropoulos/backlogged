import { z } from "zod";
import { gameSchema } from "./game";

export const createPlatformSchema = z.object({
  name: z.string().min(1, { message: "A name is required" }).max(191),
  description: z
    .string()
    .min(1, { message: "A description is required" })
    .max(191),
  coverImage: z.string().min(1).max(191),
});

export const platformSchema = createPlatformSchema.extend({
  id: z.string().cuid2(),
  games: z.array(gameSchema).optional(),
});

//Copilot generated this without context
// export const createPlatformSchema = z.object({
//     name: z.string().min(1).max(50),
//     });
