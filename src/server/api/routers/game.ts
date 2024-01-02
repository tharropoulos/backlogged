// BEGIN_COPILOT_CODE
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { createGameSchema, updateGameSchema } from "~/lib/validations/game";
import type { Omit } from "~/utils";
import {
  Prisma,
  type Developer,
  type Feature,
  type Franchise,
  type Game,
  type GameToPlatform,
  type Genre,
  type Platform,
  type Publisher,
  type Review,
  type User,
} from "@prisma/client";
import { type Result, Ok, Err } from "ts-results";
import { handlePrismaError } from "~/utils";

export interface GameToPlatformDetails extends GameToPlatform {
  platform?: Platform;
  game?: Game;
}

interface ReviewContext extends Pick<Review, "content" | "rating"> {
  _count: { likes: number; comments: number };
  user: Pick<User, "name" | "image" | "id">;
}

export interface GameDetails extends Omit<Game, "franchiseId" | "publisherId"> {
  _count: { reviews: number };
  developers: Array<Omit<Developer, "image">>;
  features: Array<Omit<Feature, "image">>;
  genres: Array<Genre>;
  platforms: Array<{
    storeLink: string;
    platform: Omit<Platform, "image">;
  }>;
  franchise: Omit<Franchise, "image">;
  publisher: Omit<Publisher, "image">;
  reviews?: Array<ReviewContext>;
}

