/* eslint-disable testing-library/no-await-sync-query */
// BEGIN_COPILOT_CODE
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import type { Session } from "next-auth";
import type { User } from "next-auth";
import type { Comment } from "@prisma/client";
import type { z } from "zod";
import type { createCommentSchema } from "~/lib/validations/comment";

let reviewId: string;

// END_COPILOT_CODE

//BEGIN_NON_COPILOT_CODE
// For some reason, it couldn't write these functions properly, even with the reference
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

  const review = await prisma.review.create({
    data: {
      content: faker.lorem.words(),
      rating: 5,
      game: {
        connect: {
          id: game.id,
        },
      },
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  reviewId = review.id;
});

afterAll(async () => {
  const deleteComments = prisma.comment.deleteMany({
    where: { children: { none: {} } },
  });
  const deleteNextComments = prisma.comment.deleteMany();

  await prisma.$transaction([deleteComments, deleteNextComments]);
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
});
// END_NON_COPILOT_CODE

// BEGIN_COPILOT_CODE
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

const otherAuthenticatedCaller = appRouter.createCaller({
  session: mockOtherSession,
  prisma: prisma,
});

const adminCaller = appRouter.createCaller({
  session: mockAdminSession,
  prisma: prisma,
});

const unauthenticatedCaller = appRouter.createCaller({
  prisma: prisma,
  session: null,
});

describe("When creating a review", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.comment.create({
        reviewId: reviewId,
        content: faker.lorem.words(),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the review does not exist", () => {
      it("should return an error", async () => {
        // Arrange
        const comment: z.infer<typeof createCommentSchema> = {
          reviewId: createId(), // This ID does not exist
          content: faker.lorem.words(),
        };

        // Act
        const result = await authenticatedCaller.comment.create(comment);

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the review exists", () => {
      it("should create a comment", async () => {
        // Arrange
        const comment: z.infer<typeof createCommentSchema> = {
          reviewId: reviewId,
          content: faker.lorem.words(),
        };

        // Act
        const result = await authenticatedCaller.comment.create(comment);

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject(comment);
      });
    });
  });
});

