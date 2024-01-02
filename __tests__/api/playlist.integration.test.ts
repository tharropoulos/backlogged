/* eslint-disable testing-library/no-await-sync-query */
// BEGIN_COPILOT_CODE
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import type { Session } from "next-auth";
import type { User } from "next-auth";
import { array, type z } from "zod";
import type { createPlaylistSchema } from "~/lib/validations/playlist";
import { Playlist } from "@prisma/client";
import { create } from "domain";

const gameIds: string[] = [];

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

// END_COPILOT_CODE
// BEGIN_NON_COPILOT_CODE
// why can't it just figure this simple thing out?
const mockAdmin: User = {
  role: "Admin",
  id: createId(),
  email: faker.internet.email(),
  image: faker.image.url(),
  name: faker.person.firstName(),
};

const mockOtherSession: Session = {
  expires: new Date().toISOString(),
  user: mockOtherUser,
};

const otherAuthenticatedCaller = appRouter.createCaller({
  session: mockOtherSession,
  prisma: prisma,
});
// END_NON_COPILOT_CODE

// BEGIN_COPILOT_CODE
const mockSession: Session = {
  expires: new Date().toISOString(),
  user: mockUser,
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

const unauthenticatedCaller = appRouter.createCaller({
  prisma: prisma,
  session: null,
});

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

  const games = await prisma.game.createMany({
    data: Array.from({ length: 5 }, () => ({
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      coverImage: faker.image.url(),
      backgroundImage: faker.image.url(),
      releaseDate: new Date(),
      publisherId: publisher.id,
      franchiseId: franchise.id,
    })),
  });

  await Promise.all(
    Array.from({ length: 5 }, async () => {
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
      gameIds.push(game.id);
    })
  );
});

afterAll(async () => {
  const deletePlaylists = prisma.playlist.deleteMany();
  const deleteGames = prisma.game.deleteMany();
  const deletePublishers = prisma.publisher.deleteMany();
  const deleteFranchises = prisma.franchise.deleteMany();
  const deleteUserFollows = prisma.follows.deleteMany();
  const deleteUsers = prisma.user.deleteMany();

  await prisma.$transaction([
    deletePlaylists,
    deleteGames,
    deletePublishers,
    deleteFranchises,
    deleteUserFollows,
    deleteUsers,
  ]);
});

describe("When creating a playlist", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.playlist.create({
        // REWRITE_1: add visibility
        visibility: "PUBLIC",
        name: faker.lorem.words(3),
        description: faker.lorem.words(),
        type: "CUSTOM",
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    it("should create a playlist", async () => {
      // Arrange
      const playlist: z.infer<typeof createPlaylistSchema> = {
        visibility: "PUBLIC",
        name: faker.lorem.words(3),
        description: faker.lorem.words(),
        type: "CUSTOM",
      };

      // Act
      const result = await authenticatedCaller.playlist.create(playlist);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.val).toMatchObject(playlist);
        expect(result.val.type).toBe("CUSTOM");
      }
    });
  });
});

