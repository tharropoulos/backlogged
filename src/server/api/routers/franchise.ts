import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { createFranchiseSchema } from "~/lib/validations/franchise";

export const franchiseRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const res = await ctx.prisma.franchise.findMany();
    return res;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.franchise.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Franchise not found",
        });
      }
      return res;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.franchise.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Franchise not found",
        });
      }
      try {
        const res = await ctx.prisma.franchise.delete({
          where: {
            id: input.id,
          },
        });
        return res;
      } catch (err) {
        throw err;
      }
    }),
  create: protectedProcedure
    .input(createFranchiseSchema)
    .mutation(async ({ ctx, input }) => {
      const franchise = await ctx.prisma.franchise.create({
        data: {
          name: input.name,
          description: input.description,
          backgroundImage: input.backgroundImage,
        },
      });
      return franchise;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255),
        description: z.string().min(1).max(255),
        backgroundImage: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.franchise.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Franchise not found",
        });
      }

      const res = await ctx.prisma.franchise.update({
        data: {
          name: input.name,
          description: input.description,
          backgroundImage: input.backgroundImage,
        },
        where: {
          id: input.id,
        },
      });
      return res;
    }),
});
