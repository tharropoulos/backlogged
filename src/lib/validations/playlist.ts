// BEGIN_COPILOT_CODE
import { z } from "zod";

export const createPlaylistSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.enum([
    "BACKLOG",
    "LIKED",
    "COMPLETED",
    "PLAYING",
    "DROPPED",
    "CUSTOM",
  ]),
  // REWRITE_1: remove userId from the schema
  //   userId: z.string().cuid2(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "FOLLOWERS_ONLY"]),
});
// END_COPILOT_CODE
