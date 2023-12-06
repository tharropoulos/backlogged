/* eslint-disable testing-library/no-await-sync-query */
// BEGIN_COPILOT_CODE
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import type { Session } from "next-auth";
import type { User } from "next-auth";
import type { Game, Platform } from "@prisma/client";
import type { z } from "zod";
import type { createGameSchema } from "~/lib/validations/game";
import type { GameDetails } from "~/server/api/routers/game";

let franchiseId: string;
let publisherId: string;

beforeAll(async () => {
  const franchise = await prisma.franchise.create({
    data: {
      name: faker.company.name(),
      // REWRITE_2: add description and image
      description: faker.company.catchPhrase(),
      image: faker.image.url(),
    },
  });
  franchiseId = franchise.id;

  const publisher = await prisma.publisher.create({
    data: {
      name: faker.company.name(),
      // REWRITE_2: add description and image
      description: faker.company.catchPhrase(),
      image: faker.image.url(),
    },
  });
  publisherId = publisher.id;
});

afterAll(async () => {
  const games = prisma.game.deleteMany();
  const developers = prisma.developer.deleteMany();
  const genres = prisma.genre.deleteMany();
  const features = prisma.feature.deleteMany();
  const platforms = prisma.platform.deleteMany();
  const users = prisma.user.deleteMany();
  const franchises = prisma.franchise.deleteMany();
  const publishers = prisma.publisher.deleteMany();
  const reviews = prisma.review.deleteMany();
  await prisma.$transaction([
    games,
    developers,
    genres,
    features,
    platforms,
    users,
    reviews,
    franchises,
    publishers,
  ]);
});

const mockUser: User = {
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

describe("When creating a game", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.game.create({
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        coverImage: faker.image.url(),
        backgroundImage: faker.image.url(),
        releaseDate: new Date(),
        franchiseId: createId(),
        publisherId: createId(),
      });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.game.create({
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the franchise does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          const game: z.infer<typeof createGameSchema> = {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchiseId: createId(), // This ID does not exist
            publisherId: publisherId,
          };

          // Act
          const result = await adminCaller.game.create(game);

          // Assert
          // REWRITE_1: Return a result.ok instead of throwing an error
          //   await expect(result).rejects.toThrowError();
          expect(result.ok).toBe(false);
        });
      });

      describe("and the publisher does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          const game: z.infer<typeof createGameSchema> = {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchiseId: franchiseId,
            publisherId: createId(), // This ID does not exist
          };

          // Act
          const result = await adminCaller.game.create(game);

          // Assert
          // REWRITE_1: Return a result.ok instead of throwing an error
          //   await expect(result).rejects.toThrowError();
          expect(result.ok).toBe(false);
        });
      });
      describe("and the franchise and publisher exist", () => {
        it("should create a game", async () => {
          // Arrange
          const game: z.infer<typeof createGameSchema> = {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchiseId: franchiseId,
            publisherId: publisherId,
          };

          // Act
          const result = await adminCaller.game.create(game);

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(game);
        });
      });
    });
  });
});

