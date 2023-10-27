//NOTE: Written by Copilot Chat
import { z } from "zod";
import { gameSchema } from "./game";

export const createFeatureSchema = z.object({
  name: z.string().min(1, { message: "A name is required" }).max(255),
  description: z
    .string()
    .min(1, { message: "A description is required" })
    .max(255),
});

export const featureSchema = createFeatureSchema.extend({
  id: z.string().cuid2(),
  games: z.array(gameSchema).optional(),
});
