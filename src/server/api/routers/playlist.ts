import { TRPCError } from "@trpc/server";
import { type Result, Ok, Err } from "ts-results";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { Playlist } from "@prisma/client";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import type { Prisma, Playlist } from "@prisma/client";
import { handlePrismaError } from "~/lib/utils";
import { z } from "zod";

export const playlistRouter = createTRPCRouter({
  getAll: publicProcedure.query(
    async ({ ctx }): Promise<Result<Array<Playlist>, TRPCError>> => {
      const userId = ctx.session?.user?.id;

      const whereClause: Prisma.PlaylistWhereInput = {
        OR: [
          {
            visibility: "PUBLIC",
          },
        ],
      };

      if (userId) {
        whereClause.OR?.push(
          {
            userId: userId,
          },
          {
            visibility: "FOLLOWERS_ONLY",
            user: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          }
        );
      }

      const result: Result<
        Array<Playlist>,
        TRPCError
      > = await ctx.prisma.playlist
        .findMany({ where: whereClause })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }
  ),

  getById: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      const userId = ctx.session?.user?.id;

      const whereClause: Prisma.PlaylistWhereInput = {
        id: input.id,
        OR: [
          {
            visibility: "PUBLIC",
          },
        ],
      };

      if (userId) {
        whereClause.OR?.push(
          {
            userId: userId,
          },
          {
            visibility: "FOLLOWERS_ONLY",
            user: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          }
        );
      }

      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        .findFirst({
          where: whereClause,
        })
        .then((res) => {
          return res
            ? Ok(res)
            : new Err(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Playlist not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      //NOTE: Copilot Suggestion
      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        .create({
          data: {
            name: input.name,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  //NOTE: Copilot Suggestion
  update: publicProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      //NOTE: Copilot Suggestion
      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        .update({
          where: {
            id: input.id,
          },
          data: {
            name: input.name,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  //NOTE: Copilot Suggestion
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      //NOTE: Copilot Suggestion
      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        .delete({
          where: {
            id: input.id,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  //NOTE: Copilot Suggestion
  addSong: publicProcedure
    .input(z.object({ playlistId: z.string(), songId: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      //NOTE: Copilot Suggestion
      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        .update({
          where: {
            id: input.playlistId,
          },
          data: {
            songs: {
              connect: {
                id: input.songId,
              },
            },
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  //NOTE: Copilot Suggestion
});