export const gameRouter = createTRPCRouter({
  getAll: publicProcedure.query(
    async ({ ctx }): Promise<Result<Array<Game>, TRPCError>> => {
      const result: Result<Array<Game>, TRPCError> = await ctx.prisma.game
        .findMany()
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }
  ),

  getById: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }): Promise<Result<Game, TRPCError>> => {
      const result: Result<Game, TRPCError> = await ctx.prisma.game
        .findUnique({
          where: {
            id: input.id,
          },
        })
        .then((res) => {
          return res
            ? Ok(res)
            : new Err(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Game not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .mutation(async ({ ctx, input }): Promise<Result<Game, TRPCError>> => {
      const result: Result<Game, TRPCError> = await ctx.prisma.game
        .delete({
          where: { id: input.id },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  create: adminProcedure
    .input(createGameSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Game, TRPCError>> => {
      const game: Result<Game, TRPCError> = await ctx.prisma.game
        .create({
          data: {
            name: input.name,
            description: input.description,
            coverImage: input.coverImage,
            backgroundImage: input.backgroundImage,
            releaseDate: input.releaseDate,
            // REVISION_1: use publisher and franchise instead of publisherId and franchiseId
            // publisherId: input.publisherId,
            // franchiseId: input.franchiseId,
            publisher: {
              connect: {
                id: input.publisherId,
              },
            },
            franchise: {
              connect: {
                id: input.franchiseId,
              },
            },
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return game;
    }),

  update: adminProcedure
    .input(updateGameSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Game, TRPCError>> => {
      const game: Result<Game, TRPCError> = await ctx.prisma.game
        .update({
          where: { id: input.id },
          data: {
            name: input.name,
            description: input.description,
            coverImage: input.coverImage,
            backgroundImage: input.backgroundImage,
            releaseDate: input.releaseDate,
            franchiseId: input.franchiseId,
            publisherId: input.publisherId,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return game;
    }),
  // END_COPILOT_CODE
  // BEGIN_NONE_COPILOT_CODE
  // Copilot couldn't generate a working implementation for getDevelopers after
  // 3 requests

  getDevelopers: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(
      async ({ ctx, input }): Promise<Result<Array<Developer>, TRPCError>> => {
        const result: Result<
          Array<Developer>,
          TRPCError
        > = await ctx.prisma.game
          .findUnique({
            where: {
              id: input.id,
            },
            select: {
              developers: true,
            },
          })
          .then((res) => {
            return res
              ? Ok(res.developers)
              : new Err(
                  new TRPCError({
                    code: "NOT_FOUND",
                    message: "Game not found",
                  })
                );
          }, handlePrismaError);

        return result;
      }
    ),
  // END_NONE_COPILOT_CODE

  // BEGIN_COPILOT_CODE
  getGenres: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }): Promise<Result<Array<Genre>, TRPCError>> => {
      const result: Result<Array<Genre>, TRPCError> = await ctx.prisma.game
        .findUnique({
          where: {
            id: input.id,
          },
          select: {
            genres: true,
          },
        })
        .then((res) => {
          return res
            ? Ok(res.genres)
            : new Err(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Game not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  getFeatures: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(
      async ({ ctx, input }): Promise<Result<Array<Feature>, TRPCError>> => {
        const result: Result<Array<Feature>, TRPCError> = await ctx.prisma.game
          .findUnique({
            where: {
              id: input.id,
            },
            select: {
              features: true,
            },
          })
          .then((res) => {
            return res
              ? Ok(res.features)
              : new Err(
                  new TRPCError({
                    code: "NOT_FOUND",
                    message: "Game not found",
                  })
                );
          }, handlePrismaError);

        return result;
      }
    ),

  getPlatforms: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(
      async ({
        ctx,
        input,
      }): Promise<Result<Array<GameToPlatformDetails>, TRPCError>> => {
        // END_COPILOT_CODE

        // BEGIN_NON_COPILOT_CODE
        // Copilot can't find the correct return type
        const result: Result<
          Array<GameToPlatformDetails>,
          TRPCError
        > = await ctx.prisma.game
          // END_NON_COPILOT_CODE
          // BEGIN_COPILOT_CODE
          .findUnique({
            where: { id: input.id },
            select: {
              // REWRITE_1: use platforms instead of gameToPlatforms
              // gameToPlatforms: {
              platforms: {
                include: {
                  platform: true,
                },
              },
            },
          })
          .then((res) => {
            return res
              ? Ok(res.platforms)
              : new Err(
                  new TRPCError({
                    code: "NOT_FOUND",
                    message: "Game not found",
                  })
                );
          }, handlePrismaError);

        return result;
      }
    ),

  getFranchise: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }): Promise<Result<Franchise, TRPCError>> => {
      const result: Result<Franchise, TRPCError> = await ctx.prisma.game
        .findUnique({
          where: { id: input.id },
          select: { franchise: true },
        })
        .then((res) => {
          return res
            ? Ok(res.franchise)
            : new Err(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Game not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  getPublisher: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }): Promise<Result<Publisher, TRPCError>> => {
      const result: Result<Publisher, TRPCError> = await ctx.prisma.game
        .findUnique({
          where: { id: input.id },
          select: { publisher: true },
        })
        .then((res) => {
          return res
            ? Ok(res.publisher)
            : new Err(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Game not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  getReviews: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(
      async ({ ctx, input }): Promise<Result<Array<Review>, TRPCError>> => {
        const result: Result<Array<Review>, TRPCError> = await ctx.prisma.game
          .findUnique({
            where: { id: input.id },
            select: { reviews: true },
          })
          .then((res) => {
            return res
              ? Ok(res.reviews)
              : new Err(
                  new TRPCError({
                    code: "NOT_FOUND",
                    message: "Game not found",
                  })
                );
          }, handlePrismaError);

        return result;
      }
    ),
  // END_COPILOT_CODE
  // BEGIN_NON_COPILOT_CODE
  // The following query wasn't generated by Copilot after 3 requests
  getDetails: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }): Promise<Result<GameDetails, TRPCError>> => {
      const includeOptions = Prisma.validator<Prisma.GameSelect>()({
        _count: { select: { reviews: true } },
        developers: { select: { id: true, name: true, description: true } },
        features: { select: { id: true, name: true, description: true } },
        genres: { select: { id: true, name: true, description: true } },
        franchise: { select: { id: true, name: true, description: true } },
        publisher: { select: { id: true, name: true, description: true } },
        platforms: {
          select: {
            storeLink: true,
            platform: { select: { id: true, name: true, description: true } },
          },
        },
        reviews: {
          take: 4,
          orderBy: { likes: { _count: "desc" } },
          select: {
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
            id: true,
            content: true,
            rating: true,
            user: {
              select: {
                name: true,
                image: true,
                id: true,
              },
            },
          },
        },
      });

      const result: Result<GameDetails, TRPCError> = await ctx.prisma.game
        .findUnique({
          where: {
            id: input.id,
          },
          select: {
            backgroundImage: true,
            coverImage: true,
            description: true,
            id: true,
            name: true,
            releaseDate: true,
            ...includeOptions,
          },
        })
        .then((res) => {
          return res
            ? Ok(res)
            : new Err(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Game not found",
                })
              );
        });

      return result;
    }),
});
