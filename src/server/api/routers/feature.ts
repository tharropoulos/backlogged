// BEGIN_COPILOT_CODE
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import {
  createFeatureSchema,
  updateFeatureSchema,
} from "~/lib/validations/feature";
import type { Feature, Game } from "@prisma/client";
import { type Result, Ok, Err } from "ts-results";
import { handlePrismaError } from "~/utils";

export const featureRouter = createTRPCRouter({
  getAll: publicProcedure.query(
    async ({ ctx }): Promise<Result<Array<Feature>, TRPCError>> => {
      const result: Result<Array<Feature>, TRPCError> = await ctx.prisma.feature
        .findMany()
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }
  ),

  // REWRITE_1: change get to getById
  //   get: publicProcedure
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<Result<Feature, TRPCError>> => {
      const result: Result<Feature, TRPCError> = await ctx.prisma.feature
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
                  message: "Feature not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Result<Feature, TRPCError>> => {
      const result: Result<Feature, TRPCError> = await ctx.prisma.feature
        .delete({
          where: { id: input.id },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  create: adminProcedure
    .input(createFeatureSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Feature, TRPCError>> => {
      const feature: Result<Feature, TRPCError> = await ctx.prisma.feature
        .create({
          data: {
            name: input.name,
            description: input.description,
            image: input.image,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return feature;
    }),

  update: adminProcedure
    .input(updateFeatureSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Feature, TRPCError>> => {
      const feature: Result<Feature, TRPCError> = await ctx.prisma.feature
        .update({
          where: { id: input.id },
          data: {
            name: input.name,
            description: input.description,
            image: input.image,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return feature;
    }),

  getGames: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }): Promise<Result<Array<Game>, TRPCError>> => {
      const result: Result<Array<Game>, TRPCError> = await ctx.prisma.feature
        .findUnique({
          where: {
            id: input.id,
          },
          select: {
            games: true,
          },
        })
        .then((res) => {
          return res
            ? Ok(res.games)
            : new Err(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Feature not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  addGames: adminProcedure
    .input(
      z.object({
        featureId: z.string(),
        gameIds: z.array(z.string()),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<Result<Feature & { games: Array<Game> }, TRPCError>> => {
        const result: Result<Feature & { games: Array<Game> }, TRPCError> =
          await ctx.prisma.feature
            .update({
              where: {
                id: input.featureId,
              },
              data: {
                games: {
                  connect: input.gameIds.map((id) => ({ id })),
                },
              },
              include: {
                games: true,
              },
            })
            .then((res) => Ok(res), handlePrismaError);

        return result;
      }
    ),

  removeGames: adminProcedure
    .input(
      z.object({
        featureId: z.string(),
        gameIds: z.array(z.string()),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<Result<Feature & { games: Array<Game> }, TRPCError>> => {
        const result: Result<Feature & { games: Array<Game> }, TRPCError> =
          await ctx.prisma.feature
            .update({
              where: {
                id: input.featureId,
              },
              data: {
                games: {
                  disconnect: input.gameIds.map((id) => ({ id })),
                },
              },
              include: {
                games: true,
              },
            })
            .then((res) => Ok(res), handlePrismaError);

        return result;
      }
    ),
});

// END_COPILOT_CODE
