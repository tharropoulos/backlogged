// BEGIN_COPILOT_CODE
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

import {
  createDeveloperSchema,
  updateDeveloperSchema,
} from "~/lib/validations/developer";
import type { Game, Developer } from "@prisma/client";
import { type Result, Ok, Err } from "ts-results";
import { handlePrismaError } from "~/utils";

export const developerRouter = createTRPCRouter({
  // REWRITE_1: use proper trpc syntax
  //     developerRouter.merge('developers.', publicProcedure('getAll', {
  //   resolve: async ({ ctx }) => {
  //     const developers = await ctx.prisma.developer.findMany();
  //     return Ok(developers);
  //   },
  // }));
  getAll: publicProcedure.query(
    async ({ ctx }): Promise<Result<Array<Developer>, TRPCError>> => {
      const result: Result<
        Array<Developer>,
        TRPCError
      > = await ctx.prisma.developer
        .findMany()
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }
  ),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<Result<Developer, TRPCError>> => {
      const result: Result<Developer, TRPCError> = await ctx.prisma.developer
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
                  message: "Developer not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Result<Developer, TRPCError>> => {
      const result: Result<Developer, TRPCError> = await ctx.prisma.developer
        .delete({
          where: { id: input.id },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  create: adminProcedure
    // REWRITE_2: use developer instead of franchise
    .input(createDeveloperSchema)
    // .input(createFranchiseSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Developer, TRPCError>> => {
      // .mutation(async ({ ctx, input }): Promise<Result<Franchise, TRPCError>> => {
      //   const franchise: Result<Developer, TRPCError> = await ctx.prisma.franchise
      const developer: Result<Developer, TRPCError> = await ctx.prisma.developer
        .create({
          data: {
            name: input.name,
            description: input.description,
            image: input.image,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return developer;
    }),

  update: adminProcedure
    .input(updateDeveloperSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Developer, TRPCError>> => {
      const result: Result<Developer, TRPCError> = await ctx.prisma.developer
        .update({
          where: {
            id: input.id,
          },
          data: {
            name: input.name,
            description: input.description,
            image: input.image,
          },
        })
        .then((res) => Ok(res), handlePrismaError);
      return result;
    }),
  // END_COPILOT_CODE

  // BEGIN_NON_COPILOT_CODE
  getGames: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }): Promise<Result<Array<Game>, TRPCError>> => {
      const result: Result<Array<Game>, TRPCError> = await ctx.prisma.developer
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
            ? // BEGIN_COPILOT_CODE
              Ok(res.games)
            : // END_COPILOT_CODE
              new Err(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Developer not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),
  // END_NON_COPILOT_CODE

  // BEGIN_COPILOT_CODE
  addGames: adminProcedure
    .input(
      z.object({
        developerId: z.string(),
        gameIds: z.array(z.string()),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<Result<Developer & { games: Array<Game> }, TRPCError>> => {
        const result: Result<Developer & { games: Array<Game> }, TRPCError> =
          await ctx.prisma.developer
            .update({
              where: {
                id: input.developerId,
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
        developerId: z.string(),
        gameIds: z.array(z.string()),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<Result<Developer & { games: Array<Game> }, TRPCError>> => {
        const result: Result<Developer & { games: Array<Game> }, TRPCError> =
          await ctx.prisma.developer
            .update({
              where: {
                id: input.developerId,
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
  // END_COPILOT_CODE
});
