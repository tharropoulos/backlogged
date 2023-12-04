// BEGIN_COPILOT_CODE
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { createGenreSchema, updateGenreSchema } from "~/lib/validations/genre";
import type { Genre, Game } from "@prisma/client";
import { type Result, Ok, Err } from "ts-results";
import { handlePrismaError } from "~/utils";

export const genreRouter = createTRPCRouter({
  getAll: publicProcedure.query(
    async ({ ctx }): Promise<Result<Array<Genre>, TRPCError>> => {
      const result: Result<Array<Genre>, TRPCError> = await ctx.prisma.genre
        .findMany()
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }
  ),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<Result<Genre, TRPCError>> => {
      const result: Result<Genre, TRPCError> = await ctx.prisma.genre
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
                  message: "Genre not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Result<Genre, TRPCError>> => {
      const result: Result<Genre, TRPCError> = await ctx.prisma.genre
        .delete({
          where: { id: input.id },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  create: adminProcedure
    .input(createGenreSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Genre, TRPCError>> => {
      const genre: Result<Genre, TRPCError> = await ctx.prisma.genre
        .create({
          data: {
            name: input.name,
            description: input.description,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return genre;
    }),

  update: adminProcedure
    .input(updateGenreSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Genre, TRPCError>> => {
      const genre: Result<Genre, TRPCError> = await ctx.prisma.genre
        .update({
          where: { id: input.id },
          data: {
            name: input.name,
            description: input.description,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return genre;
    }),

  getGames: publicProcedure
    //REWRITE_1: use cuid2 instead of cuid
    // .input(z.object({ id: z.string().cuid() }))
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }): Promise<Result<Array<Game>, TRPCError>> => {
      const result: Result<Array<Game>, TRPCError> = await ctx.prisma.genre
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
                  message: "Genre not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  addGames: adminProcedure
    .input(
      z.object({
        genreId: z.string(),
        gameIds: z.array(z.string()),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<Result<Genre & { games: Array<Game> }, TRPCError>> => {
        const result: Result<Genre & { games: Array<Game> }, TRPCError> =
          await ctx.prisma.genre
            .update({
              where: {
                id: input.genreId,
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
        genreId: z.string(),
        gameIds: z.array(z.string()),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<Result<Genre & { games: Array<Game> }, TRPCError>> => {
        const result: Result<Genre & { games: Array<Game> }, TRPCError> =
          await ctx.prisma.genre
            .update({
              where: {
                id: input.genreId,
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
