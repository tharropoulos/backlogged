/* eslint-disable testing-library/no-await-sync-query */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { User } from "@prisma/client";
import type { Session } from "next-auth";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { createId } from "@paralleldrive/cuid2";
import { faker } from "@faker-js/faker";

import { createMockCaller, createTestData } from "~/lib/utils";
import { type createReviewSchema } from "~/lib/validations/review";
import { type z } from "zod";

beforeAll(async () => {
  const { publisher, franchise, game } = await createTestData({
    franchise: true,
    publisher: true,
    game: true,
  });

  console.log("game, publisher and franchise created");
});

afterAll(async () => {
  const deleteGames = prisma.game.deleteMany();
  const deletePublishers = prisma.publisher.deleteMany();
  const deleteFranchises = prisma.franchise.deleteMany();
  const deletePlatforms = prisma.platform.deleteMany();
  const deleteGenres = prisma.genre.deleteMany();
  const deleteDevelopers = prisma.developer.deleteMany();
  const deleteFeatures = prisma.feature.deleteMany();
  const deleteReviews = prisma.review.deleteMany();
  const deleteUsers = prisma.user.deleteMany();

  await prisma.$transaction([
    deleteGames,
    deletePublishers,
    deleteFranchises,
    deletePlatforms,
    deleteGenres,
    deleteDevelopers,
    deleteFeatures,
    deleteReviews,
    deleteUsers,
  ]);
  console.log("Everything deleted on: ", process.env.DATABASE_URL);
  await prisma.$disconnect();
});

afterEach(async () => {
  await prisma.review.deleteMany();
});

const mockUser: User = {
  id: createId(),
  name: "Test User",
  email: "email",
  image: "image",
  emailVerified: null,
};

const unauthorizedCaller = appRouter.createCaller({
  session: null,
  prisma: prisma,
});

const mockSession: Session = {
  expires: new Date().toISOString(),
  user: mockUser,
};
const authorizedCaller = appRouter.createCaller({
  session: mockSession,
  prisma: prisma,
});

describe("When creating a Review", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //Act

      const result = unauthorizedCaller.review.create({
        content: faker.lorem.paragraph(),
        gameId: createId(),
        rating: faker.number.int({ min: 1, max: 5 }),
      });
      //   const result = await unauthorizedCaller.createReview(input); NOTE: Copilot suggestion

      //Assert
      //NOTE: Copilot Suggestion
      // expect(result).toMatchInlineSnapshot(`
      //   Object {
      //     "data": null,
      //     "error": Object {
      //       "code": "UNAUTHORIZED",
      //       "message": "Unauthorized",
      //     },
      //   }
      // `);

      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    it("should create a Review", async () => {
      //Arrange
      const { game, user } = await createTestData({
        game: true,
        publisher: true,
        franchise: true,
        user: true,
      });

      const input: z.infer<typeof createReviewSchema> = {
        content: faker.lorem.paragraph(),
        gameId: game.unwrap().id,
        rating: faker.number.int({ min: 1, max: 5 }),
      };

      if (user.some) {
        const session: Session = {
          expires: new Date().toISOString(),
          user: user.val,
        };

        const caller = appRouter.createCaller({
          session: session,
          prisma: prisma,
        });

        //Act
        const result = await caller.review.create(input);

        //Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject(input);
      } else {
        throw new Error("User not created");
      }

      //Assert

      //NOTE: Copilot Suggestion
      // expect(result).toMatchInlineSnapshot(`
      //   Object {
      //     "data": Object {
      //       "content": "Et voluptatem voluptatem.",
      //       "createdAt": 2021-09-22T16:18:20.000Z,

      //       "game": Object {
      //         "backgroundImage": "https://placeimg.com/640/480/any",
      //         "coverImage": "https://placeimg.com/640/480/any",
      //         "description": "Et voluptatem voluptatem.",
      //         "franchise": Object {

      //           "name": "name",
      //         },
      //         "franchiseId": "CKN5GKQZ00000h9qg5j4z2v2e",
      //         "id": "CKN5GKQZ00000h9qg5j4z2v2e",
      //         "name": "name",
      //         "publisher": Object {
      //           "coverImage": "https://placeimg.com/640/480/any",
      //           "description": "Et voluptatem voluptatem.",
      //           "id": "CKN5GKQZ00000h9qg5j4z2v2e",
      //           "name": "name",
      //         },
    });
  });
});

