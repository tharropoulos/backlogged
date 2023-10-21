// Create the router for the game publishers. It's the same as the franchise, but with a the publisher model from the database.

// Generated purely by Copilot
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { createPublisherSchema } from "~/lib/validations/publisher";

// import { create } from "domain"; // Uneeded import, Copilot nonsense

export const publisherRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const res = await ctx.prisma.publisher.findMany();
    console.log(res);
    return res;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const res = await ctx.prisma.publisher.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Publisher not found",
        });
      }
      console.log(res);
      return res;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.publisher.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Publisher not found",
        });
      }
      try {
        const res = await ctx.prisma.publisher.delete({
          where: {
            id: input.id,
          },
        });
        console.log(res);
        return res;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not delete publisher",
        });
      }
    }),

  //Copilot struggled with this
  create: protectedProcedure
    .input(createPublisherSchema)
    // .input(z.object({ data: createPublisherSchema })) // Copilot nonsense
    .mutation(async ({ ctx, input }) => {
      try {
        const res = await ctx.prisma.publisher.create({
          data: {
            name: input.name,
            description: input.description,
            coverImage: input?.coverImage,
            // country: input.country, // Copilot nonsense
          },
        });
        console.log(res);
        return res;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create publisher",
        });
      }
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: createPublisherSchema }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.publisher.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Publisher not found",
        });
      }
      try {
        const res = await ctx.prisma.publisher.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.data.name,
            coverImage: input.data.coverImage,
            description: input.data.description,
            // country: input.data.country, // Copilot nonsense
          },
        });
        console.log(res);
        return res;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not update publisher",
        });
      }
    }),
});
