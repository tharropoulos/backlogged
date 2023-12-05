/* eslint-disable testing-library/no-await-sync-query */
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import type { Session } from "next-auth";
import type { User } from "next-auth";
import type { Platform } from "@prisma/client";
import type { z } from "zod";
import type { createPlatformSchema } from "~/lib/validations/platform";

afterAll(async () => {
  const platforms = prisma.platform.deleteMany();
  const franchises = prisma.franchise.deleteMany();
  const publishers = prisma.publisher.deleteMany();
  const gameToPlatform = prisma.gameToPlatform.deleteMany();
  const games = prisma.game.deleteMany();
  await prisma.$transaction([
    platforms,
    franchises,
    publishers,
    gameToPlatform,
    games,
  ]);
});

const mockUser: User = {
  role: "User",
  id: createId(),
  email: faker.internet.email(),
  image: faker.image.url(),
  name: faker.person.firstName(),
};

const mockSession: Session = {
  expires: new Date().toISOString(),
  user: mockUser,
};

const mockAdmin: User = {
  role: "Admin",
  id: createId(),
  email: faker.internet.email(),
  image: faker.image.url(),
  name: faker.person.firstName(),
};

const mockAdminSession: Session = {
  expires: new Date().toISOString(),
  user: mockAdmin,
};

const authenticatedCaller = appRouter.createCaller({
  session: mockSession,
  prisma: prisma,
});

const unauthenticatedCaller = appRouter.createCaller({
  session: null,
  prisma: prisma,
});

const adminCaller = appRouter.createCaller({
  session: mockAdminSession,
  prisma: prisma,
});

describe("When creating a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.platform.create({
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        image: faker.image.url(),
      });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.platform.create({
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });

    describe("and the user is an admin", () => {
      it("should create a platform", async () => {
        // Arrange
        const platform: z.infer<typeof createPlatformSchema> = {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        };

        // Act
        const result = await adminCaller.platform.create(platform);

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject(platform);
      });
    });
  });
});

describe("When retrieving a platform by Id", () => {
  describe("and the platform does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await unauthenticatedCaller.platform.getById({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the platform exists", () => {
    it("should return a platform", async () => {
      // Arrange
      const data = await prisma.platform.create({
        data: {
          image: faker.image.url(),
          description: faker.company.catchPhrase(),
          name: faker.company.name(),
        },
      });

      // Act
      const result = await authenticatedCaller.platform.getById({
        id: data.id,
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(data);
    });
  });
});

describe("When retrieving all platforms", () => {
  describe("and there are no platforms", () => {
    it("should return an empty array", async () => {
      // Arrange
      await prisma.platform.deleteMany();

      // Act
      const result = await unauthenticatedCaller.platform.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
    });
  });

  describe("and there are platforms", () => {
    it("should return an array of platforms", async () => {
      // Arrange
      const platforms = [
        {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        },
        {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        },
      ];

      await prisma.platform.createMany({
        data: platforms,
      });

      // Act
      const result = await authenticatedCaller.platform.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toHaveLength(2);
    });
  });
});

describe("When updating a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.platform.update({
        id: createId(),
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        image: faker.image.url(),
      });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.platform.update({
          id: createId(),
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the platform does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          const nonExistentPlatformId = createId();

          // Act
          const result = await adminCaller.platform.update({
            id: nonExistentPlatformId,
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          });

          // Assert
          expect(result.ok).toBe(false);
          expect(result.err).toBeTruthy();
        });
      });

      describe("and the platform exists", () => {
        it("should update a platform", async () => {
          // Arrange
          const existingPlatform: Platform = {
            id: createId(),
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          };

          await prisma.platform.create({ data: existingPlatform });

          const updatedPlatform = {
            ...existingPlatform,
            name: faker.company.name(),
          };

          // Act
          const result = await adminCaller.platform.update(updatedPlatform);

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(updatedPlatform);
        });
      });
    });
  });
});

