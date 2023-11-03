//NOTE: Written by Copilot chat
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { createFeatureSchema, featureSchema } from "~/lib/validations/feature";

export const featureRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const res = await ctx.prisma.feature.findMany();
    return res;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.feature.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature not found",
        });
      }
      return res;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.feature.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature not found",
        });
      }
      try {
        const res = await ctx.prisma.feature.delete({
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
    .input(createFeatureSchema)
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.prisma.feature.create({
        data: {
          name: input.name,
          description: input.description,
        },
      });
      return feature;
    }),

  update: protectedProcedure
    .input(featureSchema)
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.feature.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature not found",
        });
      }

      try {
        const feature = await ctx.prisma.feature.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.name,
            description: input.description,
          },
        });
        return feature;
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
      const res = await ctx.prisma.feature.findUnique({
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
          message: "Feature not found",
        });
      }

      if (!res.games) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Games not found",
        });
      }

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
      const instance = await ctx.prisma.feature.findUnique({
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
          message: "Feature not found",
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

        if (instance.games.find((game) => game.id === gameId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Game already linked to Feature",
          });
        }
      }

      const res = await ctx.prisma.feature.update({
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

      const instance = await ctx.prisma.feature.findUnique({
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
          message: "Feature not found",
        });
      }

      if (instance.games.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No games for Feature",
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
            message: "Game not linked to Feature",
          });
        }
      }

      const res = await ctx.prisma.feature.update({
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