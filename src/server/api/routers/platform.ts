// BEGIN_COPILOT_CODE
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import {
  createPlatformSchema,
  updatePlatformSchema,
} from "~/lib/validations/platform";
import type { Platform, Game, GameToPlatform } from "@prisma/client";
import { type Result, Ok, Err } from "ts-results";
import { handlePrismaError } from "~/utils";

export const platformRouter = createTRPCRouter({
  getAll: publicProcedure.query(
    async ({ ctx }): Promise<Result<Array<Platform>, TRPCError>> => {
      const result: Result<
        Array<Platform>,
        TRPCError
      > = await ctx.prisma.platform
        .findMany()
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }
  ),

  getById: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }): Promise<Result<Platform, TRPCError>> => {
      const result: Result<Platform, TRPCError> = await ctx.prisma.platform
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
                  message: "Platform not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .mutation(async ({ ctx, input }): Promise<Result<Platform, TRPCError>> => {
      const result: Result<Platform, TRPCError> = await ctx.prisma.platform
        .delete({
          where: { id: input.id },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  create: adminProcedure
    .input(createPlatformSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Platform, TRPCError>> => {
      const platform: Result<Platform, TRPCError> = await ctx.prisma.platform
        .create({
          data: {
            name: input.name,
            description: input.description,
            image: input.image,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return platform;
    }),

  update: adminProcedure
    .input(updatePlatformSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Platform, TRPCError>> => {
      const platform: Result<Platform, TRPCError> = await ctx.prisma.platform
        .update({
          where: { id: input.id },
          data: {
            name: input.name,
            description: input.description,
            image: input.image,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return platform;
    }),

  // END_COPILOT_CODE

  // BEGIN_NON_COPILOT_CODE
  // Explicit prisma relations are hard to work with, copilot struggles with them
  getGames: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(
      async ({
        ctx,
        input,
      }): Promise<
        Result<Array<GameToPlatform & { game: Game }>, TRPCError>
      > => {
        const result: Result<
          Array<GameToPlatform & { game: Game }>,
          TRPCError
        > = await ctx.prisma.platform
          .findUnique({
            where: {
              id: input.id,
            },
            select: {
              games: {
                include: {
                  game: true,
                },
              },
            },
          })
          .then((res) => {
            return res
              ? Ok(res.games)
              : new Err(
                  new TRPCError({
                    code: "NOT_FOUND",
                    message: "Platform not found",
                  })
                );
          }, handlePrismaError);

        return result;
      }
    ),

  addGames: adminProcedure
    .input(
      z.object({
        platformId: z.string().cuid2(),
        games: z.array(
          z.object({ id: z.string().cuid2(), storeLink: z.string().max(255) })
        ),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<
        Result<
          Platform & { games: Array<GameToPlatform & { game: Game }> },
          TRPCError
        >
      > => {
        const result: Result<
          Platform & { games: Array<GameToPlatform & { game: Game }> },
          TRPCError
        > = await ctx.prisma.platform
          .update({
            where: {
              id: input.platformId,
            },
            data: {
              games: {
                create: input.games.map((game) => ({
                  game: {
                    connect: { id: game.id },
                  },
                  storeLink: game.storeLink,
                })),
              },
            },
            include: {
              games: {
                include: {
                  game: true,
                },
              },
            },
          })
          .then((res) => Ok(res), handlePrismaError);

        return result;
      }
    ),

  // END_NON_COPILOT_CODE
  // BEGIN_COPILOT_SUGGESTION
  removeGames: adminProcedure
    .input(
      z.object({
        platformId: z.string().cuid2(),
        gameIds: z.array(z.string().cuid2()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result: Result<
        Platform & { games: Array<GameToPlatform & { game: Game }> },
        TRPCError
      > = await ctx.prisma.platform
        .update({
          where: {
            id: input.platformId,
          },
          data: {
            games: {
              deleteMany: input.gameIds.map((gameId) => ({ gameId: gameId })),
            },
          },
          include: {
            games: {
              include: {
                game: true,
              },
            },
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),
});
// END_COPILOT_SUGGESTION
