/* eslint-disable testing-library/no-await-sync-query */
// BEGIN_COPILOT_CODE
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import type { Session } from "next-auth";
import type { User } from "next-auth";
import type { Review } from "@prisma/client";
import type { z } from "zod";
import type { createReviewSchema } from "~/lib/validations/review";

let gameId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      name: mockUser.name,
      email: mockUser.email,
      image: mockUser.image,
      role: mockUser.role,
      id: mockUser.id,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: mockAdmin.name,
      email: mockAdmin.email,
      image: mockAdmin.image,
      role: mockAdmin.role,
      id: mockAdmin.id,
    },
  });

  const franchise = await prisma.franchise.create({
    data: {
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      image: faker.image.url(),
    },
  });

  const publisher = await prisma.publisher.create({
    data: {
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      image: faker.image.url(),
    },
  });

  const game = await prisma.game.create({
    data: {
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      coverImage: faker.image.url(),
      backgroundImage: faker.image.url(),
      releaseDate: new Date(),
      publisher: {
        connect: {
          id: publisher.id,
        },
      },
      franchise: {
        connect: {
          id: franchise.id,
        },
      },
    },
  });
  gameId = game.id;
});

afterAll(async () => {
  const games = prisma.game.deleteMany();
  const franchises = prisma.franchise.deleteMany();
  const publishers = prisma.publisher.deleteMany();
  const users = prisma.user.deleteMany();
  const reviews = prisma.review.deleteMany();
  await prisma.$transaction([games, reviews, franchises, publishers, users]);
});

const mockUser: User = {
  role: "User",
  id: createId(),
  email: faker.internet.email(),
  image: faker.image.url(),
  name: faker.person.firstName(),
};

const mockOtherUser: User = {
  role: "User",
  id: createId(),
  email: faker.internet.email(),
  image: faker.image.url(),
  name: faker.person.firstName(),
};

const mockAdmin: User = {
  role: "Admin",
  id: createId(),
  email: faker.internet.email(),
  image: faker.image.url(),
  name: faker.person.firstName(),
};

const mockSession: Session = {
  expires: new Date().toISOString(),
  user: mockUser,
};
const mockOtherSession: Session = {
  expires: new Date().toISOString(),
  user: mockOtherUser,
};

const mockAdminSession: Session = {
  expires: new Date().toISOString(),
  user: mockAdmin,
};

const authenticatedCaller = appRouter.createCaller({
  session: mockSession,
  prisma: prisma,
});

const adminCaller = appRouter.createCaller({
  session: mockAdminSession,
  prisma: prisma,
});

const otherAuthenticatedCaller = appRouter.createCaller({
  session: mockOtherSession,
  prisma: prisma,
});

// REVISION_1: add tests for unauthenticated users
const unauthenticatedCaller = appRouter.createCaller({
  prisma: prisma,
  session: null,
});

