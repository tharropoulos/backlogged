/* eslint-disable testing-library/no-await-sync-query */
import type { Prisma, User } from "@prisma/client";
import type { Session } from "next-auth";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { createId } from "@paralleldrive/cuid2";
import { faker } from "@faker-js/faker";

import { createMockCaller, createTestData } from "~/lib/utils";
import { type createCommentSchema } from "~/lib/validations/comment";
import { type z } from "zod";
import { CommentDetails } from "~/server/api/routers/comment";

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
  const deletePlaylists = prisma.playlist.deleteMany();
  const deleteFollows = prisma.follows.deleteMany();
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
    deletePlaylists,
    deleteFollows,
    deleteUsers,
  ]);
  await prisma.$disconnect();
});

afterEach(async () => {
  const deleteComments = prisma.comment.deleteMany({
    where: { children: { none: {} } },
  });
  const deleteNextComments = prisma.comment.deleteMany();

  await prisma.$transaction([deleteComments, deleteNextComments]);
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
const authenticatedCaller = appRouter.createCaller({
  session: mockSession,
  prisma: prisma,
});

describe("When creating a comment", () => {
  describe("and the user is not authorized", () => {
    it("should return an error", async () => {
      //Act
      const result = unauthorizedCaller.comment.create({
        content: faker.lorem.paragraph(),
        reviewId: createId(),
        //NOTE: Written by Copilot
        // input: {
        //   content: faker.lorem.paragraph(),
        //   reviewId: createId(),
        // },
      });

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authorized", () => {
    describe("and the review does not exist", () => {
      it("should return an error", async () => {
        //Arrange
        const { user } = await createTestData({ user: true });

        if (user.some) {
          const caller = createMockCaller({ user: user.val });

          //Act
          const result = await caller.comment.create({
            content: faker.lorem.paragraph(),
            reviewId: createId(),
          });

          //Assert
          expect(result.ok).toBe(false);
        } else {
          throw new Error("No user created");
        }
        // const caller = createMockCaller({ session: { user } }); //NOTE: suggested by Copilot

        //NOTE: Written by Copilot
        // //Act
        // const result = authorizedCaller.comment.create({
        //   content: faker.lorem.paragraph(),
        //   reviewId: createId(),
        // });

        // //Assert
        // await expect(result).rejects.toThrow();
      });
    });
    describe("and the review exists", () => {
      describe("and the user is not replying to another comment", () => {
        it("should create a comment with no parent", async () => {
          //NOTE: Copilot suggestion
          //Arrange
          const { user, review } = await createTestData({
            user: true,
            review: true,
          });

          if (user.some && review.some) {
            const caller = createMockCaller({ user: user.val });
            const input: z.infer<typeof createCommentSchema> = {
              content: faker.lorem.paragraph(),
              reviewId: review.val.id,
            };

            //Act
            const result = await caller.comment.create(input);

            //Assert
            expect(result.ok).toBe(true);

            //NOTE: Written by myself
            expect(result.unwrap().parentId).toBe(null);
            expect(result.val).toMatchObject(input);
          } else {
            throw new Error("No user or review created");
          }
        });
      });
      describe("and the user is replying to another comment", () => {
        it("should create a child comment to the parent", async () => {
          //NOTE: Copilot suggestion
          //Arrange
          const { user, review, comment } = await createTestData({
            comment: "parent_only",
          });

          if (user.some && review.some && comment.some) {
            const caller = createMockCaller({ user: user.val });
            const input: z.infer<typeof createCommentSchema> = {
              content: faker.lorem.paragraph(),
              reviewId: review.unwrap().id,
              parentId: comment.unwrap().id,
            };

            //Act
            const result = await caller.comment.create(input);

            //Assert
            expect(result.ok).toBe(true);
            expect(result.unwrap().parentId).toBe(comment.val.id);
            expect(result.val).toMatchObject(input);
          } else {
            throw new Error("No user, review or comment created");
          }
        });
      });
    });
  });
});

describe("When retrieving a comment by Id", () => {
  describe("and the comment does not exist", () => {
    it("should return an error", async () => {
      //NOTE: Written by myself
      //Act
      const result = await authenticatedCaller.comment.getById({
        id: createId(),
      });

      //Assert
      expect(result.ok).toBe(false);
    });
  });
  describe("and the comment exists", () => {
    it("should return the comment", async () => {
      //NOTE: Written by myself
      //Arrange
      const { comment } = await createTestData({ comment: "parent_only" });

      if (comment.some) {
        //Act
        const result = await authenticatedCaller.comment.getById({
          id: comment.val.id,
        });

        //Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject(comment.val);
      } else {
        throw new Error("No comment created");
      }
    });
  });
});

describe("When retrieving all comments", () => {
  describe("and there are no comments", () => {
    it("should return an empty array", async () => {
      //NOTE: Copilot suggestion
      //Act
      const result = await authenticatedCaller.comment.getAll();

      //Assert
      expect(result.ok).toBe(true);
      expect(result.val).toEqual([]);
    });
  });
  describe("and there are comments", () => {
    it("should return all comments", async () => {
      //NOTE: Copilot suggestion
      //Arrange
      await prisma.comment.deleteMany();
      const { comment } = await createTestData({ comment: "parent_only" });

      if (comment.some) {
        //Act
        const result = await authenticatedCaller.comment.getAll();

        //Assert
        expect(result.ok).toBe(true);
        expect(result.val).toEqual([comment.val]);
      } else {
        throw new Error("No comment created");
      }
    });
  });
});

describe("When deleting a comment", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //Act
      const result = unauthorizedCaller.comment.delete({ id: createId() });

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the comment does not exist", () => {
      it("should return an error", async () => {
        //NOTE: Copilot suggestion
        //Act
        //NOTE: Written by myself
        const result = await authenticatedCaller.comment.delete({
          id: createId(),
        });

        //Assert
        //NOTE: Written by myself
        expect(result.ok).toBe(false);
      });
    });
    describe("and the comment exists", () => {
      describe("and the user is not the author", () => {
        it("should return an error", async () => {
          //NOTE: Copilot suggestion
          //Arrange
          const { comment } = await createTestData({ comment: "parent_only" });

          if (comment.some) {
            const caller = createMockCaller({ user: mockUser });

            //Act
            const result = await caller.comment.delete({
              id: comment.val.id,
            });

            //Assert
            expect(result.ok).toBe(false);
          } else {
            throw new Error("No comment created");
          }
        });
      });
      describe("and the user is the author", () => {
        describe("and the comment has no children", () => {
          it("should delete the comment", async () => {
            //NOTE: Copilot suggestion
            //Arrange
            const { comment, user } = await createTestData({
              comment: "parent_only",
            });

            if (comment.some) {
              const caller = createMockCaller({ user: user.unwrap() });

              //Act
              const result = await caller.comment.delete({
                id: comment.val.id,
              });

              //Assert
              expect(result.ok).toBe(true);
            } else {
              throw new Error("No comment created");
            }
          });
        });
        describe("and the comment has children", () => {
          it("should soft delete the comment and keep the connection with the children", async () => {
            //NOTE: Copilot suggestion
            //Arrange
            const { comment, user, child } = await createTestData({
              comment: "child",
            });

            if (comment.some && child.some) {
              const caller = createMockCaller({ user: user.unwrap() });

              const initialGames = await caller.comment.getAll();
              //Act
              const result = await caller.comment.delete({
                id: comment.val.id,
              });

              const childResult = await prisma.comment.findUnique({
                where: { id: child.unwrap().id },
              });

              const deletedGameTRPC = await caller.comment.getById({
                id: comment.unwrap().id,
              });

              //Ensure comment still exists in the database
              const deletedGamePrisma = await prisma.comment.findDeletedUnique({
                where: { id: comment.unwrap().id },
              });

              //Assert
              expect(result.ok).toBe(true);
              expect(deletedGameTRPC.ok).toBe(false);
              expect(deletedGamePrisma).not.toBe(null);
              expect(childResult?.parentId).not.toBe(null);
            } else {
              throw new Error("No comment created");
            }
          });
        });
      });
    });
  });
});

