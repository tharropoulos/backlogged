import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type Prisma, PrismaClient } from "@prisma/client";
import type { Args, DefaultArgs } from "@prisma/client/runtime/library";

const globalClient = new PrismaClient();
export const extendedPrismaClient = new PrismaClient({
  log: ["error", "warn"],
}).$extends({
  model: {
    comment: {
      async findDeletedMany(
        args: Prisma.CommentFindManyArgs<Args & DefaultArgs>
      ) {
        //NOTE: written by copilot
        return await globalClient.comment.findMany({
          where: {
            ...args.where,
            deleted: { not: null },
          },
        });
      },
      async findDeletedUnique(
        args: Prisma.CommentFindUniqueArgs<Args & DefaultArgs>
      ) {
        return await globalClient.comment.findUnique({
          where: {
            ...args.where,
            deleted: { not: null || undefined },
          },
        });
      },
      async softDelete(args: Prisma.CommentDeleteArgs<Args & DefaultArgs>) {
        return await extendedPrismaClient.comment.update({
          ...args,
          data: {
            deleted: new Date(),
          },
        });
      },
    },
  },
  query: {
    comment: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deleted: null };
        return query(args);
      },
      async findUnique({ args, query }) {
        args.where = { ...args.where, deleted: null };
        return query(args);
      },
      async update({ args, query }) {
        args.where = { ...args.where, deleted: null };
        return query(args);
      },
    },
  },
});

export function CustomPrismaAdapter(p: typeof extendedPrismaClient) {
  return PrismaAdapter(p as unknown as PrismaClient);
}
