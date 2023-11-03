import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

//NOTE: Written by Copilot

export const reviewRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        userId: z.string(),
        rating: z.number().optional(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.review.create({
        data: input,
      });
      return res;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
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
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const res = await ctx.prisma.review.findMany();
    return res;
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        rating: z.number().optional(),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.review.update({
        where: { id: input.id },
        data: input,
      });
      return res;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.review.delete({
        where: { id: input.id },
      });
      return res;
    }),

  like: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.reviewLike.create({
        data: input,
      });
      return res;
    }),

  unlike: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.reviewLike.delete({
        where: { id: input.id },
      });
      return res;
    }),
});