describe("When getting a playlist by id", () => {
  describe("and the playlist does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await authenticatedCaller.playlist.getById({
        // REWRITE_4: use createId
        id: createId(),
        // id: "nonexistent-id",
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the playlist exists", () => {
    describe("and the playlist is deleted", () => {
      it("should return an error", async () => {
        // Arrange
        const playlist = await prisma.playlist.create({
          data: {
            name: faker.lorem.words(3),
            description: faker.lorem.words(),
            type: "CUSTOM",
            visibility: "PUBLIC",
            user: { connect: { id: mockAdmin.id } },
            deleted: new Date(),
          },
        });

        // Act
        const result = await authenticatedCaller.playlist.getById({
          id: playlist.id,
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the playlist is public", () => {
      it("should return the playlist", async () => {
        // Arrange
        const playlist = await prisma.playlist.create({
          data: {
            name: faker.lorem.words(3),
            description: faker.lorem.words(),
            type: "CUSTOM",
            visibility: "PUBLIC",
            userId: mockAdmin.id,
          },
        });

        // Act
        const result = await unauthenticatedCaller.playlist.getById({
          id: playlist.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject(playlist);
      });
    });

    describe("and the playlist is private", () => {
      describe("and the user is the creator", () => {
        it("should return the playlist", async () => {
          // Arrange
          const playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(3),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PRIVATE",
              userId: mockUser.id,
            },
          });

          // Act
          const result = await authenticatedCaller.playlist.getById({
            id: playlist.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(playlist);
        });
      });
      describe("and the user is not the creator", () => {
        it("should return an error", async () => {
          // Arrange
          const playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(3),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PRIVATE",
              user: { connect: { id: mockAdmin.id } },
            },
          });

          // Act
          const result = await authenticatedCaller.playlist.getById({
            id: playlist.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });
    });
    describe("and the playlist is followers only", () => {
      describe("and the user is not following the creator", () => {
        it("should return an error", async () => {
          // Arrange
          const playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(3),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "FOLLOWERS_ONLY",
              // REWRITE_2: use connect
              //   userId: admin.id,
              // REWRITE_3: use mockAdmin
              user: { connect: { id: mockAdmin.id } },
            },
          });

          // Act
          const result = await authenticatedCaller.playlist.getById({
            id: playlist.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      // END_COPILOT_CODE
      // BEGIN_COPILOT_SUGGESTION
      describe("and the user is the creator", () => {
        it("should return the playlist", async () => {
          // Arrange
          const playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(3),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "FOLLOWERS_ONLY",
              userId: mockUser.id,
            },
          });

          // Act
          const result = await authenticatedCaller.playlist.getById({
            id: playlist.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(playlist);
        });
      });
      // END_COPILOT_SUGGESTION
      // BEGIN_COPILOT_CODE
      describe("and the suer is following the creator", () => {
        it("should return the playlist", async () => {
          // Arrange
          const playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(3),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "FOLLOWERS_ONLY",
              user: {
                connect: { id: mockAdmin.id },
              },
            },
          });

          await prisma.user.update({
            where: { id: mockAdmin.id },
            data: {
              followers: {
                create: [
                  {
                    follower: {
                      connect: {
                        id: mockUser.id,
                      },
                    },
                  },
                ],
              },
            },
          });

          // Act
          const result = await authenticatedCaller.playlist.getById({
            id: playlist.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(playlist);
        });
      });
    });
  });
});

describe("When getting all playlists", () => {
  describe("and there are no playlists", () => {
    it("should return an empty array", async () => {
      // Arrange
      // REWRITE_5: delete all playlists
      await prisma.playlist.deleteMany();
      // Act
      const result = await authenticatedCaller.playlist.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toEqual([]);
    });
  });

  describe("and there are playlists", () => {
    describe("and some playlists are deleted", () => {
      it("should not return the deleted playlists", async () => {
        // Arrange
        await prisma.playlist.create({
          data: {
            name: faker.lorem.words(3),
            description: faker.lorem.words(),
            type: "CUSTOM",
            visibility: "PUBLIC",
            user: { connect: { id: mockAdmin.id } },
            deleted: new Date(),
          },
        });

        // Act
        const result = await authenticatedCaller.playlist.getAll();

        // Assert
        expect(result.ok).toBe(true);
        // END_COPILOT_CODE

        // BEGIN_NON_COPILOT_CODE
        // especially wrong
        if (result.ok) {
          expect(result.val.map((playlist) => playlist.deleted)).toEqual([]);
        }
        // END_NON_COPILOT_CODE

        // BEGIN_COPILOT_CODE
      });
    });

    describe("and some playlists are public", () => {
      it("should return the public playlists", async () => {
        // Arrange
        const playlist = await prisma.playlist.create({
          data: {
            name: faker.lorem.words(3),
            description: faker.lorem.words(),
            type: "CUSTOM",
            visibility: "PUBLIC",
            user: { connect: { id: mockAdmin.id } },
          },
        });

        // Act
        const result = await authenticatedCaller.playlist.getAll();

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toContainEqual(
          expect.objectContaining({ id: playlist.id })
        );
      });
    });

    describe("and some playlists are private", () => {
      describe("and the user is the creator", () => {
        it("should return the private playlists", async () => {
          // Arrange
          const playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(3),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PRIVATE",
              // MANUAL_REWRITE: use mockAdmin, copilot is incredibly wrong in its suggestion, ensure that there are no private playlists for mockUser
              user: { connect: { id: mockAdmin.id } },
            },
          });

          // Act
          // MANUAL_REWRITE: use mockAdmin, copilot is incredibly wrong in its suggestion, ensure that there are no private playlists for mockUser
          const result = await adminCaller.playlist.getAll();

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toContainEqual(
            expect.objectContaining({ id: playlist.id })
          );
        });
      });

      describe("and the user is not the creator", () => {
        it("should not return the private playlists", async () => {
          // Arrange
          await prisma.playlist.create({
            data: {
              name: faker.lorem.words(3),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PRIVATE",
              user: { connect: { id: mockAdmin.id } },
            },
          });

          // Act
          const result = await authenticatedCaller.playlist.getAll();

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).not.toContainEqual(
            expect.objectContaining({ visibility: "PRIVATE" })
          );
        });
      });
    });

    describe("and some playlists are followers only", () => {
      describe("and the user is not following the creator", () => {
        it("should not return the followers only playlists", async () => {
          // Arrange
          await prisma.playlist.create({
            data: {
              name: faker.lorem.words(3),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "FOLLOWERS_ONLY",
              user: { connect: { id: mockAdmin.id } },
            },
          });

          // MANUAL_REWRITE: remove the follow from the admin
          await prisma.user.update({
            where: { id: mockAdmin.id },
            data: {
              followers: {
                deleteMany: {},
              },
            },
          });

          // Act
          const result = await authenticatedCaller.playlist.getAll();

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).not.toContainEqual(
            expect.objectContaining({ visibility: "FOLLOWERS_ONLY" })
          );
        });
      });

      describe("and the user is following the creator", () => {
        it("should return the followers only playlists", async () => {
          // Arrange
          const playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(3),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "FOLLOWERS_ONLY",
              user: { connect: { id: mockAdmin.id } },
            },
          });

          await prisma.user.update({
            where: { id: mockAdmin.id },
            data: {
              followers: {
                create: [
                  {
                    follower: {
                      connect: {
                        id: mockUser.id,
                      },
                    },
                  },
                ],
              },
            },
          });

          // Act
          const result = await authenticatedCaller.playlist.getAll();

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toContainEqual(
            expect.objectContaining({ id: playlist.id })
          );
        });
      });
    });
  });
});

