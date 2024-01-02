// BEGIN_COPILOT_CODE
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { createCommentSchema } from "~/lib/validations/comment";
import {
  Prisma,
  type Comment,
  type CommentLike,
  type User,
} from "@prisma/client";
import { type Result, Ok, Err } from "ts-results";
import { handlePrismaError, type Omit } from "~/utils";

export type GrandChildCommentDetails = Omit<
  CommentDetails,
  "parent" | "children"
>;

export type ChildCommentDetails = Omit<
  CommentDetails,
  // REWRITE_1: Remove the "children" key from the type
  // "parent"
  "parent" | "children"
> & {
  children: Array<GrandChildCommentDetails>;
};

export type CommentDetails = {
  _count: {
    likes: number;
  };
  id: string;
  content: string;
  reviewId: string;
  createdAt: Date;
  updatedAt: Date;
  user: Pick<User, "id" | "name" | "image">;
  parent: Omit<CommentDetails, "children" | "parent"> | null;
  children: Array<ChildCommentDetails>;
};

export const commentRouter = createTRPCRouter({
  getAll: publicProcedure.query(
    async ({ ctx }): Promise<Result<Array<Comment>, TRPCError>> => {
      const result: Result<Array<Comment>, TRPCError> = await ctx.prisma.comment
        .findMany({
          where: {
            deleted: null,
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }
  ),

  getById: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }): Promise<Result<Comment, TRPCError>> => {
      const result: Result<Comment, TRPCError> = await ctx.prisma.comment
        .findUnique({
          where: {
            id: input.id,
            deleted: null,
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
      const { reviewId, parentId, ...rest } = input;
      const createInput: Prisma.CommentCreateInput = {
        ...rest,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          connect: {
            id: ctx.session.user.id,
          },
        },
        review: {
          connect: {
            id: reviewId,
          },
        },
      };

      switch (true) {
        case typeof parentId === "string":
          createInput.parent = {
            connect: {
              id: parentId,
            },
          };
        default:
      }
      const result: Result<Comment, TRPCError> = await ctx.prisma.comment
        .create({
          data: createInput,
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<Result<Comment, TRPCError>> => {
      const { id, ...rest } = input;

      const whereClause: Prisma.CommentWhereUniqueInput = {
        id: id,
        deleted: null,
      };

      whereClause.AND =
        ctx.session.user.role !== "Admin"
          ? { userId: ctx.session.user.id }
          : whereClause.AND;

      const result: Result<Comment, TRPCError> = await ctx.prisma.comment
        .update({
          where: whereClause,
          data: {
            ...rest,
            updatedAt: new Date(),
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  // END_COPILOT_CODE
  // Copilot couldn't get it
  getDetails: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .mutation(async ({ ctx, input }) => {
      // BEGIN_COPILOT_CODE
      const baseSelectClause = Prisma.validator<Prisma.CommentSelect>()({
        _count: {
          select: {
            likes: true,
            children: false,
          },
        },
        id: true,
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
      });

      const parentSelectClause = {
        ...baseSelectClause,
        // Don't take the children (this is where the current comment is)
        children: false,
        // Don't take the parent (this is two depths above)
        parent: false,
      };

      const childrenSelectClause = {
        // Don't take the parent (current comment)
        ...baseSelectClause,
        parent: false,
        // Take the first depth of children
        children: {
          // Take the second depth of children, and no more than that
          select: parentSelectClause,
        },
      };
      // END_COPILOT_CODE

      // BEGIN_NON_COPILOT_CODE
      const result: Result<CommentDetails, TRPCError> = await ctx.prisma.comment
        .findUnique({
          where: {
            id: input.id,
            deleted: null,
          },
          select: {
            ...baseSelectClause,
            parent: {
              select: parentSelectClause,
            },
            // Take the first depth of children
            children: {
              select: childrenSelectClause,
            },
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
        });

      return result;
    }),
  // END_NON_COPILOT_CODE

  // BEGIN_COPILOT_CODE
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .mutation(async ({ ctx, input }): Promise<Result<Comment, TRPCError>> => {
      const whereClause: Prisma.CommentWhereUniqueInput = {
        id: input.id,
        deleted: null,
      };

      whereClause.AND =
        ctx.session.user.role !== "Admin"
          ? { userId: ctx.session.user.id }
          : whereClause.AND;

      const result: Result<Comment, TRPCError> = await ctx.prisma.comment
        .update({
          where: whereClause,
          data: {
            deleted: new Date(),
          },
        })
        .then((res) => Ok(res), handlePrismaError);

      return result;
    }),

  like: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<
        Result<Comment & { likes: Array<CommentLike> }, TRPCError>
      > => {
        const result: Result<
          Comment & { likes: Array<CommentLike> },
          TRPCError
        > = await ctx.prisma.comment
          .update({
            where: { id: input.id, deleted: null },
            data: {
              likes: {
                create: [
                  {
                    user: {
                      connect: {
                        id: ctx.session.user.id,
                      },
                    },
                  },
                ],
              },
            },
            include: {
              likes: true,
            },
          })
          .then((res) => Ok(res), handlePrismaError);

        return result;
      }
    ),

  unlike: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<
        Result<Comment & { likes: Array<CommentLike> }, TRPCError>
      > => {
        const result: Result<
          Comment & { likes: Array<CommentLike> },
          TRPCError
        > = await ctx.prisma.comment
          .update({
            where: {
              id: input.id,
              deleted: null,
              likes: {
                some: {
                  userId: ctx.session?.user.id,
                },
              },
            },
            data: {
              likes: {
                deleteMany: {
                  userId: ctx.session?.user.id,
                  commentId: input.id,
                },
              },
            },
            include: {
              likes: true,
            },
          })
          .then((res) => Ok(res), handlePrismaError);

        return result;
      }
    ),
});
// END_COPILOT_CODE