describe("When retrieving a game by Id", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await unauthenticatedCaller.game.getById({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the game exists", () => {
    it("should return a game", async () => {
      // Arrange
      const game: Game = await prisma.game.create({
        data: {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: franchiseId,
          publisherId: publisherId,
        },
      });

      // Act
      const result = await authenticatedCaller.game.getById({
        id: game.id,
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(game);
    });
  });
});

describe("When retrieving all games", () => {
  describe("and there are no games", () => {
    it("should return an empty array", async () => {
      // Arrange
      await prisma.game.deleteMany();

      // Act
      const result = await unauthenticatedCaller.game.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
    });
  });

  describe("and there are games", () => {
    it("should return an array of games", async () => {
      // Arrange
      const games: Array<Omit<Game, "id">> = [
        {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: franchiseId,
          publisherId: publisherId,
        },
        {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: franchiseId,
          publisherId: publisherId,
        },
      ];

      await prisma.game.createMany({
        data: games,
      });

      // Act
      const result = await authenticatedCaller.game.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toHaveLength(2);
    });
  });
});

describe("When updating a game", () => {
  describe("and the user is not authenticated", () => {
    describe("and the user is not authenticated", () => {
      it("should throw an error", async () => {
        // Act
        const result = unauthenticatedCaller.game.create({
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.game.update({
          id: createId(),
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: franchiseId,
          publisherId: publisherId,
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the game does not exist", () => {
        it("should return an error", async () => {
          // Act
          const result = await adminCaller.game.update({
            id: createId(),
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchiseId: franchiseId,
            publisherId: publisherId,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the game exists", () => {
        it("should update a game", async () => {
          // Arrange
          const existingGame: Game = await prisma.game.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              coverImage: faker.image.url(),
              backgroundImage: faker.image.url(),
              releaseDate: new Date(),
              franchiseId: franchiseId,
              publisherId: publisherId,
            },
          });

          const updatedGame: Game = {
            ...existingGame,
            name: faker.company.name(),
          };

          // Act
          const result = await adminCaller.game.update(updatedGame);

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(updatedGame);
        });
      });
    });
  });
});

describe("When deleting a game", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.game.delete({ id: createId() });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.game.delete({
          id: createId(),
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the game does not exist", () => {
        it("should return an error", async () => {
          // Act
          const result = await adminCaller.game.delete({
            id: createId(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the game exists", () => {
        it("should delete the game", async () => {
          // Arrange
          const game: Game = await prisma.game.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              coverImage: faker.image.url(),
              backgroundImage: faker.image.url(),
              releaseDate: new Date(),
              franchiseId: franchiseId,
              publisherId: publisherId,
            },
          });

          // Act
          const result = await adminCaller.game.delete({
            id: game.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(game);
        });
      });
    });
  });
});

describe("When retrieving developers of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();

      // Act
      const result = await unauthenticatedCaller.game.getDevelopers({
        id: gameId,
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the game exists", () => {
    describe("and the game has no developers", () => {
      it("should return an empty array", async () => {
        // Arrange
        const game: Game = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchise: {
              connect: {
                id: franchiseId,
              },
            },
            publisher: {
              connect: {
                id: publisherId,
              },
            },
          },
        });

        // Act
        const result = await unauthenticatedCaller.game.getDevelopers({
          id: game.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject([]);
      });
    });

    describe("and the game has developers", () => {
      it("should return an array of developers", async () => {
        // Arrange
        const game: Game = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchise: {
              connect: {
                id: franchiseId,
              },
            },
            publisher: {
              connect: {
                id: publisherId,
              },
            },
            developers: {
              create: [
                {
                  name: faker.company.name(),
                  // REWRITE_2: add description and image
                  image: faker.image.url(),
                  description: faker.company.catchPhrase(),
                },
                {
                  name: faker.company.name(),
                  // REWRITE_2: add description and image
                  image: faker.image.url(),
                  description: faker.company.catchPhrase(),
                },
              ],
            },
          },
        });

        // Act
        const result = await unauthenticatedCaller.game.getDevelopers({
          id: game.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toHaveLength(2);
      });
    });
  });
});

describe("When retrieving genres of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();

      // Act
      const result = await unauthenticatedCaller.game.getGenres({ id: gameId });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the game exists", () => {
    describe("and the game has no genres", () => {
      it("should return an empty array", async () => {
        // Arrange
        const game = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchise: {
              connect: {
                id: franchiseId,
              },
            },
            publisher: {
              connect: {
                id: publisherId,
              },
            },
          },
        });

        // Act
        const result = await unauthenticatedCaller.game.getGenres({
          id: game.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject([]);
      });
    });

    describe("and the game has genres", () => {
      it("should return an array of genres", async () => {
        // Arrange
        const game = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchiseId: franchiseId,
            publisherId: publisherId,
            genres: {
              create: [
                {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                },
                {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                },
              ],
            },
          },
        });

        // Act
        const result = await unauthenticatedCaller.game.getGenres({
          id: game.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toHaveLength(2);
      });
    });
  });
});

describe("When retrieving features of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();

      // Act
      const result = await unauthenticatedCaller.game.getFeatures({
        id: gameId,
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the game exists", () => {
    describe("and the game has no features", () => {
      it("should return an empty array", async () => {
        // Arrange
        const game = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchise: {
              connect: {
                id: franchiseId,
              },
            },
            publisher: {
              connect: {
                id: publisherId,
              },
            },
          },
        });

        // Act
        const result = await unauthenticatedCaller.game.getFeatures({
          id: game.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject([]);
      });
    });

    describe("and the game has features", () => {
      it("should return an array of features", async () => {
        // Arrange
        const game = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchiseId: franchiseId,
            publisherId: publisherId,
            features: {
              create: [
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
              ],
            },
          },
        });

        // Act
        const result = await unauthenticatedCaller.game.getFeatures({
          id: game.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toHaveLength(2);
      });
    });
  });
});