describe("When updating a playlist", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.playlist.update({
        id: createId(),
        name: faker.lorem.words(),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the playlist does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.playlist.update({
          id: createId(),
          name: faker.lorem.words(),
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the playlist exists", () => {
      describe("and the playlist has been marked as deleted", () => {
        it("should return an error", async () => {
          // Arrange
          const playlist: Playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
              deleted: new Date(),
            },
          });

          const updatedName = faker.lorem.words();

          // Act
          const result = await authenticatedCaller.playlist.update({
            id: playlist.id,
            name: updatedName,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });
      describe("and the user is not the creator of the playlist", () => {
        it("should return an error", async () => {
          // Arrange
          const playlist: Playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
            },
          });

          // Act
          const result = await otherAuthenticatedCaller.playlist.update({
            id: playlist.id,
            name: faker.lorem.words(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user is an admin", () => {
        it("should update the playlist", async () => {
          // Arrange
          const playlist: Playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
            },
          });

          const updatedName = faker.lorem.words();

          // Act
          const result = await adminCaller.playlist.update({
            id: playlist.id,
            name: updatedName,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.unwrap().name).toBe(updatedName);
        });
      });

      describe("and the user is the creator of the playlist", () => {
        it("should update the playlist", async () => {
          // Arrange
          const playlist: Playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
            },
          });

          const updatedName = faker.lorem.words();

          // Act
          const result = await authenticatedCaller.playlist.update({
            id: playlist.id,
            name: updatedName,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.unwrap().name).toBe(updatedName);
        });
      });
    });
  });
});