describe("When creating a review", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.review.create({
        gameId: gameId,
        content: faker.lorem.paragraph(),
        // REWRITE_3: use number.int
        // rating: faker.random.number({ min: 1, max: 5 }),
        rating: faker.number.int({ min: 1, max: 5 }),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });
  // END_REVISION_1
  describe("and the user is authenticated", () => {
    describe("and the game does not exist", () => {
      it("should return an error", async () => {
        // Arrange
        const review: z.infer<typeof createReviewSchema> = {
          gameId: createId(), // This ID does not exist
          content: faker.lorem.paragraph(),
          rating: faker.number.int({ min: 1, max: 5 }),
        };

        // Act
        const result = await authenticatedCaller.review.create(review);

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the game exists", () => {
      it("should create a review", async () => {
        // Arrange
        const review: z.infer<typeof createReviewSchema> = {
          gameId: gameId,
          // REWRITE_2: remove title
          //   title: faker.lorem.sentence(),
          content: faker.lorem.paragraph(),
          rating: faker.number.int({ min: 1, max: 5 }),
        };

        // Act
        const result = await authenticatedCaller.review.create(review);

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject(review);
      });
    });
  });
});

describe("When retrieving a review by Id", () => {
  describe("and the review does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await unauthenticatedCaller.review.getById({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the review exists", () => {
    it("should return a review", async () => {
      // Arrange
      const review: Review = await prisma.review.create({
        data: {
          content: faker.lorem.paragraph(),
          rating: faker.number.int({ min: 1, max: 5 }),
          gameId: gameId,
          userId: mockUser.id,
        },
      });

      // Act
      const result = await authenticatedCaller.review.getById({
        id: review.id,
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(review);
    });
  });
});

describe("When retrieving all reviews", () => {
  describe("and there are no reviews", () => {
    it("should return an empty array", async () => {
      // Arrange
      await prisma.review.deleteMany();

      // Act
      const result = await unauthenticatedCaller.review.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
    });
  });

  describe("and there are reviews", () => {
    it("should return an array of reviews", async () => {
      // Arrange
      const reviews: Array<Omit<Review, "id">> = [
        {
          // REWRITE_1: add createdAt and updatedAt
          createdAt: new Date(),
          updatedAt: new Date(),
          content: faker.lorem.paragraph(),
          rating: faker.number.int({ min: 1, max: 5 }),
          gameId: gameId,
          userId: mockUser.id,
        },
        {
          createdAt: new Date(),
          updatedAt: new Date(),
          content: faker.lorem.paragraph(),
          rating: faker.number.int({ min: 1, max: 5 }),
          gameId: gameId,
          userId: mockUser.id,
        },
      ];

      await prisma.review.createMany({
        data: reviews,
      });

      // Act
      const result = await authenticatedCaller.review.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toHaveLength(reviews.length);
    });
  });
});

describe("When updating a review", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.review.update({
        id: createId(),
        gameId: gameId,
        content: faker.lorem.paragraph(),
        rating: faker.number.int({ min: 1, max: 5 }),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the review does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.review.update({
          id: createId(),
          gameId: gameId,
          content: faker.lorem.paragraph(),
          rating: faker.number.int({ min: 1, max: 5 }),
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the review exists", () => {
      describe("and the user is not the author of the review", () => {
        it("should return an error", async () => {
          // Arrange
          const review: Review = await prisma.review.create({
            data: {
              content: faker.lorem.paragraph(),
              rating: faker.number.int({ min: 1, max: 5 }),
              gameId: gameId,
              userId: mockUser.id,
            },
          });

          // Act
          const result = await otherAuthenticatedCaller.review.update({
            gameId: gameId,
            id: review.id,
            content: faker.lorem.paragraph(),
            rating: faker.number.int({ min: 1, max: 5 }),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user is the author of the review", () => {
        it("should update the review", async () => {
          // Arrange
          const review: Review = await prisma.review.create({
            data: {
              content: faker.lorem.paragraph(),
              rating: faker.number.int({ min: 1, max: 5 }),
              gameId: gameId,
              userId: mockUser.id,
            },
          });

          const updatedContent = faker.lorem.paragraph();
          const updatedRating = faker.number.int({ min: 1, max: 5 });

          // Act
          const result = await authenticatedCaller.review.update({
            gameId: gameId,
            id: review.id,
            content: updatedContent,
            rating: updatedRating,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.unwrap().content).toBe(updatedContent);
          expect(result.unwrap().rating).toBe(updatedRating);
        });
      });

      describe("and the user is an admin", () => {
        it("should update the review", async () => {
          // Arrange
          const review: Review = await prisma.review.create({
            data: {
              content: faker.lorem.paragraph(),
              rating: faker.number.int({ min: 1, max: 5 }),
              gameId: gameId,
              userId: mockUser.id,
            },
          });

          const updatedContent = faker.lorem.paragraph();
          const updatedRating = faker.number.int({ min: 1, max: 5 });

          // Act
          const result = await authenticatedCaller.review.update({
            gameId: gameId,
            id: review.id,
            content: updatedContent,
            rating: updatedRating,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.unwrap().content).toBe(updatedContent);
          expect(result.unwrap().rating).toBe(updatedRating);
        });
      });
    });
  });
});

describe("When deleting a review", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.review.delete({
        id: createId(),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the review does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.review.delete({
          id: createId(),
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the review exists", () => {
      describe("and the user is not the author of the review", () => {
        it("should return an error", async () => {
          // Arrange
          const review: Review = await prisma.review.create({
            data: {
              content: faker.lorem.paragraph(),
              rating: faker.number.int({ min: 1, max: 5 }),
              gameId: gameId,
              userId: mockUser.id,
            },
          });

          // Act
          const result = await otherAuthenticatedCaller.review.delete({
            id: review.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user is the author of the review", () => {
        it("should delete the review", async () => {
          // Arrange
          const review: Review = await prisma.review.create({
            data: {
              content: faker.lorem.paragraph(),
              rating: faker.number.int({ min: 1, max: 5 }),
              gameId: gameId,
              userId: mockUser.id,
            },
          });

          // Act
          const result = await authenticatedCaller.review.delete({
            id: review.id,
          });

          // Assert
          expect(result.ok).toBe(true);
        });
      });

      describe("and the user is an admin", () => {
        it("should delete the review", async () => {
          // Arrange
          const review: Review = await prisma.review.create({
            data: {
              content: faker.lorem.paragraph(),
              rating: faker.number.int({ min: 1, max: 5 }),
              gameId: gameId,
              userId: mockUser.id,
            },
          });

          // Act
          const result = await authenticatedCaller.review.delete({
            id: review.id,
          });

          // Assert
          expect(result.ok).toBe(true);
        });
      });
    });
  });
});

describe("When liking a review", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.review.like({
        id: createId(),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the review does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.review.like({
          id: createId(),
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the review exists", () => {
      describe("and the user has already liked the review", () => {
        it("should return an error", async () => {
          // Arrange
          const review: Review = await prisma.review.create({
            data: {
              content: faker.lorem.paragraph(),
              rating: faker.number.int({ min: 1, max: 5 }),
              gameId: gameId,
              userId: mockUser.id,
            },
          });

          await authenticatedCaller.review.like({
            id: review.id,
          });

          // Act
          const result = await authenticatedCaller.review.like({
            id: review.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user has not liked the review", () => {
        it("should like the review", async () => {
          // Arrange
          const review: Review = await prisma.review.create({
            data: {
              content: faker.lorem.paragraph(),
              rating: faker.number.int({ min: 1, max: 5 }),
              gameId: gameId,
              userId: mockUser.id,
            },
          });

          // Act
          const result = await authenticatedCaller.review.like({
            id: review.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          // REWRITE_4: check for likes
          // expect(result.unwrap().likes).toContainEqual({ userId: mockUser.id });
          expect(
            result.unwrap().likes.some((like) => like.userId === mockUser.id)
          ).toBe(true);
        });
      });
    });
  });
});

describe("When unliking a review", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.review.unlike({
        id: createId(),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the review does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.review.unlike({
          id: createId(),
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the review exists", () => {
      describe("and the user has never liked the review", () => {
        it("should return an error", async () => {
          // Arrange
          const review: Review = await prisma.review.create({
            data: {
              content: faker.lorem.paragraph(),
              rating: faker.number.int({ min: 1, max: 5 }),
              gameId: gameId,
              userId: mockUser.id,
            },
          });

          // Act
          const result = await otherAuthenticatedCaller.review.unlike({
            id: review.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });
      describe("and the user has liked the review before", () => {
        it("should remove the like", async () => {
          // Arrange
          const review: Review = await prisma.review.create({
            data: {
              content: faker.lorem.paragraph(),
              rating: faker.number.int({ min: 1, max: 5 }),
              gameId: gameId,
              userId: mockUser.id,
            },
          });

          await authenticatedCaller.review.like({
            id: review.id,
          });

          // Act
          const result = await authenticatedCaller.review.unlike({
            id: review.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(
            result.unwrap().likes.some((like) => like.userId === mockUser.id)
          ).toBe(false);
        });
      });
    });
  });
});
// END_COPILOT_CODE
