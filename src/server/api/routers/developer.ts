// Written by Copilot
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import {
  createDeveloperSchema,
  developerSchema,
} from "~/lib/validations/developer";

export const developerRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const res = await ctx.prisma.developer.findMany();
    console.log(res);
    return res;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.developer.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Developer not found",
        });
      }
      console.log(res);
      return res;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.developer.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Developer not found",
        });
      }
      try {
        const res = await ctx.prisma.developer.delete({
          where: {
            id: input.id,
          },
        });
        console.log(res);
        return res;
      } catch (err) {
        //How do i test this?
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),

  create: protectedProcedure
    .input(createDeveloperSchema)
    .mutation(async ({ ctx, input }) => {
      const developer = await ctx.prisma.developer.create({
        data: {
          name: input.name,
          description: input.description,
          coverImage: input.coverImage,
        },
      });
      console.log(developer);
      return developer;
    }),

  update: protectedProcedure
    .input(developerSchema)
    .mutation(async ({ ctx, input }) => {
      // Written by me
      const instance = await ctx.prisma.developer.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Developer not found",
        });
      }
      // NOTE: Written by Copilot

      try {
        const developer = await ctx.prisma.developer.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.name,
            description: input.description,
            coverImage: input.coverImage,
          },
        });
        console.log(developer);
        return developer;
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
      const res = await ctx.prisma.developer.findUnique({
        where: {
          id: input.id,
        },
        select: {
          games: true,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Developer not found",
        });
      }

      if (!res.games) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Games not found",
        });
      }

      console.log(res);
      return res;
    }),

  addGames: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        gameIds: z.array(z.string().cuid2()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.developer.findUnique({
        where: {
          id: input.id,
        },
        include: {
          games: true,
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Developer not found",
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
        //NOTE: Written by Copilot
        if (instance.games.find((game) => game.id === gameId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Game already linked to Developer",
          });
        }
      }
      const res = await ctx.prisma.developer.update({
        where: {
          id: input.id,
        },
        data: {
          games: {
            connect: input.gameIds.map((gameId) => ({
              id: gameId,
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

      const instance = await ctx.prisma.developer.findUnique({
        where: {
          id: input.id,
        },
        include: {
          games: true,
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Developer not found",
        });
      }

      if (instance.games.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No games for Developer",
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
        if (!instance.games.find((game) => game.id === gameId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Game not linked to Developer",
          });
        }
      }

      const res = await ctx.prisma.developer.update({
        where: {
          id: input.id,
        },
        data: {
          games: {
            disconnect: input.gameIds.map((gameId) => ({
              id: gameId,
            })),
          },
        },
      });
      return res;
    }),
});
