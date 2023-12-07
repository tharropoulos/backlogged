// BEGIN_COPILOT_CODE
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  createReviewSchema,
  updateReviewSchema,
} from "~/lib/validations/review";
import type { Prisma, Review, ReviewLike } from "@prisma/client";
import { type Result, Ok, Err } from "ts-results";
import { handlePrismaError } from "~/utils";

export const reviewRouter = createTRPCRouter({
  getAll: publicProcedure.query(
    async ({ ctx }): Promise<Result<Array<Review>, TRPCError>> => {
      const result: Result<Array<Review>, TRPCError> = await ctx.prisma.review
        .findMany()
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }
  ),

  getById: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }): Promise<Result<Review, TRPCError>> => {
      const result: Result<Review, TRPCError> = await ctx.prisma.review
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
                  message: "Review not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  // REWRITE_2: add protectedProcedure
  //   create: publicProcedure
  create: protectedProcedure
    .input(createReviewSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Review, TRPCError>> => {
      const { gameId, ...rest } = input;
      const result: Result<Review, TRPCError> = await ctx.prisma.review
        .create({
          data: {
            // REVISION_1: Correctly connect the user and game to the review
            // content: input.content,
            // rating: input.rating,
            // REWRITE_1: use the correct userId from the session
            // userId: ctx.user.id,
            // userId: ctx.session.user.id,
            // gameId: input.gameId,
            ...rest,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            game: {
              connect: {
                id: gameId,
              },
            },
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  // END_COPILOT_CODE
  // BEGIN_NON_COPILOT_CODE
  // Copilot couldn't deal with the authorization

  update: protectedProcedure
    .input(updateReviewSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Review, TRPCError>> => {
      const { id, ...rest } = input;

      const whereClause: Prisma.ReviewWhereUniqueInput = {
        id: id,
      };

      whereClause.AND =
        ctx.session.user.role !== "Admin"
          ? { userId: ctx.session.user.id }
          : whereClause.AND;

      const result: Result<Review, TRPCError> = await ctx.prisma.review
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
  // END_NON_COPILOT_CODE

  // BEGIN_COPILOT_CODE
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .mutation(async ({ ctx, input }): Promise<Result<Review, TRPCError>> => {
      const whereClause: Prisma.ReviewWhereUniqueInput = {
        id: input.id,
      };

      whereClause.AND =
        ctx.session.user.role !== "Admin"
          ? { userId: ctx.session.user.id }
          : whereClause.AND;

      const result: Result<Review, TRPCError> = await ctx.prisma.review
        .delete({
          where: whereClause,
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
      }): Promise<Result<Review & { likes: Array<ReviewLike> }, TRPCError>> => {
        const result: Result<Review & { likes: Array<ReviewLike> }, TRPCError> =
          await ctx.prisma.review
            .update({
              where: { id: input.id },
              data: {
                // REWRITE_3: remove increment the likes by 1
                // likes: {
                //   increment: 1,
                // },
                likes: {
                  // END_COPILOT_CODE

                  // BEGIN_NON_COPILOT_CODE
                  // Copilot just tried creating a new user
                  create: [
                    // END_NON_COPILOT_CODE
                    // BEGIN_COPILOT_SUGGESTION
                    {
                      user: {
                        connect: {
                          id: ctx.session.user.id,
                        },
                      },
                    },
                    // END_COPILOT_SUGGESTION
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

  // BEGIN_COPILOT_CODE
  unlike: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<Result<Review & { likes: Array<ReviewLike> }, TRPCError>> => {
        const result: Result<Review & { likes: Array<ReviewLike> }, TRPCError> =
          await ctx.prisma.review
            .update({
              where: {
                id: input.id,
                likes: {
                  some: {
                    userId: ctx.session?.user.id,
                  },
                },
              },
              data: {
                likes: {
                  //REWRITE_4: use deleteMany
                  deleteMany: {
                    userId: ctx.session?.user.id,
                    reviewId: input.id,
                  },
                  //   delete: {
                  //     userId_reviewId: {
                  //       userId: ctx.session?.user.id,
                  //       reviewId: input.id,
                  //     },
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
  // END_COPILOT_CODE
});