describe("When updating a comment", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //NOTE: Copilot suggestion
      //Act
      const result = unauthorizedCaller.comment.update({
        id: createId(),
        content: faker.lorem.paragraph(),
      });

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the comment does not exist", () => {
      it("should return an error", async () => {
        //NOTE: Copilot suggestion
        //Act
        const result = await authenticatedCaller.comment.update({
          id: createId(),
          content: faker.lorem.paragraph(),
        });

        //Assert
        expect(result.ok).toBe(false);
      });
    });
    describe("and the comment exists", () => {
      describe("and the user is not the author", () => {
        it("should return an error", async () => {
          //NOTE: Copilot suggestion
          //Arrange
          const { comment } = await createTestData({ comment: "parent_only" });

          if (comment.some) {
            const caller = createMockCaller({ user: mockUser });

            //Act
            const result = await caller.comment.update({
              id: comment.val.id,
              content: faker.lorem.paragraph(),
            });

            //Assert
            expect(result.ok).toBe(false);
          } else {
            throw new Error("No comment created");
          }
        });
      });
      describe("and the user is the author", () => {
        describe("and the comment has been soft deleted", () => {
          it("should return an error", async () => {
            //NOTE: Copilot suggestion
            //Arrange
            const { comment, user } = await createTestData({
              comment: "parent_only",
            });

            if (comment.some) {
              const caller = createMockCaller({ user: user.unwrap() });

              //NOTE: Written by myself
              //Act
              await caller.comment.delete({
                id: comment.val.id,
              });

              const result = await caller.comment.update({
                id: comment.val.id,
                content: faker.lorem.paragraph(),
              });

              //Assert
              expect(result.ok).toBe(false);
            } else {
              throw new Error("No comment created");
            }
          });
        });
        describe("and the comment has not been soft deleted", () => {
          it("should update the comment", async () => {
            //NOTE: Copilot suggestion
            //Arrange
            const { comment, user } = await createTestData({
              comment: "parent_only",
            });

            if (comment.some) {
              const caller = createMockCaller({ user: user.unwrap() });

              //Act
              const result = await caller.comment.update({
                id: comment.val.id,
                content: faker.lorem.paragraph(),
              });

              //Assert
              expect(result.ok).toBe(true);
            } else {
              throw new Error("No comment created");
            }
          });
        });
      });
    });
  });
});
describe("When liking a comment", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //NOTE: Copilot suggestion
      //Act
      const result = unauthorizedCaller.comment.like({ id: createId() });

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the comment does not exist", () => {
      it("should return an error", async () => {
        //NOTE: Copilot suggestion
        //Act
        const result = await authenticatedCaller.comment.like({
          id: createId(),
        });

        //Assert
        expect(result.ok).toBe(false);
      });
    });
    describe("and the comment has been soft deleted", () => {
      it("should return an error", async () => {
        //NOTE: Copilot suggestion
        //Arrange
        const { comment } = await createTestData({
          comment: "parent_only",
        });

        if (comment.some) {
          //NOTE: Written by myself
          await prisma.comment.softDelete({ where: { id: comment.val.id } });

          const result = await authenticatedCaller.comment.like({
            id: comment.val.id,
          });

          //Assert
          expect(result.ok).toBe(false);
        } else {
          throw new Error("No comment created");
        }
      });
    });
    describe("and the comment has not been soft deleted", () => {
      describe("and the user hasn't liked the comment before", () => {
        it("should like the comment", async () => {
          //NOTE: Copilot suggestion
          //Arrange
          const { comment, user } = await createTestData({
            comment: "parent_only",
          });

          if (comment.some) {
            const caller = createMockCaller({ user: user.unwrap() });

            //Act
            const result = await caller.comment.like({
              id: comment.val.id,
            });

            //Assert
            expect(result.ok).toBe(true);
          } else {
            throw new Error("No comment created");
          }
        });
      });
      describe("and the user has liked the comment before", () => {
        it("should return an error", async () => {
          //NOTE: Copilot suggestion
          //Arrange
          const { comment, user } = await createTestData({
            comment: "parent_only",
          });

          if (comment.some) {
            const caller = createMockCaller({ user: user.unwrap() });

            //Act
            await caller.comment.like({
              id: comment.val.id,
            });

            const result = await caller.comment.like({
              id: comment.val.id,
            });

            const commentResult = await prisma.comment.findUnique({
              where: { id: comment.unwrap().id },
              include: { likes: true },
            });

            //Assert
            expect(result.ok).toBe(false);
            expect(commentResult?.likes.length).toBe(1);
          } else {
            throw new Error("No comment created");
          }
        });
      });
    });
  });
});

