import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { createGenreSchema, genreSchema } from "~/lib/validations/genre";

export const genreRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const res = await ctx.prisma.genre.findMany();
    return res;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.genre.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Genre not found",
        });
      }
      return res;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.genre.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Genre not found",
        });
      }
      try {
        const res = await ctx.prisma.genre.delete({
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
    .input(createGenreSchema)
    .mutation(async ({ ctx, input }) => {
      const genre = await ctx.prisma.genre.create({
        data: {
          name: input.name,
          description: input.description,
        },
      });
      return genre;
    }),

  update: protectedProcedure
    .input(genreSchema)
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.genre.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Genre not found",
        });
      }

      try {
        const genre = await ctx.prisma.genre.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.name,
            description: input.description,
          },
        });
        return genre;
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
      const res = await ctx.prisma.genre.findUnique({
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
          message: "Genre not found",
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
      const instance = await ctx.prisma.genre.findUnique({
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
          message: "Genre not found",
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
            message: "Game already linked to Genre",
          });
        }
      }

      const res = await ctx.prisma.genre.update({
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

      const instance = await ctx.prisma.genre.findUnique({
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
          message: "Genre not found",
        });
      }

      if (instance.games.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No games for Genre",
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
            message: "Game not linked to Genre",
          });
        }
      }

      const res = await ctx.prisma.genre.update({
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