describe("When deleting a playlist", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.playlist.delete({ id: createId() });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the playlist does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.playlist.delete({
          id: createId(),
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the playlist exists", () => {
      // BEGIN_REVISION_1: add test for deleting a playlist that is already deleted
      describe("and the playlist has already been marked as deleted", () => {
        it("should return an error", async () => {
          // Arrange
          const playlist: Playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
              deleted: new Date(),
            },
          });

          // Act
          const result = await authenticatedCaller.playlist.delete({
            id: playlist.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });
      // END_REVISION_1

      describe("and the user is not the creator of the playlist", () => {
        it("should return an error", async () => {
          // Arrange
          const playlist: Playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
            },
          });

          // Act
          const result = await otherAuthenticatedCaller.playlist.delete({
            id: playlist.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user is an admin", () => {
        it("should delete the playlist", async () => {
          // Arrange
          const playlist: Playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
            },
          });

          // Act
          const result = await adminCaller.playlist.delete({ id: playlist.id });

          // Assert
          expect(result.ok).toBe(true);
        });
      });

      describe("and the user is the creator of the playlist", () => {
        it("should delete the playlist", async () => {
          // Arrange
          const playlist: Playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
            },
          });

          // Act
          const result = await authenticatedCaller.playlist.delete({
            id: playlist.id,
          });

          // Assert
          expect(result.ok).toBe(true);
        });
      });
    });
  });
});