describe("When getting a Review by id", () => {
  describe("and the Review exists", () => {
    it("should return the Review", async () => {
      //Arrange
      const { review } = await createTestData({
        review: true,
      });

      if (review.some) {
        //Act
        const result = await authorizedCaller.review.getById({
          id: review.val.id,
        });

        //Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject(review.val);
      } else {
        throw new Error("TEST ERROR: Review failed to create");
      }
    });
  });
  describe("and the Review does not exist", () => {
    it("should return an error", async () => {
      //Act
      const result = await authorizedCaller.review.getById({ id: createId() });

      //Assert
      expect(result.ok).toBe(false);
    });
  });
});

describe("When getting all Reviews", () => {
  describe("and there are Reviews", () => {
    it("should return all Reviews", async () => {
      //NOTE: Copilot Suggestion
      //Arrange
      const { review } = await createTestData({
        review: true,
      });

      //Act
      const result = await authorizedCaller.review.getAll();

      //Assert
      expect(result.ok).toBe(true);
      if (review.some) {
        expect(result.val).toMatchObject([review.val]);
      } else {
        throw new Error("TEST ERROR: Review failed to create");
      }
    });
  });
  describe("and there are no Reviews", () => {
    it("should return an empty array", async () => {
      //NOTE: Copilot Suggestion
      //Act
      const result = await authorizedCaller.review.getAll();

      //Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
    });
  });
});

describe("When updating a Review", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //Act
      const result = unauthorizedCaller.review.update({
        id: createId(),
        content: faker.lorem.paragraph(),
        gameId: createId(),
        rating: faker.number.int({ min: 1, max: 5 }),
      });

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the Review does not exist", () => {
      it("should return an error", async () => {
        //Act
        const result = await authorizedCaller.review.update({
          id: createId(),
          content: faker.lorem.paragraph(),
          gameId: createId(),
          rating: faker.number.int({ min: 1, max: 5 }),
        });

        //Assert
        expect(result.ok).toBe(false);
      });
    });
    describe("and the Review exists", () => {
      describe("and the user is the author", () => {
        it("should update the Review", async () => {
          //Arrange
          const { review, user } = await createTestData({
            review: true,
            user: true,
          });

          if (review.some && user.some) {
            const caller = createMockCaller({ user: user.val });
            const input: z.infer<typeof createReviewSchema> = {
              content: faker.lorem.paragraph(),
              gameId: review.val.gameId,
              rating: faker.number.int({ min: 1, max: 5 }),
            };

            //Act
            const result = await caller.review.update({
              id: review.val.id,
              ...input,
            });

            //Assert
            expect(result.ok).toBe(true);
            expect(result.val).toMatchObject(input);
          } else {
            throw new Error("TEST ERROR: Review or User failed to create");
          }
        });
      });
      describe("and the user is not the author", () => {
        it("should return an error", async () => {
          //Arrange
          const { review } = await createTestData({ review: true });

          if (review.some) {
            //NOTE: Copilot Suggestion
            //Act
            const result = await authorizedCaller.review.update({
              id: review.val.id,
              content: faker.lorem.paragraph(),
              gameId: review.val.gameId,
              rating: faker.number.int({ min: 1, max: 5 }),
            });

            //Assert
            expect(result.ok).toBe(false);
          } else {
            throw new Error("TEST ERROR: Review failed to create");
          }

          //NOTE: Copilot Suggestion
          // //Arrange
          // const { review, user } = await createTestData({
          //   review: true,
          //   user: true,
          // });

          // if (review.some && user.some) {
          //   const session: Session = {
          //     expires: new Date().toISOString(),
          //     user: user.val,
          //   };

          //   const caller = appRouter.createCaller({
          //     session: session,
          //     prisma: prisma,
          //   });

          //   const input: z.infer<typeof createReviewSchema> = {
          //     content: faker.lorem.paragraph(),
          //     gameId: review.val.gameId,
          //     rating: faker.number.int({ min: 1, max: 5 }),
          //   };

          //   //Act
          //   const result = await caller.review.update({
          //     id: createId(),
          //     ...input,
          //   });

          //   //Assert
          //   expect(result.ok).toBe(false);
          // } else {
          //   throw new Error("TEST ERROR: Review or User failed to create");
          // }
        });
      });
    });
  });
});

