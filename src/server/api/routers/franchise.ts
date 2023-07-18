import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const franchiseRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const res = await ctx.prisma.franchise.findMany();
    console.log(res);
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
      console.log(res);
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
        console.log(res);
        return res;
      } catch (err) {
        console.error(err);
        throw err;
      }
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().min(1).max(255),
        background_image: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const franchise = await ctx.prisma.franchise.create({
        data: {
          name: input.name,
          description: input.description,
          background_image: input.background_image,
        },
      });
      console.log(franchise);
      return franchise;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255),
        description: z.string().min(1).max(255),
        background_image: z.string().min(1).max(255),
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
          background_image: input.background_image,
        },
        where: {
          id: input.id,
        },
      });
      return res;
    }),
});