describe("When liking a playlist", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.playlist.like({
        id: createId(),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the playlist does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.playlist.like({
          id: createId(),
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the playlist exists", () => {
      describe("and the playlist has been soft deleted", () => {
        it("should return an error", async () => {
          // Arrange
          const playlist: Playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
              deleted: new Date(),
            },
          });

          // Act
          const result = await authenticatedCaller.playlist.like({
            id: playlist.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user has already liked the playlist", () => {
        it("should return an error", async () => {
          // Arrange
          const playlist: Playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
              deleted: null,
            },
          });

          await authenticatedCaller.playlist.like({
            id: playlist.id,
          });

          // Act
          const result = await authenticatedCaller.playlist.like({
            id: playlist.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user has not liked the playlist", () => {
        it("should like the playlist", async () => {
          // Arrange
          const playlist: Playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
              deleted: null,
            },
          });

          // Act
          const result = await authenticatedCaller.playlist.like({
            id: playlist.id,
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

describe("When unliking a playlist", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.playlist.unlike({
        id: createId(),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the playlist does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.playlist.unlike({
          id: createId(),
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the playlist exists", () => {
      describe("and the user has never liked the playlist", () => {
        it("should return an error", async () => {
          // Arrange
          const playlist: Playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
              deleted: null,
            },
          });

          // Act
          const result = await otherAuthenticatedCaller.playlist.unlike({
            id: playlist.id,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user has liked the playlist before", () => {
        it("should remove the like", async () => {
          // Arrange
          const playlist: Playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
              deleted: null,
            },
          });

          await authenticatedCaller.playlist.like({
            id: playlist.id,
          });

          // Act
          const result = await authenticatedCaller.playlist.unlike({
            id: playlist.id,
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

// BEGIN_COPILOT_CODE
describe("When adding games to a playlist", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.playlist.addGames({
        // REWRITE_6: correct input params
        // playlistId: createId(),
        // games: [{ id: createId(), storeLink: faker.internet.url() }],
        id: createId(),
        gameIds: [createId()],
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the playlist does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.playlist.addGames({
          id: createId(),
          gameIds: [createId()],
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the playlist exists", () => {
      describe("and the user is not the creator of the playlist", () => {
        it("should return an error", async () => {
          // Arrange
          const playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
              deleted: null,
            },
          });

          // Act
          const result = await adminCaller.playlist.addGames({
            id: playlist.id,
            gameIds: [createId()],
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user is the creator of the playlist", () => {
        describe("and the playlist has been marked as deleted", () => {
          it("should return an error", async () => {
            // Arrange
            const playlist = await prisma.playlist.create({
              data: {
                name: faker.lorem.words(),
                description: faker.lorem.words(),
                type: "CUSTOM",
                visibility: "PUBLIC",
                userId: mockUser.id,
                deleted: new Date(),
              },
            });

            // Act
            const result = await authenticatedCaller.playlist.addGames({
              id: playlist.id,
              gameIds: [createId()],
            });

            // Assert
            expect(result.ok).toBe(false);
          });
        });

        describe("and the playlist has not been marked as deleted", () => {
          describe("and the games do not exist", () => {
            it("should return an error", async () => {
              // Arrange
              const playlist = await prisma.playlist.create({
                data: {
                  name: faker.lorem.words(),
                  description: faker.lorem.words(),
                  type: "CUSTOM",
                  visibility: "PUBLIC",
                  userId: mockUser.id,
                  deleted: null,
                },
              });

              // Act
              const result = await authenticatedCaller.playlist.addGames({
                id: playlist.id,
                gameIds: [createId()],
              });

              // Assert
              expect(result.ok).toBe(false);
            });
          });

          describe("and the games exist", () => {
            it("should add the games to the playlist in sequential order", async () => {
              // Arrange
              const playlist = await prisma.playlist.create({
                data: {
                  name: faker.lorem.words(),
                  description: faker.lorem.words(),
                  type: "CUSTOM",
                  visibility: "PUBLIC",
                  userId: mockUser.id,
                  deleted: null,
                },
              });

              function ensureOneDataTypeArray<
                T extends "string" | "number" | "object"
              >(arr: any[], type: T): arr is T[] {
                if (arr.length === 0) return false;

                return arr.every((e) => typeof e === type);
              }

              // Act
              switch (true) {
                case gameIds.length < 5:
                  throw new Error("Not enough games to test");
                case gameIds.length === 5 &&
                  ensureOneDataTypeArray(gameIds, "string"):
                  const result1 = await authenticatedCaller.playlist.addGames({
                    id: playlist.id,
                    gameIds: gameIds.slice(0, 4),
                  });

                  const result2 = await authenticatedCaller.playlist.addGames({
                    id: playlist.id,
                    gameIds: [gameIds[4]!],
                  });

                  // Assert
                  expect(result1.ok).toBe(true);
                  expect(result2.ok).toBe(true);
                  const games1 = result1.unwrap().games;
                  const games2 = result2.unwrap().games;
                  expect(games2.length).toBe(games1.length + 1);
                  expect(games1[0]?.order).toBe(0);
                  expect(games2.at(-1)?.order).toBe(4);
              }
            });
          });
        });
      });
    });
  });
});
// END_COPILOT_CODE
// BEGIN_NON_COPILOT_CODE
// It's writing nonsense here

describe("When removing games from a playlist", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.playlist.removeGames({
        id: createId(),
        gameIds: [createId()],
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the playlist does not exist", () => {
      it("should return an error", async () => {
        // BEGIN_COPILOT_SUGGESTION
        // Act
        const result = await authenticatedCaller.playlist.removeGames({
          id: createId(),
          gameIds: [createId()],
        });

        // Assert
        expect(result.ok).toBe(false);
        // END_COPILOT_SUGGESTION
      });
    });
    describe("and the playlist exists", () => {
      // BEGIN_COPILOT_SUGGESTION
      describe("and the user is not the creator of the playlist", () => {
        it("should return an error", async () => {
          // Arrange
          const playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              userId: mockUser.id,
              deleted: null,
            },
          });

          // Act
          const result = await adminCaller.playlist.removeGames({
            id: playlist.id,
            gameIds: [createId()],
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user is the creator of the playlist", () => {
        describe("and the playlist has been marked as deleted", () => {
          it("should return an error", async () => {
            // Arrange
            const playlist = await prisma.playlist.create({
              data: {
                name: faker.lorem.words(),
                description: faker.lorem.words(),
                type: "CUSTOM",
                visibility: "PUBLIC",
                userId: mockUser.id,
                deleted: new Date(),
              },
            });

            // Act
            const result = await authenticatedCaller.playlist.removeGames({
              id: playlist.id,
              gameIds: [createId()],
            });

            // Assert
            expect(result.ok).toBe(false);
          });
        });
        describe("and the playlist has not been marked as deleted", () => {
          describe("and the games do not exist", () => {
            it("should return an error", async () => {
              // Arrange
              const playlist = await prisma.playlist.create({
                data: {
                  name: faker.lorem.words(),
                  description: faker.lorem.words(),
                  type: "CUSTOM",
                  visibility: "PUBLIC",
                  userId: mockUser.id,
                  deleted: null,
                },
              });

              // Act
              const result = await authenticatedCaller.playlist.removeGames({
                id: playlist.id,
                gameIds: [createId()],
              });

              // Assert
              expect(result.ok).toBe(false);
            });
          });
          describe("and the games exist", () => {
            describe("and the games are not in the playlist", () => {
              it("should return an error", async () => {
                // Arrange
                const playlist = await prisma.playlist.create({
                  data: {
                    name: faker.lorem.words(),
                    description: faker.lorem.words(),
                    type: "CUSTOM",
                    visibility: "PUBLIC",
                    userId: mockUser.id,
                    deleted: null,
                  },
                });

                // Act
                const result = await authenticatedCaller.playlist.removeGames({
                  id: playlist.id,
                  // MANUAL_REWRITE: use gameIds
                  // gameIds: [createId()],
                  gameIds: gameIds.slice(0, 1),
                });

                // Assert
                expect(result.ok).toBe(false);
              });
            });
            describe("and the games are in the playlist", () => {
              it("should remove the games from the playlist", async () => {
                // Arrange
                const playlist = await prisma.playlist.create({
                  data: {
                    name: faker.lorem.words(),
                    description: faker.lorem.words(),
                    type: "CUSTOM",
                    visibility: "PUBLIC",
                    userId: mockUser.id,
                    deleted: null,
                  },
                });

                await authenticatedCaller.playlist.addGames({
                  id: playlist.id,
                  gameIds: gameIds,
                });

                // Act
                const result = await authenticatedCaller.playlist.removeGames({
                  id: playlist.id,
                  gameIds: gameIds.slice(0, 1),
                });

                // Assert
                expect(result.ok).toBe(true);
                const games = result.unwrap().games;
                expect(result.unwrap().games).toHaveLength(gameIds.length - 1);

                expect(games.map((game) => game.order)).toEqual(
                  games.map((game) => game.order).sort((a, b) => a - b)
                );
              });
            });
          });
        });
        // END_COPILOT_SUGGESTION
      });
    });
  });
});
// END_NON_COPILOT_CODE

// BEGIN_COPILOT_CODE
describe("When updating the order of games in a playlist", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.playlist.updateOrder({
        id: createId(),
        gameId: createId(),
        order: 1,
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the playlist does not exist", () => {
      it("should return an error", async () => {
        // Act
        const result = await authenticatedCaller.playlist.updateOrder({
          id: createId(),
          gameId: createId(),
          order: 1,
        });

        // Assert
        expect(result.ok).toBe(false);
      });
    });

    describe("and the playlist exists", () => {
      describe("and the user is not the creator of the playlist", () => {
        it("should return an error", async () => {
          // Arrange
          const playlist = await prisma.playlist.create({
            data: {
              name: faker.lorem.words(),
              description: faker.lorem.words(),
              type: "CUSTOM",
              visibility: "PUBLIC",
              // REWRITE_7: use mockAdmin
              userId: mockAdmin.id, // Different user
              deleted: null,
            },
          });

          // Act
          const result = await authenticatedCaller.playlist.updateOrder({
            id: playlist.id,
            gameId: createId(),
            order: 1,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the user is the creator of the playlist", () => {
        describe("and the playlist has been marked as deleted", () => {
          it("should return an error", async () => {
            // Arrange
            const playlist = await prisma.playlist.create({
              data: {
                name: faker.lorem.words(),
                description: faker.lorem.words(),
                type: "CUSTOM",
                visibility: "PUBLIC",
                userId: mockUser.id,
                deleted: new Date(),
              },
            });

            // Act
            const result = await authenticatedCaller.playlist.updateOrder({
              id: playlist.id,
              gameId: createId(),
              order: 1,
            });

            // Assert
            expect(result.ok).toBe(false);
          });
        });

        describe("and the playlist has not been marked as deleted", () => {
          describe("and the game does not exist", () => {
            it("should return an error", async () => {
              // Arrange
              const playlist = await prisma.playlist.create({
                data: {
                  name: faker.lorem.words(),
                  description: faker.lorem.words(),
                  type: "CUSTOM",
                  visibility: "PUBLIC",
                  userId: mockUser.id,
                  deleted: null,
                },
              });

              // Act
              const result = await authenticatedCaller.playlist.updateOrder({
                id: playlist.id,
                gameId: createId(),
                order: 1,
              });

              // Assert
              expect(result.ok).toBe(false);
            });
          });

          describe("and the game exists", () => {
            describe("and the game is not part of the playlist", () => {
              it("should return an error", async () => {
                // Arrange
                const playlist = await prisma.playlist.create({
                  data: {
                    name: faker.lorem.words(),
                    description: faker.lorem.words(),
                    type: "CUSTOM",
                    visibility: "PUBLIC",
                    userId: mockUser.id,
                    deleted: null,
                    // MANUAL_REWRITE: use actual games
                    games: {
                      create: gameIds.map((gameId, index) => ({
                        game: { connect: { id: gameId } },
                        order: index,
                      })),
                    },
                  },
                });

                // END_COPILOT_CODE

                // BEGIN_NON_COPILOT_CODE
                const game = await prisma.game.create({
                  data: {
                    name: faker.lorem.words(),
                    description: faker.lorem.words(),
                    backgroundImage: faker.internet.url(),
                    coverImage: faker.internet.url(),
                    publisher: {
                      create: {
                        name: faker.lorem.words(),
                        description: faker.lorem.words(),
                        image: faker.internet.url(),
                      },
                    },
                    franchise: {
                      create: {
                        name: faker.lorem.words(),
                        description: faker.lorem.words(),
                        image: faker.internet.url(),
                      },
                    },
                  },
                });
                // END_NON_COPILOT_CODE

                // BEGIN_COPILOT_CODE

                // Act
                const result = await authenticatedCaller.playlist.updateOrder({
                  id: playlist.id,
                  gameId: game.id, // New game ID that is not part of the playlist
                  order: 1,
                });

                // Assert
                expect(result.ok).toBe(false);
              });
            });
            describe("and the game is part of the playlist", () => {
              describe("and the new order is greater than the previous order", () => {
                it("should update the order of the game", async () => {
                  // Arrange
                  const playlist = await prisma.playlist.create({
                    data: {
                      name: faker.lorem.words(),
                      description: faker.lorem.words(),
                      type: "CUSTOM",
                      visibility: "PUBLIC",
                      userId: mockUser.id,
                      deleted: null,
                      // MANUAL_REWRITE: use actual games
                      games: {
                        create: gameIds.map((gameId, index) => ({
                          game: { connect: { id: gameId } },
                          order: index,
                        })),
                      },
                    },
                    include: {
                      games: {
                        orderBy: {
                          order: "asc",
                        },
                        include: { game: true },
                      },
                    },
                  });
                  console.log(gameIds);

                  console.log(playlist.games.map((game) => game.game));

                  // Act
                  if (gameIds.length < 5)
                    throw new Error("Not enough games to test");

                  const updateBackwards =
                    await authenticatedCaller.playlist.updateOrder({
                      id: playlist.id,
                      gameId: gameIds[4]!,
                      order: 1,
                    });

                  // Assert
                  expect(updateBackwards.ok).toBe(true);
                  // END_COPILOT_CODE

                  // BEGIN_NON_COPILOT_CODE
                  // hard to test with copilot

                  updateBackwards.unwrap().games.map((game, index) => {
                    index < 1
                      ? expect(game.gameId).toBe(gameIds[index])
                      : index === 1
                      ? expect(game.gameId).toBe(gameIds[4])
                      : expect(game.gameId).toBe(gameIds[index - 1]);
                  });
                });
              });
              describe("and the new order is less than the previous order", () => {
                it("should update the order of the game", async () => {
                  // Arrange
                  const playlist = await prisma.playlist.create({
                    data: {
                      name: faker.lorem.words(),
                      description: faker.lorem.words(),
                      type: "CUSTOM",
                      visibility: "PUBLIC",
                      userId: mockUser.id,
                      deleted: null,
                      // MANUAL_REWRITE: use actual games
                      games: {
                        create: gameIds.map((gameId, index) => ({
                          game: { connect: { id: gameId } },
                          order: index,
                        })),
                      },
                    },
                    include: {
                      games: {
                        orderBy: {
                          order: "asc",
                        },
                        include: { game: true },
                      },
                    },
                  });
                  console.log(gameIds);

                  console.log(playlist.games.map((game) => game.game));

                  // Act
                  if (gameIds.length < 5)
                    throw new Error("Not enough games to test");

                  const updateForwards =
                    await authenticatedCaller.playlist.updateOrder({
                      id: playlist.id,
                      gameId: gameIds[1]!,
                      order: 3,
                    });

                  // Assert
                  expect(updateForwards.ok).toBe(true);
                  // END_COPILOT_CODE

                  // BEGIN_NON_COPILOT_CODE
                  // hard to test with copilot

                  updateForwards.unwrap().games.map((game, index) => {
                    index < 1
                      ? expect(game.gameId).toBe(gameIds[index])
                      : index < 3
                      ? expect(game.gameId).toBe(gameIds[index + 1])
                      : index === 3
                      ? expect(game.gameId).toBe(gameIds[1])
                      : expect(game.gameId).toBe(gameIds[index]);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// test("source", async () => {
//   const data = fs.readFileSync(path.join(__dirname, "../../new.json"), "utf-8");
//   type Chat = {
//     prompt: string;
//     response: string;
//     errorDetails: null | string;
//     isCanceled: boolean;
//     vote: null | number;
//     contentReferences: {
//       path: string;
//       startLineNumber: number;
//       startColumn: number;
//       endLineNumber: number;
//       endColumn: number;
//     }[];
//   };
//
//   const routersPath = path.join(__dirname, "../../src/server/api/routers");
//   const testsPath = path.join(__dirname, "../api");
//
//   const test = await authenticatedCaller.chat.sourceFiles({
//     directoryPath: routersPath,
//   });
//   const test2 = await authenticatedCaller.chat.sourceFiles({
//     directoryPath: testsPath,
//   });
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//   const chats: Chat[] = JSON.parse(data);
//   const validatedChats = jsonSchema.parse(chats);
//
//   const result = await authenticatedCaller.chat.sourceChat(validatedChats);
// });
// END_NON_COPILOT_CODE