describe("When deleting a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.platform.delete({ id: createId() });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.platform.delete({
          id: createId(),
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the platform does not exist", () => {
        it("should return an error", async () => {
          // Act
          const result = await adminCaller.platform.delete({
            id: createId(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the platform exists", () => {
        it("should delete the platform", async () => {
          // Arrange
          const data = await prisma.platform.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              image: faker.image.url(),
            },
          });

          // Act
          const result = await adminCaller.platform.delete({
            id: data.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(data);
        });
      });
    });
  });
});

describe("When retrieving games of a platform", () => {
  describe("and the platform does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await unauthenticatedCaller.platform.getGames({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the platform exists", () => {
    describe("and the platform has no games", () => {
      it("should return an empty array", async () => {
        // Arrange
        const platform = await prisma.platform.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          },
        });

        // Act
        const result = await authenticatedCaller.platform.getGames({
          id: platform.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject([]);
      });
    });

    describe("and the platform has games", () => {
      it("should return an array of games", async () => {
        // Arrange
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
        // END_COPILOT_CODE
        // BEGIN_NON_COPILOT_CODE
        // Explicit prisma relations are hard to work with, copilot struggles with them

        // REVISION_1: correctly connect game to publisher and franchise
        const game1 = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: faker.date.past(),
            // franchiseId: franchise.id,
            // publisherId: publisher.id,
            franchise: {
              connect: {
                id: franchise.id,
              },
            },
            publisher: {
              connect: {
                id: publisher.id,
              },
            },
          },
        });

        const game2 = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: faker.date.past(),
            // franchiseId: franchise.id,
            // publisherId: publisher.id,
            franchise: {
              connect: {
                id: franchise.id,
              },
            },
            publisher: {
              connect: {
                id: publisher.id,
              },
            },
          },
        });
        // END_REVISION_1

        const platform = await prisma.platform.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
            games: {
              create: [
                {
                  gameId: game1.id,
                  storeLink: faker.internet.url(),
                },
                {
                  gameId: game2.id,
                  storeLink: faker.internet.url(),
                },
              ],
            },
          },
          include: {
            games: true,
          },
        });
        // END_NON_COPILOT_CODE

        // BEGIN_COPILOT_CODE

        // Act
        const result = await authenticatedCaller.platform.getGames({
          id: platform.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toHaveLength(2);
      });
    });
  });
});

describe("When adding games to a platform", () => {
  describe("and the platform does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const nonExistentPlatformId = createId();
      const gameIds = [{ id: createId(), storeLink: faker.internet.url() }];

      // Act
      const result = await adminCaller.platform.addGames({
        platformId: nonExistentPlatformId,
        games: gameIds,
      });

      // Assert
      expect(result.ok).toBe(false);
      expect(result.err).toBeTruthy();
    });
  });

  describe("and the platform exists", () => {
    describe("and the games do not exist", () => {
      it("should return an error", async () => {
        // Arrange
        const platform = await prisma.platform.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          },
        });

        const nonExistentGameId = createId();

        // Act
        const result = await adminCaller.platform.addGames({
          platformId: platform.id,
          games: [{ id: nonExistentGameId, storeLink: faker.internet.url() }],
        });

        // Assert
        expect(result.ok).toBe(false);
        expect(result.err).toBeTruthy();
      });
    });

    describe("and the games exist", () => {
      it("should add the games to the platform", async () => {
        // Arrange
        // REVISION_2: create franchise and publisher
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
        // END_REVISION_2

        const platform = await prisma.platform.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          },
        });

        // REVISION_1: correctly connect game to publisher and franchise
        const game1 = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            // franchiseId: franchise.id,
            // publisherId: publisher.id,
            franchise: {
              connect: {
                id: franchise.id,
              },
            },
            publisher: {
              connect: {
                id: publisher.id,
              },
            },
          },
        });

        const game2 = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            // franchiseId: franchise.id,
            // publisherId: publisher.id,
            franchise: {
              connect: {
                id: franchise.id,
              },
            },
            publisher: {
              connect: {
                id: publisher.id,
              },
            },
          },
        });
        // END_REVISION_1

        // Act
        const result = await adminCaller.platform.addGames({
          platformId: platform.id,
          games: [
            { id: game1.id, storeLink: faker.internet.url() },
            { id: game2.id, storeLink: faker.internet.url() },
          ],
        });

        // Assert
        expect(result.ok).toBe(true);
        const games = result
          .unwrap()
          .games.map((gameToPlatform) => ({ game: gameToPlatform.game }));
        expect(games).toHaveLength(2);
        expect(games).toEqual(
          expect.arrayContaining([{ game: game1 }, { game: game2 }])
        );
      });
    });
  });
});

