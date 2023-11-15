import { TRPCError } from "@trpc/server";
import { type Result, Ok, Err } from "ts-results";
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

  create: protectedProcedure //NOTE: Copilot firstly used "publicProcedure" here, but it's a mistake
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        visibility: z.enum(["PUBLIC", "PRIVATE", "FOLLOWERS_ONLY"]),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        .create({
          data: {
            type: "CUSTOM",
            user: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            visibility: input.visibility,
            createdAt: new Date(),
            updatedAt: new Date(),
            description: input.description,
            name: input.name,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  //NOTE: Copilot suggestion
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        name: z.string(),
        description: z.string(),
        visibility: z.enum(["PUBLIC", "PRIVATE", "FOLLOWERS_ONLY"]),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        .update({
          where: {
            id: input.id,
          },
          data: {
            visibility: input.visibility,
            description: input.description,
            name: input.name,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  //NOTE:  Copilot suggestion
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        //NOTE: had to write myself to use softDeletion
        .softDelete({
          where: {
            id: input.id,
            userId: ctx.session.user.id,
            type: "CUSTOM",
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  addGames: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().cuid2(),
        gameIds: z.array(z.string().cuid2()),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        .update({
          where: {
            id: input.playlistId,
            //NOTE: had to write myself to check if user is owner of playlist
            userId: ctx.session.user.id,
          },
          data: {
            games: {
              //NOTE: Written by myself
              create: input.gameIds.map((gameId) => ({
                game: {
                  connect: {
                    id: gameId,
                  },
                },
                addedAt: new Date(),
              })),
            },
          },
          include: {
            games: true,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  //NOTE: Copilot suggestion
  removeGames: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().cuid2(),
        gameIds: z.array(z.string().cuid2()),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      // Check if all games exist and are in the playlist
      const playlistGames = await ctx.prisma.gameToPlaylist.findMany({
        where: {
          gameId: {
            in: input.gameIds,
          },
          playlistId: input.playlistId,
        },
      });

      if (playlistGames.length !== input.gameIds.length) {
        return Err(
          new TRPCError({
            message:
              "One or more games do not exist or are not in the playlist",
            code: "BAD_REQUEST",
          })
        );
      }
      const result = await ctx.prisma.playlist
        .update({
          where: {
            id: input.playlistId,
            userId: ctx.session.user.id,
          },
          data: {
            games: {
              deleteMany: input.gameIds.map((gameId) => ({
                gameId: {
                  equals: gameId,
                },
              })),
            },
          },
          include: {
            games: true,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  like: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      //NOTE: Copilot suggestion
      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        .update({
          where: { id: input.id },
          include: {
            likes: true,
          },
          data: {
            likes: {
              create: [
                {
                  user: {
                    connect: { id: ctx.session.user.id },
                  },
                },
              ],
            },
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  unlike: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      //NOTE: Copilot suggestion
      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        .update({
          where: {
            id: input.id,
            likes: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
          data: {
            likes: {
              deleteMany: {
                userId: ctx.session.user.id,
              },
            },
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  //NOTE: Copilot suggestion
  // addTrack: protectedProcedure
  //   .input(
  //     z.object({
  //       playlistId: z.string(),
  //       trackId: z.string(),
  //     })
  //   )
  //   .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
  //     const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
  //       .update({
  //         where: {
  //           id: input.playlistId,
  //         },
  //         data: {
  //           tracks: {
  //             connect: {
  //               id: input.trackId,
  //             },
  //           },
  //         },
  //       })
  //       .then((res) => Ok(res), handlePrismaError);

  //     return result;
  //   }),
});