describe("When retrieving platforms of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();

      // Act
      const result = await unauthenticatedCaller.game.getPlatforms({
        id: gameId,
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the game exists", () => {
    describe("and the game has no platforms", () => {
      it("should return an empty array", async () => {
        // Arrange
        const game = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchise: {
              connect: {
                id: franchiseId,
              },
            },
            publisher: {
              connect: {
                id: publisherId,
              },
            },
          },
        });

        // Act
        const result = await unauthenticatedCaller.game.getPlatforms({
          id: game.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject([]);
      });
    });

    describe("and the game has platforms", () => {
      it("should return an array of platforms", async () => {
        // Arrange

        const platform1 = await prisma.platform.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          },
        });

        const platform2 = await prisma.platform.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          },
        });

        const platforms: Array<Platform> = [platform1, platform2];

        const game = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchise: {
              connect: {
                id: franchiseId,
              },
            },
            publisher: {
              connect: {
                id: publisherId,
              },
            },
            platforms: {
              create: platforms.map((platform) => ({
                platform: {
                  connect: {
                    id: platform.id,
                  },
                },
                storeLink: faker.internet.url(),
              })),
            },
          },
        });

        // Act
        const result = await unauthenticatedCaller.game.getPlatforms({
          id: game.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toHaveLength(2);
        expect(result.unwrap().map((platform) => platform.platform)).not.toBe(
          null
        );
        expect(result.unwrap().map((platform) => platform.storeLink)).not.toBe(
          null
        );
      });
    });
  });
});

describe("When retrieving the franchise of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();

      // Act
      const result = await unauthenticatedCaller.game.getFranchise({
        id: gameId,
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the game exists", () => {
    it("should return the franchise", async () => {
      // Arrange
      const franchise = await prisma.franchise.create({
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
          franchise: {
            connect: {
              id: franchise.id,
            },
          },
          publisher: {
            connect: {
              id: publisherId,
            },
          },
        },
      });

      // Act
      const result = await unauthenticatedCaller.game.getFranchise({
        id: game.id,
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject({
        id: franchise.id,
        name: franchise.name,
        description: franchise.description,
        image: franchise.image,
      });
    });
  });
});

describe("When retrieving the publisher of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();

      // Act
      const result = await unauthenticatedCaller.game.getPublisher({
        id: gameId,
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the game exists", () => {
    it("should return the publisher", async () => {
      // Arrange
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
          franchise: {
            connect: {
              id: franchiseId,
            },
          },
          publisher: {
            connect: {
              id: publisher.id,
            },
          },
        },
      });

      // Act
      const result = await unauthenticatedCaller.game.getPublisher({
        id: game.id,
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject({
        id: publisher.id,
        name: publisher.name,
        description: publisher.description,
        image: publisher.image,
      });
    });
  });
});

describe("When retrieving the reviews of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();

      // Act
      const result = await unauthenticatedCaller.game.getReviews({
        id: gameId,
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the game exists", () => {
    describe("and the game has no reviews", () => {
      it("should return an empty array", async () => {
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

        // Act
        const result = await unauthenticatedCaller.game.getReviews({
          id: game.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toEqual([]);
      });
    });

    describe("and the game has reviews", () => {
      it("should return the reviews", async () => {
        // Arrange
        // END_COPILOT_CODE

        // BEGIN_NON_COPILOT_CODE
        // Copilot kept creating publishers and franchises, while there is a
        // global object for each

        const game = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            publisher: {
              connect: {
                id: publisherId,
              },
            },
            franchise: {
              connect: {
                id: franchiseId,
              },
            },
          },
        });

        const user = await prisma.user.create({
          data: {
            name: faker.person.firstName(),
            email: faker.internet.email(),
            image: faker.image.url(),
            role: "User",
          },
        });

        const reviews = await prisma.review.createMany({
          data: Array.from({ length: 3 }, () => ({
            content: faker.lorem.paragraph(),
            rating: faker.number.int({ min: 1, max: 5 }),
            gameId: game.id,
            userId: user.id,
          })),
        });
        // END_NON_COPILOT_CODE

        // BEGIN_COPILOT_CODE
        // Act
        const result = await unauthenticatedCaller.game.getReviews({
          id: game.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toHaveLength(reviews.count);
      });
    });
  });
});