describe("When unliking a comment", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      //NOTE: Copilot suggestion
      //Act
      const result = unauthorizedCaller.comment.unlike({ id: createId() });

      //Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the comment does not exist", () => {
      it("should return an error", async () => {
        //NOTE: Copilot suggestion
        //Act
        const result = await authenticatedCaller.comment.unlike({
          id: createId(),
        });

        //Assert
        expect(result.ok).toBe(false);
      });
    });
  });
  describe("and the comment has been soft deleted", () => {
    it("should return an error", async () => {
      //NOTE: Copilot suggestion
      //Arrange
      const { comment } = await createTestData({
        comment: "parent_only",
      });

      if (comment.some) {
        //NOTE: Written by myself
        await prisma.comment.softDelete({ where: { id: comment.val.id } });

        const result = await authenticatedCaller.comment.unlike({
          id: comment.val.id,
        });

        const deletedComment = await prisma.comment.findDeletedUnique({
          where: { id: comment.unwrap().id },
        });

        //Assert
        expect(result.ok).toBe(false);
        expect(deletedComment).not.toBe(null);
      } else {
        throw new Error("No comment created");
      }
    });
  });
  describe("and the comment has not been soft deleted", () => {
    describe("and the user hasn't liked the comment before", () => {
      it("should return an error", async () => {
        //NOTE: Copilot suggestion
        //Arrange
        const { comment } = await createTestData({
          comment: "parent_only",
        });

        if (comment.some) {
          //Act
          const result = await authenticatedCaller.comment.unlike({
            id: comment.val.id,
          });

          //Assert
          expect(result.ok).toBe(false);
        } else {
          throw new Error("No comment created");
        }
      });
    });
    describe("and the user has liked the comment before", () => {
      it("should unlike the comment", async () => {
        //NOTE: Copilot suggestion
        //Arrange
        const { comment, user } = await createTestData({
          comment: "parent_only",
        });

        if (comment.some) {
          const caller = createMockCaller({ user: user.unwrap() });

          //Act
          await caller.comment.like({
            id: comment.val.id,
          });

          const result = await caller.comment.unlike({
            id: comment.val.id,
          });

          const commentResult = await prisma.comment.findUnique({
            where: { id: comment.unwrap().id },
            include: { likes: true },
          });

          //Assert
          expect(result.ok).toBe(true);
          expect(commentResult?.likes.length).toBe(0);
        } else {
          throw new Error("No comment created");
        }
      });
    });
  });
});