describe("When deleting a Review", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //NOTE: Copilot Suggestion
      //Act
      const result = unauthorizedCaller.review.delete({ id: createId() });

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the Review does not exist", () => {
      it("should return an error", async () => {
        //NOTE: Copilot Suggestion
        //Act
        const result = await authorizedCaller.review.delete({
          id: createId(),
        });

        //Assert
        expect(result.ok).toBe(false);
      });
    });
    describe("and the Review exists", () => {
      describe("and the user is the author", () => {
        it("should delete the Review", async () => {
          //Arrange
          const { review, user } = await createTestData({
            review: true,
            user: true,
          });

          if (review.some && user.some) {
            const caller = createMockCaller({ user: user.val });

            //Act
            const result = await caller.review.delete({
              id: review.val.id,
            });

            //Assert
            expect(result.ok).toBe(true);
            expect(result.val).toMatchObject(review.val);
          } else {
            throw new Error("TEST ERROR: Review or User failed to create");
          }
        });
      });
      describe("and the user is not the author", () => {
        it("should return an error", async () => {
          //Arrange
          const { review } = await createTestData({ review: true });

          if (review.some) {
            //NOTE: Copilot Suggestion
            //Act
            const result = await authorizedCaller.review.delete({
              id: review.val.id,
            });

            //Assert
            expect(result.ok).toBe(false);
          } else {
            throw new Error("TEST ERROR: Review failed to create");
          }
        });
      });
    });
  });
});

describe("When liking a Review", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //Act
      const result = unauthorizedCaller.review.like({
        reviewId: createId(),
      });

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the Review does not exist", () => {
      it("should return an error", async () => {
        //Act
        const result = await authorizedCaller.review.like({
          reviewId: createId(),
        });

        //Assert
        expect(result.ok).toBe(false);
      });
    });
  });
  describe("and the Review exists", () => {
    describe("and the user has not liked the Review", () => {
      it("should like the Review", async () => {
        //NOTE: Copilot Suggestion
        //Arrange
        const { review, user } = await createTestData({
          review: true,
          user: true,
        });

        if (review.some && user.some) {
          const caller = createMockCaller({ user: user.val });

          //Act
          const result = await caller.review.like({
            reviewId: review.val.id,
          });

          const updatedReview = await prisma.review.findUnique({
            where: { id: review.val.id },
            select: { likes: true },
          });

          //Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(review.val);
          expect(updatedReview?.likes).toMatchObject([{ userId: user.val.id }]);
        } else {
          throw new Error("TEST ERROR: Review or User failed to create");
        }
      });
    });
    describe("and the user has already liked the Review", () => {
      it("should return an error", async () => {
        //Arrange
        const { review, user } = await createTestData({
          review: true,
          user: true,
        });

        if (review.some && user.some) {
          const caller = createMockCaller({ user: user.val });

          //Act
          await caller.review.like({
            reviewId: review.val.id,
          });

          const result = await caller.review.like({
            reviewId: review.val.id,
          });

          //Assert
          expect(result.ok).toBe(false);
        } else {
          throw new Error("TEST ERROR: Review or User failed to create");
        }
      });
    });
  });
});

describe("When unliking a Review", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //NOTE: Copilot Suggestion
      //Act
      const result = unauthorizedCaller.review.unlike({
        reviewId: createId(),
      });

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the Review does not exist", () => {
      it("should return an error", async () => {
        //NOTE: Copilot Suggestion
        //Act
        const result = await authorizedCaller.review.unlike({
          reviewId: createId(),
        });

        //Assert
        expect(result.ok).toBe(false);
      });
    });
    describe("and the Review exists", () => {
      describe("and the user hasn't liked the Review", () => {
        it("should return an error", async () => {
          //NOTE: Copilot Suggestion
          //Arrange
          const { review } = await createTestData({ review: true });

          if (review.some) {
            //NOTE: Copilot Suggestion
            //Act
            const result = await authorizedCaller.review.unlike({
              reviewId: review.val.id,
            });

            //Assert
            expect(result.ok).toBe(false);
          } else {
            throw new Error("TEST ERROR: Review failed to create");
          }
        });
      });
      describe("and the user has liked the Review", () => {
        it("should unlike the Review", async () => {
          //NOTE: Copilot Suggestion
          //Arrange
          const { review, user } = await createTestData({
            review: true,
            user: true,
          });

          if (review.some && user.some) {
            const caller = createMockCaller({ user: user.val });

            //Act
            await caller.review.like({
              reviewId: review.val.id,
            });

            const result = await caller.review.unlike({
              reviewId: review.val.id,
            });

            const updatedReview = await prisma.review.findUnique({
              where: { id: review.val.id },
              select: { likes: true },
            });

            //Assert
            expect(result.ok).toBe(true);
            expect(result.val).toMatchObject(review.val);
            expect(updatedReview?.likes).toMatchObject([]);
          } else {
            throw new Error("TEST ERROR: Review or User failed to create");
          }
        });
      });
    });
  });
});
