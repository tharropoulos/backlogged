import { z } from "zod";

export const createPlaylistSchema = z.object({
  name: z.string().min(1).max(191),
  description: z.string().min(1),
  visibility: z.enum(["PUBLIC", "PRIVATE", "FOLLOWERS_ONLY"]),
});
