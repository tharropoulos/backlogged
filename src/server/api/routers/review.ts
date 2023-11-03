import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { createReviewSchema } from "~/lib/validations/review"; // Copilot suggestion
//NOTE: Written by Copilot

export const reviewRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createReviewSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const res = await ctx.prisma.review.create({
          data: {
            ...input,
            game: {
              connect: { id: input.gameId },
            },
            user: {
              connect: { id: input.userId },
            },
          },
        });
        return res;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const res = await ctx.prisma.review.findUnique({
          where: {
            id: input.id,
          },
        });

        if (!res) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Review not found",
          });
        }

        return res;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    try {
      const res = await ctx.prisma.review.findMany();
      return res;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }),

  update: protectedProcedure
    .input(createReviewSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const res = await ctx.prisma.review.update({
          where: { id: input.id },
          data: input,
        });
        return res;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const res = await ctx.prisma.review.delete({
          where: { id: input.id },
        });
        return res;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  like: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const res = await ctx.prisma.reviewLike.create({
          data: {
            review: {
              connect: { id: input.reviewId },
            },
            user: {
              connect: { id: input.userId },
            },
          },
        });
        return res;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  unlike: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const res = await ctx.prisma.reviewLike.delete({
          where: { id: input.id },
        });
        return res;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),
});
