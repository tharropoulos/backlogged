import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import {
  createPlatformSchema,
  platformSchema,
} from "~/lib/validations/platform";

export const platformRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const res = await ctx.prisma.platform.findMany();
    return res;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.platform.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform not found",
        });
      }
      return res;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.platform.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform not found",
        });
      }
      try {
        const res = await ctx.prisma.platform.delete({
          where: {
            id: input.id,
          },
        });
        return res;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),

  create: protectedProcedure
    .input(createPlatformSchema)
    .mutation(async ({ ctx, input }) => {
      const platform = await ctx.prisma.platform.create({
        data: {
          name: input.name,
          coverImage: input.coverImage,
          description: input.description,
        },
      });
      return platform;
    }),

  update: protectedProcedure
    .input(platformSchema)
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.platform.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform not found",
        });
      }

      try {
        const platform = await ctx.prisma.platform.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.name,
            description: input.description,
            coverImage: input.coverImage,
          },
        });
        return platform;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),

  getGames: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.platform.findUnique({
        where: {
          id: input.id,
        },
        include: {
          games: {
            include: {
              game: true,
            },
          },
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform not found",
        });
      }

      if (!res.games) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Games not found",
        });
      }

      return res.games.map((game) => game.game);
    }),

  addGames: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        games: z.array(
          z.object({ id: z.string().cuid2(), storeLink: z.string().max(255) })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.platform.findUnique({
        where: {
          id: input.id,
        },
        include: {
          games: {
            select: {
              game: true,
            },
          },
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform not found",
        });
      }

      const games = await ctx.prisma.game.findMany({
        where: {
          id: {
            in: input.games.map((game) => game.id),
          },
        },
      });

      for (const gameId of input.games.map((game) => game.id)) {
        if (!games.find((game) => game.id === gameId)) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Game not found",
          });
        }

        if (
          instance.games.find(
            (gameToPlatform) => gameToPlatform.game.id === gameId
          )
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Game already linked to Platform",
          });
        }
      }

      //   const res = await ctx.prisma.gameToPlatform.createMany({
      //     data: input.games.map((game) => ({
      //       gameId: game.id,
      //       platformId: input.id,
      //       storeLink: game.storeLink,
      //     })),
      //   });

      const res = await ctx.prisma.platform.update({
        where: {
          id: input.id,
        },
        data: {
          games: {
            create: input.games.map((game) => ({
              //Create is used to create a new entry in the join table
              //(https://www.prisma.io/docs/concepts/components/prisma-schema/relations/many-to-many-relations#querying-an-explicit-many-to-many)
              game: {
                connect: {
                  id: game.id,
                },
              },
              storeLink: game.storeLink,
            })),
          },
        },
      });

      return res;
    }),

  removeGames: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        gameIds: z.array(z.string().cuid2()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.gameIds.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No games to remove",
        });
      }

      const instance = await ctx.prisma.platform.findUnique({
        where: {
          id: input.id,
        },
        include: {
          games: {
            select: {
              game: true,
            },
          },
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform not found",
        });
      }

      const platform = {
        ...instance,
        games: instance?.games.map((game) => game.game),
      };

      if (platform.games.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No games for Platform",
        });
      }

      const games = await ctx.prisma.game.findMany({
        where: {
          id: {
            in: input.gameIds,
          },
        },
      });

      for (const gameId of input.gameIds) {
        if (!games.find((game) => game.id === gameId)) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Game not found",
          });
        }

        if (!platform.games.find((game) => game.id === gameId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Game not linked to Platform",
          });
        }
      }

      try {
        const res = await ctx.prisma.platform.update({
          where: {
            id: input.id,
          },
          data: {
            games: {
              deleteMany: input.gameIds.map((gameId) => ({
                gameId: gameId,
              })),
            },
          },
        });
        return res;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
});