describe("When retrieving a comment by Id", () => {
  describe("and the comment does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await unauthenticatedCaller.comment.getById({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the comment exists", () => {
    it("should return a comment", async () => {
      // Arrange
      const comment: Comment = await prisma.comment.create({
        data: {
          content: faker.lorem.words(),
          reviewId: reviewId,
          userId: mockUser.id,
        },
      });

      // Act
      const result = await authenticatedCaller.comment.getById({
        id: comment.id,
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(comment);
    });
  });

  describe("and the comment has been soft deleted", () => {
    it("should return an error", async () => {
      // Arrange
      const comment: Comment = await prisma.comment.create({
        data: {
          content: faker.lorem.words(),
          reviewId: reviewId,
          userId: mockUser.id,
          deleted: new Date(),
        },
      });

      // Act
      const result = await authenticatedCaller.comment.getById({
        id: comment.id,
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });
});

describe("When retrieving all comments", () => {
  describe("and there are no comments", () => {
    it("should return an empty array", async () => {
      // Arrange
      await prisma.comment.deleteMany({
        where: { children: { none: {} } },
      });
      await prisma.comment.deleteMany();

      // Act
      const result = await unauthenticatedCaller.comment.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
    });
  });

  describe("and there are comments", () => {
    it("should return an array of comments", async () => {
      // Arrange
      const comments: Array<Omit<Comment, "id">> = [
        {
          content: faker.lorem.words(),
          // REWRITE_1: add createdAt and updatedAt and parentId
          createdAt: new Date(),
          updatedAt: new Date(),
          parentId: null,
          reviewId: reviewId,
          userId: mockUser.id,
          deleted: null,
        },
        {
          content: faker.lorem.words(),
          reviewId: reviewId,
          createdAt: new Date(),
          updatedAt: new Date(),
          parentId: null,
          userId: mockUser.id,
          deleted: null,
        },
      ];

      await prisma.comment.createMany({
        data: comments,
      });

      // Act
      const result = await authenticatedCaller.comment.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toHaveLength(comments.length);
    });
  });

  describe("and some comments have been soft deleted", () => {
    it("should return only comments that have not been soft deleted", async () => {
      // Arrange
      //REWRITE_2: delete all comments
      await prisma.comment.deleteMany();

      const comments: Array<Omit<Comment, "id">> = [
        {
          content: faker.lorem.words(),
          reviewId: reviewId,
          createdAt: new Date(),
          updatedAt: new Date(),
          parentId: null,
          userId: mockUser.id,
          deleted: null,
        },
        {
          content: faker.lorem.words(),
          reviewId: reviewId,
          createdAt: new Date(),
          updatedAt: new Date(),
          parentId: null,
          userId: mockUser.id,
          deleted: new Date(),
        },
      ];

      await prisma.comment.createMany({
        data: comments,
      });

      // Act
      const result = await authenticatedCaller.comment.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toHaveLength(1);
    });
  });
});

describe("When updating a comment", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.comment.update({
        id: createId(),
        content: faker.lorem.words(),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the comment does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.comment.update({
          id: createId(),
          content: faker.lorem.words(),
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the comment exists", () => {
      describe("and the user is not the author of the comment", () => {
        it("should return an error", async () => {
          // Arrange
          const comment: Comment = await prisma.comment.create({
            data: {
              content: faker.lorem.words(),
              reviewId: reviewId,
              userId: mockUser.id,
              deleted: null,
            },
          });

          // Act
          const result = await otherAuthenticatedCaller.comment.update({
            id: comment.id,
            content: faker.lorem.words(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user is an admin", () => {
        it("should update the comment", async () => {
          // Arrange
          const comment: Comment = await prisma.comment.create({
            data: {
              content: faker.lorem.words(),
              reviewId: reviewId,
              userId: mockUser.id,
              deleted: null,
            },
          });

          const updatedContent = faker.lorem.words();

          // Act
          const result = await adminCaller.comment.update({
            id: comment.id,
            content: updatedContent,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.unwrap().content).toBe(updatedContent);
        });
      });

      describe("and the user is the author of the comment", () => {
        it("should update the comment", async () => {
          // Arrange
          const comment: Comment = await prisma.comment.create({
            data: {
              content: faker.lorem.words(),
              reviewId: reviewId,
              userId: mockUser.id,
              deleted: null,
            },
          });

          const updatedContent = faker.lorem.words();

          // Act
          const result = await authenticatedCaller.comment.update({
            id: comment.id,
            content: updatedContent,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.unwrap().content).toBe(updatedContent);
        });
      });

      describe("and the comment has been soft deleted", () => {
        it("should return an error", async () => {
          // Arrange
          const comment: Comment = await prisma.comment.create({
            data: {
              content: faker.lorem.words(),
              reviewId: reviewId,
              userId: mockUser.id,
              deleted: new Date(),
            },
          });

          const updatedContent = faker.lorem.words();

          // Act
          const result = await authenticatedCaller.comment.update({
            id: comment.id,
            content: updatedContent,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });
    });
  });
});

describe("When deleting a comment", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.comment.delete({
        id: createId(),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the comment does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.comment.delete({
          id: createId(),
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the comment exists", () => {
      describe("and the user is not the author of the comment", () => {
        it("should return an error", async () => {
          // Arrange
          const comment: Comment = await prisma.comment.create({
            data: {
              content: faker.lorem.words(),
              reviewId: reviewId,
              userId: mockUser.id,
              deleted: null,
            },
          });

          // Act
          const result = await otherAuthenticatedCaller.comment.delete({
            id: comment.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the comment has already been deleted", () => {
        it("should return an error", async () => {
          // Arrange
          const comment: Comment = await prisma.comment.create({
            data: {
              content: faker.lorem.words(),
              reviewId: reviewId,
              userId: mockUser.id,
              deleted: new Date(),
            },
          });

          // Act
          const result = await authenticatedCaller.comment.delete({
            id: comment.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user is the author of the comment", () => {
        it("should soft delete the comment", async () => {
          // Arrange
          const comment: Comment = await prisma.comment.create({
            data: {
              content: faker.lorem.words(),
              reviewId: reviewId,
              userId: mockUser.id,
              deleted: null,
            },
          });

          // Act
          const result = await authenticatedCaller.comment.delete({
            id: comment.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          const updatedComment = await prisma.comment.findUnique({
            where: { id: comment.id },
          });
          expect(updatedComment?.deleted).not.toBeNull();
        });
      });

      describe("and the user is an admin", () => {
        it("should soft delete the comment", async () => {
          // Arrange
          const comment: Comment = await prisma.comment.create({
            data: {
              content: faker.lorem.words(),
              reviewId: reviewId,
              userId: mockUser.id,
              deleted: null,
            },
          });

          // Act
          const result = await adminCaller.comment.delete({
            id: comment.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          const updatedComment = await prisma.comment.findUnique({
            where: { id: comment.id },
          });
          expect(updatedComment?.deleted).not.toBeNull();
        });
      });
    });
  });
});

describe("When liking a comment", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.comment.like({
        id: createId(),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the comment does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.comment.like({
          id: createId(),
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the comment exists", () => {
      describe("and the comment has been soft deleted", () => {
        it("should return an error", async () => {
          // Arrange
          const comment: Comment = await prisma.comment.create({
            data: {
              content: faker.lorem.words(),
              reviewId: reviewId,
              userId: mockUser.id,
              deleted: new Date(),
            },
          });

          // Act
          const result = await authenticatedCaller.comment.like({
            id: comment.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user has already liked the comment", () => {
        it("should return an error", async () => {
          // Arrange
          const comment: Comment = await prisma.comment.create({
            data: {
              content: faker.lorem.words(),
              reviewId: reviewId,
              userId: mockUser.id,
              deleted: null,
            },
          });

          await authenticatedCaller.comment.like({
            id: comment.id,
          });

          // Act
          const result = await authenticatedCaller.comment.like({
            id: comment.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user has not liked the comment", () => {
        it("should like the comment", async () => {
          // Arrange
          const comment: Comment = await prisma.comment.create({
            data: {
              content: faker.lorem.words(),
              reviewId: reviewId,
              userId: mockUser.id,
              deleted: null,
            },
          });

          // Act
          const result = await authenticatedCaller.comment.like({
            id: comment.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(
            result.unwrap().likes.some((like) => like.userId === mockUser.id)
          ).toBe(true);
        });
      });
    });
  });
});

describe("When unliking a comment", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.comment.unlike({
        id: createId(),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the comment does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.comment.unlike({
          id: createId(),
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the comment exists", () => {
      describe("and the user has never liked the comment", () => {
        it("should return an error", async () => {
          // Arrange
          const comment: Comment = await prisma.comment.create({
            data: {
              content: faker.lorem.words(),
              reviewId: reviewId,
              userId: mockUser.id,
              deleted: null,
            },
          });

          // Act
          const result = await otherAuthenticatedCaller.comment.unlike({
            id: comment.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user has liked the comment before", () => {
        it("should remove the like", async () => {
          // Arrange
          const comment: Comment = await prisma.comment.create({
            data: {
              content: faker.lorem.words(),
              reviewId: reviewId,
              userId: mockUser.id,
              deleted: null,
            },
          });

          await authenticatedCaller.comment.like({
            id: comment.id,
          });

          // Act
          const result = await authenticatedCaller.comment.unlike({
            id: comment.id,
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

describe("When retrieving the details of a comment", () => {
  describe("and the comment does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const commentId = createId();

      // Act
      const result = await unauthenticatedCaller.comment.getDetails({
        id: commentId,
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the comment exists", () => {
    describe("and the comment has been soft deleted", () => {
      it("should return an error", async () => {
        // Arrange
        const comment: Comment = await prisma.comment.create({
          data: {
            content: faker.lorem.words(),
            reviewId: reviewId,
            userId: mockUser.id,
            deleted: new Date(),
          },
        });

        // Act
        const result = await unauthenticatedCaller.comment.getDetails({
          id: comment.id,
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the comment has not been soft deleted", () => {
      it("should return the comment details, including children and likes", async () => {
        // Arrange
        const parentComment: Comment = await prisma.comment.create({
          data: {
            content: faker.lorem.words(),
            reviewId: reviewId,
            userId: mockUser.id,
            deleted: null,
          },
        });

        const childComment: Comment = await prisma.comment.create({
          data: {
            content: faker.lorem.words(),
            reviewId: reviewId,
            userId: mockUser.id,
            deleted: null,
            parentId: parentComment.id,
          },
        });

        await authenticatedCaller.comment.like({
          id: childComment.id,
        });

        // Act
        const result = await unauthenticatedCaller.comment.getDetails({
          id: parentComment.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap().id).toBe(parentComment.id);
        expect(result.unwrap()?.children[0]?.id).toBe(childComment.id);
        expect(result.unwrap()?.children[0]?._count.likes).toBe(1);
      });
    });
  });
});
// END_COPILOT_CODE
