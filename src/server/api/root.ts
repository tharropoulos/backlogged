import { createTRPCRouter } from "~/server/api/trpc";
import { franchiseRouter } from "./routers/franchise";
import { publisherRouter } from "./routers/publisher";
import { developerRouter } from "./routers/developer";
import { featureRouter } from "./routers/feature";
import { genreRouter } from "./routers/genre";
import { platformRouter } from "./routers/platform";
import { gameRouter } from "./routers/game";
import { reviewRouter } from "./routers/review";
import { commentRouter } from "./routers/comment";
import { playlistRouter } from "./routers/playlist";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  franchise: franchiseRouter,
  publisher: publisherRouter,
  developer: developerRouter,
  feature: featureRouter,
  genre: genreRouter,
  platform: platformRouter,
  game: gameRouter,
  review: reviewRouter,
  playlist: playlistRouter,
  comment: commentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