describe("When retrieving a comment's details", () => {
  describe("and the comment does not exist", () => {
    it("should return an error", async () => {
      //NOTE: Copilot suggestion
      //Act
      const result = await authenticatedCaller.comment.getDetails({
        id: createId(),
      });

      //Assert
      expect(result.ok).toBe(false);
    });
  });
  describe("and the comment exists", () => {
    describe("and the comment has been soft deleted", () => {
      it("should return an error", async () => {
        //NOTE: Copilot suggestion
        //Arrange
        const { comment } = await createTestData({
          comment: "parent_only",
        });

        if (comment.some) {
          await prisma.comment.softDelete({ where: { id: comment.val.id } });

          const result = await authenticatedCaller.comment.getDetails({
            id: comment.val.id,
          });

          //Assert
          expect(result.ok).toBe(false);
        } else {
          throw new Error("No comment created");
        }
      });
    });
  });
  describe("and the comment has not been soft deleted", () => {
    it("should return the comment's details", async () => {
      //NOTE: Copilot suggestion
      //Arrange
      const { comment, child, user } = await createTestData({
        comment: "child",
      });

      if (comment.some && child.some && user.some) {
        const result = await authenticatedCaller.comment.getDetails({
          id: comment.val.id,
        });

        const expectedComment: CommentDetails = {
          _count: {
            likes: 0,
          },
          id: comment.val.id,
          user: {
            id: user.val.id,
            name: user.val.name,
            image: user.val.image,
          },
          reviewId: comment.val.reviewId,
          children: [
            {
              _count: {
                likes: 0,
              },
              user: {
                id: user.val.id,
                name: user.val.name,
                image: user.val.image,
              },
              id: child.val.id,
              reviewId: comment.val.reviewId,
              parentId: comment.val.id,
              content: child.val.content,
              createdAt: child.val.createdAt,
              updatedAt: child.val.updatedAt,
            },
          ],
          createdAt: comment.val.createdAt,
          updatedAt: comment.val.updatedAt,
          parentId: comment.val?.parentId ?? null,
          content: comment.val.content,
        };
        //Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject(expectedComment);
      } else {
        throw new Error("No comment created");
      }
    });
  });
});
