import { createTRPCRouter } from "~/server/api/trpc";
import { franchiseRouter } from "./routers/franchise";
import { publisherRouter } from "./routers/publisher";
import { developerRouter } from "./routers/developer";
import { featureRouter } from "./routers/feature";

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
});

// export type definition of API
export type AppRouter = typeof appRouter;
