import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { type Result, Ok, Err } from "ts-results";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { Prisma, type Comment } from "@prisma/client";
import { handlePrismaError } from "~/lib/utils";

export type CommentDetails = {
  _count: {
    likes: number;
  };
  id: string;
  content: string;
  user: {
    image: string | null;
    id: string;
    name: string | null;
  };
  reviewId: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  children: Array<Omit<CommentDetails, "children">>;
};
// Define your input validation schema
const createCommentSchema = z.object({
  content: z.string(),
  userId: z.string(),
  reviewId: z.string(),
  parentId: z.string().optional(),
});

export const commentRouter = createTRPCRouter({
  getAll: publicProcedure.query(
    async ({ ctx }): Promise<Result<Array<Comment>, TRPCError>> => {
      const result: Result<Array<Comment>, TRPCError> = await ctx.prisma.comment
        .findMany()
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }
  ),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<Result<Comment, TRPCError>> => {
      const result: Result<Comment, TRPCError> = await ctx.prisma.comment
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
                  message: "Comment not found",
                })
              );
        }, handlePrismaError);

      return result;
    }),

  create: protectedProcedure
    .input(createCommentSchema)
    .mutation(async ({ ctx, input }): Promise<Result<Comment, TRPCError>> => {
      const result: Result<Comment, TRPCError> = await ctx.prisma.comment
        //NOTE: Copilot suggestion
        .create({
          data: {
            content: input.content,
            user: {
              connect: { id: ctx.session.user.id },
            },
            review: {
              connect: { id: input.reviewId },
            },
            parent: {
              connect: { id: input.parentId },
            },
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Result<Comment, TRPCError>> => {
      //NOTE: Copilot suggestion
      const result: Result<Comment, TRPCError> = await ctx.prisma.comment
        .update({
          where: {
            id: input.id,
          },
          data: {
            content: input.content,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  //NOTE: Copilot suggestion
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<Result<Comment, TRPCError>> => {
      const result: Result<Comment, TRPCError> = await ctx.prisma.comment
        .delete({
          where: { id: input.id },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  like: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Result<Comment, TRPCError>> => {
      //NOTE: Copilot suggestion
      const result: Result<Comment, TRPCError> = await ctx.prisma.comment
        .update({
          where: { id: input.commentId, userId: ctx.session.user.id },
          data: {
            likes: {
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
        commentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Result<Comment, TRPCError>> => {
      //NOTE: Copilot suggestion
      const result: Result<Comment, TRPCError> = await ctx.prisma.comment
        .update({
          where: {
            id: input.commentId,
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

  getDetails: publicProcedure
    //NOTE: Written by myself
    .input(z.object({ id: z.string() }))
    .query(
      async ({ ctx, input }): Promise<Result<CommentDetails, TRPCError>> => {
        const options = Prisma.validator<Prisma.CommentSelect>()({
          _count: {
            select: {
              likes: true,
            },
          },
          content: true,
          user: {
            select: {
              image: true,
              id: true,
              name: true,
            },
          },
          reviewId: true,
          createdAt: true,
          updatedAt: true,
          parentId: true,
        });

        const result: Result<CommentDetails, TRPCError> =
          await ctx.prisma.comment
            .findUnique({
              where: {
                id: input.id,
              },

              select: {
                ...options,
                children: {
                  select: options,
                },
              },
            })
            .then((res) => {
              console.log(res);
              return res
                ? Ok(res)
                : new Err(
                    new TRPCError({
                      code: "NOT_FOUND",
                      message: "Comment not found",
                    })
                  );
            });

        return result;
      }
    ),
});
