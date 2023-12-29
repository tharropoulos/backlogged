// BEGIN_COPILOT_CODE
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { type Result, Ok, Err } from "ts-results";
import { handlePrismaError } from "~/utils";
import { json } from "stream/consumers";
import { error } from "console";
import fs from "fs";
import { listeners } from "process";
import { map } from "@trpc/server/observable";
import { prisma } from "~/server/db";
import { CopilotFiles } from "@prisma/client";
import { CompileFunctionOptions } from "vm";

type CommentKey =
  | "rewrites"
  | "manual_rewrites"
  | "revisions"
  | "manual_code_intances";
type CommentCounts = {
  rewrites?: number;
  manual_rewrites?: number;
  revisions?: number;
  manual_code_intances?: number;
};

type CopilotFile = { path: string; subject: string } & CommentCounts;

export const jsonSchema = z.array(
  z.object({
    prompt: z.string().max(15000),
    response: z.string().max(15000).nullish(),
    errorDetails: z.string().max(15000).nullish(),
    vote: z.number().int().nullish(),
    canceled: z.boolean().nullish(),
    contentReferences: z
      .array(
        z.object({
          path: z.string(),
          startLineNumber: z.number().int(),
          endLineNumber: z.number().int(),
          startColumn: z.number().int(),
          endColumn: z.number().int(),
        })
      )
      .nullish(),
  })
);

export const chatRouter = createTRPCRouter({
  sourceFiles: publicProcedure
    .input(
      z.object({
        directoryPath: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const files = fs
          .readdirSync(input.directoryPath)
          .filter((file) => file.endsWith(".ts"));

        const comments: Map<CommentKey, string> = new Map([
          ["rewrites", "// REWRITE"],
          ["manual_rewrites", "// MANUAL_REWRITE"],
          ["revisions", "// REVISION"],
          ["manual_code_intances", "// BEGIN_NON_COPILOT_CODE"],
        ]);

        const results: CopilotFiles[] = [];
        await Promise.all(
          files.map(async (file) => {
            try {
              const content = fs.readFileSync(
                input.directoryPath + "/" + file,
                "utf8"
              );
              const lines = content.split("\n");

              const counters = Array.from(comments.keys()).map(() => 0);

              lines.map((line) => {
                Array.from(comments.values()).map((comment, commentIndex) => {
                  if (line.includes(comment)) {
                    counters[commentIndex]++;
                  }
                });
              });

              const copilotFile = Array.from(
                comments.keys()
              ).reduce<CopilotFile>(
                (obj, key, index) => {
                  return {
                    ...obj,
                    [key]: counters[index],
                  };
                },
                { path: file, subject: "Backend" }
              );

              const res = await ctx.prisma.copilotFiles.create({
                data: {
                  manual_code_intances: copilotFile?.manual_code_intances ?? 0,
                  manual_rewrites: copilotFile?.manual_rewrites ?? 0,
                  rewrites: copilotFile?.rewrites ?? 0,
                  revisions: copilotFile?.revisions ?? 0,
                  path: file,
                  createdAt: new Date(),
                  subject: "Backend",
                },
              });
            } catch (error: any) {
              console.log(error);
            }
          })
        );

        return results;
      } catch {
        (error: any) => console.log(error);
      }
    }),

  sourceChat: publicProcedure
    .input(jsonSchema)
    .mutation(async ({ ctx, input }) => {
      for (const item of input) {
        await ctx.prisma.chat.create({
          data: {
            prompt: item.prompt,
            response: item.response,
            rating: item.vote === 0 ? -2 : item.vote === 1 ? 2 : item.vote,
            canceled: item.canceled,
            contextUsed: {
              create: item.contentReferences?.map((ref) => ({
                path: ref.path,
                startLineNumber: ref.startLineNumber,
                endLineNumber: ref.endLineNumber,
                startColumn: ref.startColumn,
                endColumn: ref.endColumn,
              })),
            },
          },
        });
      }
      // const result = await ctx.prisma.chat.createMany({
      //   data: input.map((item) => ({
      //     prompt: item.prompt,
      //     response: item.response,
      //     rating: item.vote,
      //     canceled: item.canceled,
      //     contextUsed: {
      //       create: item.contentReferences?.map((ref) => ({
      //         path: ref.path,
      //         startLineNumber: ref.startLineNumber,
      //         endLineNumber: ref.endLineNumber,
      //         startColumn: ref.startColumn,
      //         endColumn: ref.endColumn,
      //       })),
      //     },
      //   })),
      // });
      // return result;
    }),
});
