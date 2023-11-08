import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { type Result, Ok, Err } from "ts-results"; //NOTE: Written by myself
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { createReviewSchema } from "~/lib/validations/review"; // Copilot suggestion
import { type Review } from "@prisma/client"; // NOTE: Copilot suggestion
import { handlePrismaError } from "~/lib/utils";
//NOTE: Written by Copilot

export const reviewRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createReviewSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Review, TRPCError>> => {
      const result: Result<Review, TRPCError> = await ctx.prisma.review
        .create({
          data: {
            game: {
              connect: { id: input.gameId },
            },
            user: {
              connect: { id: ctx.session.user.id },
            },
            createdAt: new Date(), //NOTE: Written by Copilot
            updatedAt: new Date(), //NOTE: Suggested by Copilot
            content: input.content, //NOTE: Written by myself
            rating: input.rating,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<Result<Review, TRPCError>> => {
      const result: Result<Review, TRPCError> = await ctx.prisma.review
        .findUnique({
          where: {
            id: input.id,
          },
        })
        .then((res) => {
          if (!res) {
            return new Err(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Review not found",
              })
            );
          } else {
            return Ok(res);
          }
        }, handlePrismaError);

      return result;
    }),

  //NOTE: Written by myself
  getAll: publicProcedure.query(
    async ({ ctx }): Promise<Result<Array<Review>, TRPCError>> => {
      const result: Result<Array<Review>, TRPCError> = await ctx.prisma.review
        .findMany()
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }
  ),

  //NOTE: Suggested by Copilot
  update: protectedProcedure
    .input(createReviewSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Result<Review, TRPCError>> => {
      const result: Result<Review, TRPCError> = await ctx.prisma.review
        .update({
          where: { id: input.id, userId: ctx.session.user.id },
          data: {
            content: input.content,
            rating: input.rating,
            updatedAt: new Date(),
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  //NOTE: Suggested by Copilot
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Result<Review, TRPCError>> => {
      const result: Result<Review, TRPCError> = await ctx.prisma.review
        .delete({
          where: { id: input.id, userId: ctx.session.user.id },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  like: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Result<Review, TRPCError>> => {
      const result: Result<Review, TRPCError> = await ctx.prisma.review
        .update({
          where: { id: input.reviewId, userId: ctx.session.user.id },
          data: {
            likes: {
              deleteMany: {
                userId: ctx.session.user.id,
                reviewId: input.reviewId,
              },
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
        reviewId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Result<Review, TRPCError>> => {
      const result: Result<Review, TRPCError> = await ctx.prisma.review
        .update({
          where: {
            id: input.reviewId,
            userId: ctx.session.user.id,
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
});