describe("When retrieving the details of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();

      // Act
      const result = await unauthenticatedCaller.game.getDetails({
        id: gameId,
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the game exists", () => {
    it("should return the game details", async () => {
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

      const game = await prisma.game.create({
        data: {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
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
      // END_COPILOT_CODE

      // BEGIN_NON_COPILOT_CODE
      // Had to create the developers, genres, features, reviews and platforms manually
      const user = await prisma.user.create({
        data: {
          name: faker.person.firstName(),
          email: faker.internet.email(),
          image: faker.image.url(),
          role: "User",
        },
      });

      const developers = await Promise.all(
        Array.from({ length: 5 }, () =>
          prisma.developer.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              image: faker.image.url(),
              games: {
                connect: {
                  id: game.id,
                },
              },
            },
          })
        )
      );

      const genres = await Promise.all(
        Array.from({ length: 3 }, () =>
          prisma.genre.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              games: {
                connect: {
                  id: game.id,
                },
              },
            },
          })
        )
      );

      const features = await Promise.all(
        Array.from({ length: 2 }, () =>
          prisma.feature.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              image: faker.image.url(),
              games: {
                connect: {
                  id: game.id,
                },
              },
            },
          })
        )
      );
      const reviews = await Promise.all(
        Array.from({ length: 5 }, () =>
          prisma.review.create({
            data: {
              content: faker.lorem.paragraph(),
              rating: faker.number.int({ min: 1, max: 5 }),
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
            include: {
              _count: {
                select: {
                  comments: true,
                  likes: true,
                },
              },
            },
          })
        )
      );

      const platforms = await Promise.all(
        Array.from({ length: 6 }, () =>
          prisma.platform.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              image: faker.image.url(),
              games: {
                create: [
                  {
                    game: {
                      connect: {
                        id: game.id,
                      },
                    },
                    storeLink: faker.internet.url(),
                  },
                ],
              },
            },
            include: {
              games: {
                select: {
                  storeLink: true,
                },
              },
            },
          })
        )
      );

      const expected: GameDetails = {
        id: game.id,
        name: game.name,
        description: game.description,
        coverImage: game.coverImage,
        backgroundImage: game.backgroundImage,
        releaseDate: game.releaseDate,
        _count: {
          reviews: reviews.length,
        },
        developers: developers.map((developer) => ({
          id: developer.id,
          name: developer.name,
          description: developer.description,
        })),
        features: features.map((feature) => ({
          id: feature.id,
          name: feature.name,
          description: feature.description,
        })),
        genres: genres.map((genre) => ({
          id: genre.id,
          name: genre.name,
          description: genre.description,
        })),
        platforms: platforms.map((platform) => ({
          platform: {
            id: platform.id,
            name: platform.name,
            description: platform.description,
          },
          storeLink: platform.games[0]?.storeLink ?? faker.internet.url(),
        })),
        franchise: {
          id: franchise.id,
          name: franchise.name,
          description: franchise.description,
        },
        publisher: {
          id: publisher.id,
          name: publisher.name,
          description: publisher.description,
        },
        reviews: reviews
          .slice()
          .sort((a, b) => b._count.likes - a._count.likes)
          .slice(0, 4)
          .map((review) => ({
            _count: {
              comments: review._count.comments,
              likes: review._count.likes,
            },
            content: review.content,
            user: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
            id: review.id,
            rating: review.rating,
          })),
      };

      // Act
      const result = await unauthenticatedCaller.game.getDetails({
        id: game.id,
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.unwrap().developers).toHaveLength(
        expected.developers.length
      );
      expect(result.unwrap().features).toHaveLength(expected.features.length);
      expect(result.unwrap().genres).toHaveLength(expected.genres.length);
      expect(result.unwrap().platforms).toHaveLength(expected.platforms.length);
      expect(result.unwrap().franchise).toMatchObject(expected.franchise);
      expect(result.unwrap().franchise).toMatchObject(expected.franchise);

      expect(result.unwrap()._count.reviews).toBe(5);
      expect(result.unwrap().reviews).toHaveLength(4);
    });
  });
});
// END_NON_COPILOT_CODE
