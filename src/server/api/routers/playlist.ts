// BEGIN_COPILOT_CODE
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { createPlaylistSchema } from "~/lib/validations/playlist";
import {
  Prisma,
  Playlist,
  PlaylistLike,
  Game,
  GameToPlaylist,
  User,
} from "@prisma/client";
import { type Result, Ok, Err } from "ts-results";
import { handlePrismaError } from "~/utils";
type PlaylistDetails = Playlist & {
  user: Pick<User, "id" | "name" | "image">;
  games: Array<GameToPlaylist & { game: Game }>;
};
type PlaylistWithGames = Playlist & {
  games: Array<GameToPlaylist & { game: Game }>;
};

export const playlistRouter = createTRPCRouter({
  getAll: publicProcedure.query(
    async ({ ctx }): Promise<Result<Array<Playlist>, TRPCError>> => {
      const whereClause: Prisma.PlaylistWhereInput = {
        deleted: null,
        OR: [{ visibility: "PUBLIC" }],
      };

      if (ctx.session?.user?.id) {
        (whereClause.OR as Prisma.PlaylistWhereInput[]).push(
          // REWRITE_2: use user relation instead of userId
          // {userId: ctx.session.user.id},
          { user: { id: ctx.session.user.id } },
          {
            visibility: "FOLLOWERS_ONLY",
            user: {
              followers: { some: { follower: { id: ctx.session.user.id } } },
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
      const whereClause: Prisma.PlaylistWhereInput = {
        id: input.id,
        deleted: null,
        OR: [{ visibility: "PUBLIC" }],
      };

      if (ctx.session?.user?.id) {
        (whereClause.OR as Prisma.PlaylistWhereInput[]).push(
          // REWRITE_2: use user relation instead of userId
          // {userId: ctx.session.user.id},
          { user: { id: ctx.session.user.id } },
          {
            visibility: "FOLLOWERS_ONLY",
            // END_COPILOT_CODE
            // BEGIN_NON_COPILOT_CODE
            // Copilot didn't find the bug
            // user: { followers: { some: { id: ctx.session.user.id } } },
            user: {
              followers: { some: { follower: { id: ctx.session.user.id } } },
            },
            // END_NON_COPILOT_CODE
            // BEGIN_COPILOT_CODE
          }
        );
      }

      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        // REWRITE_1: use findfirst instead of findUnique
        // .findUnique({ where: whereClause })
        .findFirst({ where: whereClause })
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

  create: protectedProcedure
    .input(createPlaylistSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        .create({
          data: {
            ...input,
            type: "CUSTOM",
            // REWRITE_2: use user relation instead of userId
            // {userId: ctx.session.user.id},
            user: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        visibility: z.enum(["PUBLIC", "PRIVATE", "FOLLOWERS_ONLY"]).optional(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      const { id, ...rest } = input;
      const whereClause: Prisma.PlaylistWhereUniqueInput = {
        id: id,
        // REWRITE_3: add deleted: null to where clause
        deleted: null,
      };

      if (ctx.session.user.role !== "Admin") {
        // REWRITE_2: use user relation instead of userId
        // whereClause.userId = ctx.session.user.id;
        whereClause.user = { id: ctx.session.user.id };
      }

      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        .update({
          where: whereClause,
          data: {
            ...rest,
            updatedAt: new Date(),
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .mutation(async ({ ctx, input }): Promise<Result<Playlist, TRPCError>> => {
      const whereClause: Prisma.PlaylistWhereUniqueInput = {
        id: input.id,
        // REWRITE_3: add deleted: null to where clause
        deleted: null,
      };

      if (ctx.session.user.role !== "Admin") {
        whereClause.userId = ctx.session.user.id;
      }

      const result: Result<Playlist, TRPCError> = await ctx.prisma.playlist
        .update({
          where: whereClause,
          data: {
            deleted: new Date(),
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  like: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<
        Result<Playlist & { likes: Array<PlaylistLike> }, TRPCError>
      > => {
        const result: Result<
          Playlist & { likes: Array<PlaylistLike> },
          TRPCError
        > = await ctx.prisma.playlist
          .update({
            where: { id: input.id, deleted: null },
            data: {
              likes: {
                create: [
                  {
                    user: {
                      connect: {
                        id: ctx.session.user.id,
                      },
                    },
                  },
                ],
              },
            },
            include: {
              likes: true,
            },
          })
          .then((res) => Ok(res), handlePrismaError);

        return result;
      }
    ),

  unlike: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<
        Result<Playlist & { likes: Array<PlaylistLike> }, TRPCError>
      > => {
        const result: Result<
          Playlist & { likes: Array<PlaylistLike> },
          TRPCError
        > = await ctx.prisma.playlist
          .update({
            where: {
              id: input.id,
              deleted: null,
              likes: {
                some: {
                  userId: ctx.session?.user.id,
                },
              },
            },
            data: {
              likes: {
                deleteMany: {
                  userId: ctx.session?.user.id,
                  playlistId: input.id,
                },
              },
            },
            include: {
              likes: true,
            },
          })
          .then((res) => Ok(res), handlePrismaError);

        return result;
      }
    ),

  addGames: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        gameIds: z.array(z.string().cuid2()),
      })
    )
    .mutation(
      async ({ ctx, input }): Promise<Result<PlaylistWithGames, TRPCError>> => {
        const highestOrderResult = await ctx.prisma.gameToPlaylist
          .aggregate({
            _max: {
              order: true,
            },
            where: {
              playlist: { id: input.id },
            },
          })
          .then((res) => Ok(res), handlePrismaError);

        if (highestOrderResult.ok === false) return highestOrderResult;

        const highestOrder = highestOrderResult.val._max.order ?? 0;

        const result: Result<PlaylistWithGames, TRPCError> =
          await ctx.prisma.playlist
            .update({
              where: { id: input.id, deleted: null },
              data: {
                games: {
                  create: input.gameIds.map((gameId, index) => ({
                    // REWRITE_4: add addedAt
                    order:
                      highestOrder === 0
                        ? highestOrder + index
                        : highestOrder + index + 1,
                    addedAt: new Date(),
                    game: {
                      connect: { id: gameId },
                    },
                  })),
                },
                updatedAt: new Date(),
              },
              include: {
                games: {
                  orderBy: {
                    order: "asc",
                  },
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

  // END_COPILOT_CODE
  // BEGIN_NON_COPILOT_CODE
  // Really tricky for copilot to get right
  updateOrder: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        gameId: z.string().cuid2(),
        order: z.number().int(),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<
        Result<
          Playlist & { games: Array<GameToPlaylist & { game: Game }> },
          TRPCError
        >
      > => {
        const whereClause = Prisma.validator<Prisma.PlaylistWhereInput>()({
          id: input.id,
          deleted: null,
          user: { id: ctx.session.user.id },
        });

        const oldOrder = await ctx.prisma.gameToPlaylist
          .findUnique({
            where: {
              gameId_playlistId: {
                gameId: input.gameId,
                playlistId: input.id,
              },
            },
            select: { order: true },
          })
          .then((res) => Ok(res), handlePrismaError);

        if (!oldOrder.ok) return oldOrder;

        const increment = ctx.prisma.playlist.update({
          where: whereClause,
          data: {
            games: {
              updateMany: {
                where: {
                  order: {
                    gte: input.order,
                  },
                },
                data: {
                  order: {
                    increment: 1,
                  },
                },
              },
            },
          },
        });

        const decrement = ctx.prisma.playlist.update({
          where: whereClause,
          data: {
            games: {
              updateMany: {
                where: {
                  order: {
                    lte: input.order,
                  },
                },
                data: {
                  order: {
                    decrement: 1,
                  },
                },
              },
            },
          },
        });

        const update = ctx.prisma.playlist.update({
          where: whereClause,
          data: {
            games: {
              update: {
                where: {
                  gameId_playlistId: {
                    gameId: input.gameId,
                    playlistId: input.id,
                  },
                },
                data: {
                  order: input.order,
                },
              },
            },
          },
          include: {
            games: {
              orderBy: {
                order: "asc",
              },
              include: {
                game: true,
              },
            },
          },
        });

        switch (true) {
          case oldOrder instanceof Ok &&
            oldOrder.val instanceof Object &&
            typeof oldOrder.val.order === "number":
            const result: Result<
              Playlist & { games: Array<GameToPlaylist & { game: Game }> },
              TRPCError
            > =
              oldOrder.val.order > input.order
                ? await ctx.prisma
                    .$transaction([increment, update])
                    .then((res) => Ok(res[1]), handlePrismaError)
                : await ctx.prisma
                    .$transaction([decrement, update])
                    .then((res) => Ok(res[1]), handlePrismaError);
            return result;
          default:
            return new Err(new TRPCError({ code: "INTERNAL_SERVER_ERROR" }));
        }
      }
    ),
  // END_NON_COPILOT_CODE

  // BEGIN_COPILOT_CODE
  removeGames: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        gameIds: z.array(z.string().cuid2()),
      })
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<
        Result<
          Playlist & { games: Array<GameToPlaylist & { game: Game }> },
          TRPCError
        >
      > => {
        const result: Result<
          // REWRITE_6: proper return type
          Playlist & { games: Array<GameToPlaylist & { game: Game }> },
          TRPCError
        > = await ctx.prisma.playlist
          .update({
            where: {
              id: input.id,
              // MANUAL_REWRITE: check for ownership
              user: { id: ctx.session.user.id },
              deleted: null,
              // MANUAL_REWRITE: check for games in playlist
              games: { some: { gameId: { in: input.gameIds } } },
            },
            data: {
              // REWRITE_7: use games instead of gameToPlaylists
              // gameToPlaylists: {
              games: {
                deleteMany: input.gameIds.map((gameId) => ({ gameId: gameId })),
              },
              updatedAt: new Date(),
            },
            include: {
              // REWRITE_8: include game
              games: {
                include: {
                  game: true,
                },
                orderBy: {
                  order: "asc",
                },
              },
            },
          })
          .then((res) => Ok(res), handlePrismaError);

        return result;
      }
    ),

  getDetails: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(
      async ({ ctx, input }): Promise<Result<PlaylistDetails, TRPCError>> => {
        const whereClause: Prisma.PlaylistWhereInput = {
          id: input.id,
          deleted: null,
          OR: [{ visibility: "PUBLIC" }],
        };

        if (ctx.session?.user?.id) {
          (whereClause.OR as Prisma.PlaylistWhereInput[]).push(
            { user: { id: ctx.session.user.id } },
            {
              visibility: "FOLLOWERS_ONLY",
              user: { followers: { some: { id: ctx.session.user.id } } },
            }
          );
        }

        const result: Result<PlaylistDetails, TRPCError> =
          await ctx.prisma.playlist
            .findFirst({
              where: whereClause,
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
                games: {
                  include: {
                    game: true,
                  },
                },
              },
            })
            .then((res) => {
              return res
                ? Ok(res)
                : Err(
                    new TRPCError({
                      code: "NOT_FOUND",
                      message: "Playlist not found",
                    })
                  );
            }, handlePrismaError);

        return result;
      }
    ),
});

// END_COPILOT_CODE
