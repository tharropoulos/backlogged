import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import {
  createFranchiseSchema,
  updateFranchiseSchema,
} from "~/lib/validations/franchise";
import { type Franchise } from "@prisma/client";
import { type Result, Ok, Err } from "ts-results";
import { handlePrismaError } from "~/utils";

export const franchiseRouter = createTRPCRouter({
  getAll: publicProcedure.query(
    async ({ ctx }): Promise<Result<Array<Franchise>, TRPCError>> => {
      const result: Result<
        Array<Franchise>,
        TRPCError
      > = await ctx.prisma.franchise
        .findMany()
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }
  ),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<Result<Franchise, TRPCError>> => {
      const result: Result<Franchise, TRPCError> = await ctx.prisma.franchise
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
                  message: "Franchise not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Result<Franchise, TRPCError>> => {
      const result: Result<Franchise, TRPCError> = await ctx.prisma.franchise
        .delete({
          where: { id: input.id },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  create: protectedProcedure
    .input(createFranchiseSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Franchise, TRPCError>> => {
      const franchise: Result<Franchise, TRPCError> = await ctx.prisma.franchise
        .create({
          data: {
            name: input.name,
            description: input.description,
            backgroundImage: input.backgroundImage,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return franchise;
    }),

  update: protectedProcedure
    .input(updateFranchiseSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Franchise, TRPCError>> => {
      const result: Result<Franchise, TRPCError> = await ctx.prisma.franchise
        .update({
          where: {
            id: input.id,
          },
          data: {
            name: input.name,
            description: input.description,
            backgroundImage: input.backgroundImage,
          },
        })
        .then((res) => Ok(res), handlePrismaError);
      return result;
    }),
});
