import { createRouter } from "@trpc/server";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

//NOTE: Written by Copilot

export const reviewRouter = createRouter()
  .mutation("create", {
    input: z.object({
      gameId: z.string(),
      userId: z.string(),
      rating: z.number().optional(),
      content: z.string(),
    }),
    resolve: async ({ input }) => {
      return prisma.review.create({ data: input });
    },
  })
  .query("find", {
    input: z.object({
      id: z.string(),
    }),
    resolve: async ({ input }) => {
      return prisma.review.findUnique({ where: { id: input.id } });
    },
  })
  .query("findAll", {
    resolve: async () => {
      return prisma.review.findMany();
    },
  })
  .mutation("update", {
    input: z.object({
      id: z.string(),
      rating: z.number().optional(),
      content: z.string().optional(),
    }),
    resolve: async ({ input }) => {
      return prisma.review.update({ where: { id: input.id }, data: input });
    },
  })
  .mutation("delete", {
    input: z.object({
      id: z.string(),
    }),
    resolve: async ({ input }) => {
      return prisma.review.delete({ where: { id: input.id } });
    },
  })
  .mutation("like", {
    input: z.object({
      reviewId: z.string(),
      userId: z.string(),
    }),
    resolve: async ({ input }) => {
      return prisma.reviewLike.create({ data: input });
    },
  })
  .mutation("unlike", {
    input: z.object({
      id: z.string(),
    }),
    resolve: async ({ input }) => {
      return prisma.reviewLike.delete({ where: { id: input.id } });
    },
  });
