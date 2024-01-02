//__BEGIN_COPILOT_CODE
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

import {
  createPublisherSchema,
  updatePublisherSchema,
} from "~/lib/validations/publisher"; // Make sure to create these validations
import { type Publisher } from "@prisma/client";
import { type Result, Ok, Err } from "ts-results";
import { handlePrismaError } from "~/utils";

export const publisherRouter = createTRPCRouter({
  getAll: publicProcedure.query(
    async ({ ctx }): Promise<Result<Array<Publisher>, TRPCError>> => {
      const result: Result<
        Array<Publisher>,
        TRPCError
      > = await ctx.prisma.publisher
        .findMany()
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }
  ),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<Result<Publisher, TRPCError>> => {
      const result: Result<Publisher, TRPCError> = await ctx.prisma.publisher
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
                  message: "Publisher not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Result<Publisher, TRPCError>> => {
      const result: Result<Publisher, TRPCError> = await ctx.prisma.publisher
        .delete({
          where: { id: input.id },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  create: adminProcedure
    .input(createPublisherSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Publisher, TRPCError>> => {
      const publisher: Result<Publisher, TRPCError> = await ctx.prisma.publisher
        .create({
          data: {
            name: input.name,
            image: input.image,
            description: input.description,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return publisher;
    }),

  update: adminProcedure
    .input(updatePublisherSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Publisher, TRPCError>> => {
      const result: Result<Publisher, TRPCError> = await ctx.prisma.publisher
        .update({
          where: {
            id: input.id,
          },
          data: {
            name: input.name,
            description: input.description,
            image: input.image,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),
});
//__END_COPILOT_CODE
