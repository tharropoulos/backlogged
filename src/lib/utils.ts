import { TRPCError } from "@trpc/server";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Prisma,
  type Publisher,
  type Game,
  type Franchise,
  type User,
  type Review,
  Comment,
} from "@prisma/client";
import { type Option, Err, None, Some } from "ts-results";
import { type createPublisherSchema } from "./validations/publisher";
import { type createGameSchema } from "./validations/game";
import { type createFranchiseSchema } from "./validations/franchise";
import { type createReviewSchema } from "./validations/review";
import { faker } from "@faker-js/faker";
import { type createUserSchema } from "./validations/user";
import { type z } from "zod";
import { prisma } from "~/server/db";
import { appRouter } from "~/server/api/root";
import type { Session } from "next-auth";
import { createCommentSchema } from "./validations/comment";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ErrorWithMessage = {
  message: string;
};

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
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
async function createPublisher(
  data: z.infer<typeof createPublisherSchema>
): Promise<Publisher> {
  return await prisma.publisher.create({ data: data });
}

async function createFranchise(
  data: z.infer<typeof createFranchiseSchema>
): Promise<Franchise> {
  return await prisma.franchise.create({ data: data });
}

async function createGame(
  data: z.infer<typeof createGameSchema>
): Promise<Game> {
  return await prisma.game.create({ data: data });
}

async function createUser(
  data: z.infer<typeof createUserSchema>
): Promise<User> {
  return await prisma.user.create({ data: data });
}

async function createReview(
  data: z.infer<typeof createReviewSchema> & { userId: string }
): Promise<Review> {
  return await prisma.review.create({ data: data });
}

async function createComment(
  data: z.infer<typeof createCommentSchema> & { userId: string }
): Promise<Comment> {
  return await prisma.comment.create({
    data: {
      ...data,
      createdAt: new Date(),
    },
  });
}
//NOTE: Copilot suggestion
type PromiseType<T> = T extends Promise<infer U> ? U : never;

type TestDataOptions = {
  publisher?: boolean;
  franchise?: boolean;
  game?: boolean;
  review?: boolean;
  user?: boolean;
  comment?: "parent_only" | "child" | undefined;
};

export async function createTestData(options: TestDataOptions) {
  const data: {
    publisher: Option<PromiseType<ReturnType<typeof createPublisher>>>;
    franchise: Option<PromiseType<ReturnType<typeof createFranchise>>>;
    game: Option<PromiseType<ReturnType<typeof createGame>>>;
    user: Option<PromiseType<ReturnType<typeof createUser>>>;
    review: Option<PromiseType<ReturnType<typeof createReview>>>;
    comment: Option<PromiseType<ReturnType<typeof createComment>>>;
    child: Option<PromiseType<ReturnType<typeof createComment>>>;
  } = {
    publisher: None,
    franchise: None,
    game: None,
    user: None,
    review: None,
    comment: None,
    child: None,
  };

  if (options.publisher || options.game || options.review || options.comment) {
    data.publisher = new Some(
      await createPublisher({
        coverImage: faker.image.url(),
        description: faker.lorem.words(),
        name: faker.company.name(),
      })
    );
  }

  if (options.publisher || options.game || options.review || options.comment) {
    data.franchise = new Some(
      await createFranchise({
        name: faker.company.name(),
        description: faker.lorem.words(),
        backgroundImage: faker.image.url(),
      })
    );
  }

  if (options.game || options.review || options.comment) {
    data.game = new Some(
      await createGame({
        name: faker.commerce.productName(),
        coverImage: faker.image.url(),
        backgroundImage: faker.image.url(),
        description: faker.lorem.words(),
        franchiseId: data.franchise.unwrap().id,
        publisherId: data.publisher.unwrap().id,
        releaseDate: faker.date.past(),
      })
    );
  }

  if (options.user || options.review || options.comment) {
    data.user = new Some(
      await createUser({
        name: faker.person.firstName(),
        email: faker.internet.email(),
        emailVerified: faker.date.past(),
        image: faker.image.avatar(),
      })
    );
  }

  if (options.review || options.comment) {
    data.review = new Some(
      await createReview({
        rating: faker.number.int({ min: 1, max: 5 }),
        content: faker.lorem.paragraph(),
        gameId: data.game.unwrap().id,
        userId: data.user.unwrap().id,
      })
    );
  }

  if (options.comment === "parent_only") {
    data.comment = new Some(
      await createComment({
        content: faker.lorem.paragraph(),
        reviewId: data.review.unwrap().id,
        userId: data.user.unwrap().id,
      })
    );
  }

  if (options.comment === "child") {
    data.comment = new Some(
      await createComment({
        content: faker.lorem.paragraph(),
        reviewId: data.review.unwrap().id,
        userId: data.user.unwrap().id,
      })
    );

    data.child = new Some(
      await createComment({
        content: faker.lorem.paragraph(),
        reviewId: data.review.unwrap().id,
        userId: data.user.unwrap().id,
        parentId: data.comment.unwrap().id,
      })
    );
  }
  return data;
}

export function createMockCaller({ user }: { user: User }) {
  const session: Session = {
    user: user,
    expires: new Date().toISOString(),
  };

  const ctx = {
    session,
    prisma,
  };

  const caller = appRouter.createCaller(ctx);

  return caller;
}
