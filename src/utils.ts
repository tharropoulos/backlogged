import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Err } from "ts-results";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ErrorWithMessage = {
  message: string;
};

export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

export function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
}

export function getErrorMessage(error: unknown): string {
  return toErrorWithMessage(error).message;
}

//NOTE: Copilot suggestion
export function handlePrismaError(err: unknown): Err<TRPCError> {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return new Err(
      new TRPCError({
        code: "BAD_REQUEST",
        message: err.message,
        cause: err.stack,
      })
    );
  } else if (
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientValidationError
  ) {
    return new Err(
      new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        cause: err.stack,
        message: err.message,
      })
    );
  } else {
    const errorMessage = getErrorMessage(err);
    return new Err(
      new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        cause: err,
        message: errorMessage,
      })
    );
  }
}
