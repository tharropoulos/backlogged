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

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().min(1).max(255),
        background_image: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: ctx.session?.user.id,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a franchise.",
        });
      }

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
});