describe("When removing games from a platform", () => {
  describe("and the platform does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const nonExistentPlatformId = createId();
      const gameIds = [createId(), createId()];

      // Act
      const result = await adminCaller.platform.removeGames({
        platformId: nonExistentPlatformId,
        gameIds: gameIds,
      });

      // Assert
      expect(result.ok).toBe(false);
      expect(result.err).toBeTruthy();
    });
  });

  describe("and the platform exists", () => {
    describe("and the games do not exist", () => {
      it("shouldn't do anything", async () => {
        // Arrange
        const platform = await prisma.platform.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          },
        });

        const nonExistentGameIds = [createId(), createId()];

        // Act
        const result = await adminCaller.platform.removeGames({
          platformId: platform.id,
          gameIds: nonExistentGameIds,
        });

        // Assert
        expect(result.ok).toBe(true);
      });
    });

    describe("and the games exist", () => {
      describe("and the games do not belong to the platform", () => {
        it("shouldn't do anything", async () => {
          // Arrange
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

          const platform = await prisma.platform.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              image: faker.image.url(),
            },
          });

          // REVISION_1: correctly connect game to publisher and franchise
          const game = await prisma.game.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              coverImage: faker.image.url(),
              backgroundImage: faker.image.url(),
              releaseDate: faker.date.past(),
              //   publisherId: publisher.id,
              //   franchiseId: franchise.id,
              franchise: {
                connect: {
                  id: franchise.id,
                },
              },
              publisher: {
                connect: {
                  id: publisher.id,
                },
              },
            },
          });
          // END_REVISION_1

          // Act
          const result = await adminCaller.platform.removeGames({
            platformId: platform.id,
            gameIds: [game.id],
          });

          // Assert
          expect(result.ok).toBe(true);
        });
      });
      describe("and the games belong to the platform", () => {
        it("should remove the games successfully", async () => {
          // Arrange
          const platform = await prisma.platform.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              image: faker.image.url(),
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

          // REVISION_1: correctly connect game to publisher and franchise
          const game = await prisma.game.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              coverImage: faker.image.url(),
              backgroundImage: faker.image.url(),
              releaseDate: faker.date.past(),
              //   franchiseId: franchise.id,
              //   publisherId: publisher.id,
              franchise: {
                connect: {
                  id: franchise.id,
                },
              },
              publisher: {
                connect: {
                  id: publisher.id,
                },
              },
            },
          });
          // END_REVISION_1

          await prisma.gameToPlatform.create({
            data: {
              gameId: game.id,
              platformId: platform.id,
              storeLink: faker.internet.url(),
            },
          });

          // Act
          const result = await adminCaller.platform.removeGames({
            platformId: platform.id,
            gameIds: [game.id],
          });

          // Assert
          expect(result.ok).toBe(true);
          const updatedPlatform = await prisma.platform.findUnique({
            where: { id: platform.id },
            include: { games: true },
          });
          expect(updatedPlatform?.games).toHaveLength(0);
        });
      });
    });
  });
});
// END_COPILOT_CODE
