//NOTE: Written in part by Copilot chat
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { createGameSchema, gameSchema } from "~/lib/validations/game";
type SelectFields = {
  coverImage?: boolean;
  id: boolean;
  name: boolean;
  description: boolean;
};

export const gameRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const res = await ctx.prisma.game.findMany();
    return res;
  }), //NOTE: Written by Copilot

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.game.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      return res;
    }), //NOTE: Written by Copilot

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.game.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      try {
        const res = await ctx.prisma.game.delete({
          where: {
            id: input.id,
          },
        });

        return res;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting game",
        }); //NOTE: Written by Copilot
      }
    }),

  create: protectedProcedure
    .input(createGameSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const game = await ctx.prisma.game.create({
          data: {
            backgroundImage: input.backgroundImage,
            description: input.description,
            name: input.name,
            releaseDate: input.releaseDate,
            coverImage: input.coverImage,
            franchise: {
              connect: {
                id: input.franchiseId,
              },
            },
            publisher: {
              connect: {
                id: input.publisherId,
              },
            },
          },
        });

        return game;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating game",
        });
      }
    }), //NOTE: Written by Copilot

  update: protectedProcedure
    .input(gameSchema)
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.game.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }
      //NOTE: Written by myself

      try {
        const game = await ctx.prisma.game.update({
          where: {
            id: input.id,
          },
          data: {
            ...input,
          },
        });

        return game;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error updating game",
        });
      }
    }),
  // const game = await ctx.prisma.game.update({ //NOTE: Written by Copilot
  //   where: {
  //     id: input.id,
  //   },
  //   data: {
  //     ...input,
  //   },
  // });

  // return game;

  getDevelopers: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.game.findUnique({
        where: {
          id: input.id,
        },
        select: {
          developers: true,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      if (!res.developers) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Developers not found",
        });
      }

      //NOTE: Written by myself
      return res;
    }),

  getFeatures: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.game.findUnique({
        where: {
          id: input.id,
        },
        select: {
          features: true,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      if (!res.features) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Features not found",
        });
      }

      //NOTE: Written by myself
      return res;
    }),

  //NOTE: Written by Copilot
  getGenres: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.game.findUnique({
        where: {
          id: input.id,
        },
        select: {
          genres: true,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      if (!res.genres) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Genres not found",
        });
      }

      //NOTE: Written by myself
      return res;
    }),

  //NOTE: Written by Copilot
  getPlatforms: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.game.findUnique({
        where: {
          id: input.id,
        },
        //NOTE: Written by myself
        include: {
          platforms: {
            include: {
              platform: true,
            },
          },
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      if (!res.platforms) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platforms not found",
        });
      }

      //NOTE: Written by myself
      return res.platforms.map((platform) => platform.platform);
    }),

  //NOTE: Written by myself
  getReviews: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.game.findUnique({
        where: {
          id: input.id,
        },
        select: {
          reviews: true,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      if (!res.reviews) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reviews not found",
        });
      }

      return res;
    }),

  getPublisher: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.game.findUnique({
        where: {
          id: input.id,
        },
        select: {
          publisher: true,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      if (!res.publisher) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Publisher not found",
        });
      }

      return res;
    }),

  getFranchise: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.game.findUnique({
        where: {
          id: input.id,
        },
        select: {
          franchise: true,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      if (!res.franchise) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Franchise not found",
        });
      }

      return res;
    }),

  getDetails: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const selectFields: SelectFields = {
        id: true,
        name: true,
        description: true,
      };

      const game = await ctx.prisma.game.findUnique({
        where: {
          id: input.id,
        },
        include: {
          _count: { select: { reviews: true } },
          developers: { select: selectFields },
          features: { select: selectFields },
          publisher: { select: selectFields },
          franchise: { select: selectFields },
          genres: { select: selectFields },
          platforms: {
            select: {
              storeLink: true,
              platform: {
                select: selectFields,
              },
            },
          },
          reviews: {
            take: 5,
            orderBy: { likes: { _count: "desc" } },
            select: {
              content: true,
              rating: true,
              user: {
                select: {
                  name: true,
                  image: true,
                  id: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
        },
      });

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      return game;
    }),
});
