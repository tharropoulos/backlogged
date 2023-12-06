/* eslint-disable testing-library/no-await-sync-query */
/* eslint-disable @typescript-eslint/unbound-method */
// BEGIN_COPILOT_CODE
import { appRouter } from "~/server/api/root";
import { createMockContext, type MockContext } from "~/server/api/context";
import type { Session, User } from "next-auth";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { type z } from "zod";
import { type createGameSchema } from "~/lib/validations/game";
import {
  Prisma,
  type Game,
  type GameToPlatform,
  type Platform,
  Developer,
  Genre,
  Feature,
  Franchise,
  Publisher,
  Review,
} from "@prisma/client";
import { GameDetails, GameToPlatformDetails } from "~/server/api/routers/game";

// Initialize mock context
let mockCtx: MockContext;

// Reset mock context before each test
beforeEach(() => {
  mockCtx = createMockContext();
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Create mock users
const mockUser: User = {
  role: "User",
  id: createId(),
  name: faker.person.firstName(),
};

const mockAdmin: User = {
  role: "Admin",
  id: createId(),
  name: faker.person.firstName(),
};

// Create mock sessions
const mockUserSession: Session = {
  expires: new Date().toISOString(),
  user: mockUser,
};

const mockAdminSession: Session = {
  expires: new Date().toISOString(),
  user: mockAdmin,
};

describe("When creating a game", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.game.create({
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
        })
      ).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Arrange
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockUserSession,
        });

        // Act + Expect
        await expect(() =>
          caller.game.create({
            name: faker.company.name(),
            description: faker.lorem.words(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchiseId: createId(),
            publisherId: createId(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and either the publisher or the franchise don't exist", () => {
        it("should return an error", async () => {
          // Arrange
          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          const publisherId = createId();

          mockCtx.prisma.game.create.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError("Record Not Found", {
              code: "P2025",
              clientVersion: "2.30.0",
            })
          );

          // Act
          const result = await caller.game.create({
            name: faker.company.name(),
            description: faker.lorem.words(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchiseId: createId(),
            publisherId: publisherId,
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });
    });
    describe("and the publisher and franchise exist", () => {
      it("should create a game successfully", async () => {
        // Arrange
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockAdminSession,
        });

        const publisherId = createId();
        const franchiseId = createId();

        const gameData = {
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: franchiseId,
          publisherId: publisherId,
        };

        mockCtx.prisma.game.create.mockResolvedValue({
          ...gameData,
          id: createId(),
        });

        // Act
        const result = await caller.game.create(gameData);

        // Assert
        expect(result.ok).toBe(true);
        // REWRITE_1: unwrap result
        // expect(result.data).toEqual(gameData);
        // BEGIN_COPILOT_SUGGESTION
        expect(mockCtx.prisma.game.create).toHaveBeenCalledTimes(1);
        expect(mockCtx.prisma.game.create).toHaveBeenCalledWith({
          data: {
            name: gameData.name,
            description: gameData.description,
            coverImage: gameData.coverImage,
            backgroundImage: gameData.backgroundImage,
            releaseDate: gameData.releaseDate,
            franchise: {
              connect: {
                id: gameData.franchiseId,
              },
            },
            publisher: {
              connect: {
                id: gameData.publisherId,
              },
            },
          },
        });
        // END_COPILOT_SUGGESTION
      });
    });
  });
});

describe("When retrieving all games", () => {
  describe("and there are no games", () => {
    it("should return an empty array", async () => {
      // Arrange
      mockCtx.prisma.game.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.unwrap()).toMatchObject([]);
      expect(mockCtx.prisma.game.findMany).toHaveBeenCalledWith();
    });
  });

  describe("and there are games", () => {
    it("should return the games", async () => {
      // Arrange
      const games: Array<Game> = [
        {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
        },
        {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
        },
      ];

      mockCtx.prisma.game.findMany.mockResolvedValue(games);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.unwrap()).toMatchObject(games);
    });
  });
});

describe("When retrieving a single game by Id", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();
      mockCtx.prisma.game.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getById({ id: gameId });

      // Assert
      expect(result.ok).toBe(false);
      expect(mockCtx.prisma.game.findUnique).toHaveBeenCalledWith({
        where: { id: gameId },
      });
    });
  });

  describe("and the game exists", () => {
    it("should return the game", async () => {
      // Arrange
      const game: Game = {
        id: createId(),
        name: faker.company.name(),
        description: faker.lorem.words(),
        coverImage: faker.image.url(),
        backgroundImage: faker.image.url(),
        releaseDate: new Date(),
        franchiseId: createId(),
        publisherId: createId(),
      };

      mockCtx.prisma.game.findUnique.mockResolvedValue(game);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getById({ id: game.id });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.unwrap()).toMatchObject(game);
    });
  });
});

describe("When updating a game", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.game.update({
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
        })
      ).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Arrange
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockUserSession,
        });

        // Act + Expect
        await expect(() =>
          caller.game.update({
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchiseId: createId(),
            publisherId: createId(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the game does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.game.update.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError("Record Not Found", {
              code: "P2025",
              clientVersion: "2.30.0",
            })
          );

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.game.update({
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchiseId: createId(),
            publisherId: createId(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });
    });

    describe("and the game exists", () => {
      it("should update the game", async () => {
        // Arrange
        const game: Game = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
        };

        const updateData = {
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
        };

        const updatedGame = { ...game, ...updateData };

        mockCtx.prisma.game.update.mockResolvedValue(updatedGame);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockAdminSession,
        });

        // Act
        const result = await caller.game.update({
          id: game.id,
          ...updateData,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap()).toMatchObject(updatedGame);
        expect(mockCtx.prisma.game.update).toHaveBeenCalledWith({
          where: { id: game.id },
          data: updateData,
        });
      });
    });
  });
});

describe("When deleting a game", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.game.delete({
          id: createId(),
        })
      ).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Arrange
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockUserSession,
        });

        // Act + Expect
        await expect(() =>
          caller.game.delete({
            id: createId(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the game does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.game.delete.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError("Record Not Found", {
              code: "P2025",
              clientVersion: "2.30.0",
            })
          );

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.game.delete({
            id: createId(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the game exists", () => {
        it("should delete the game", async () => {
          // Arrange
          const game: Game = {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchiseId: createId(),
            publisherId: createId(),
          };

          mockCtx.prisma.game.findUnique.mockResolvedValue(game);

          const expectedDeleted: Game = {
            id: game.id,
            name: faker.company.name(),
            description: faker.lorem.words(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            franchiseId: createId(),
            publisherId: createId(),
          };

          mockCtx.prisma.game.delete.mockResolvedValue(expectedDeleted);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.game.delete({
            id: game.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.unwrap()).toMatchObject(expectedDeleted);
          expect(mockCtx.prisma.game.delete).toHaveBeenCalledWith({
            where: { id: game.id },
          });
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
      mockCtx.prisma.game.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getDevelopers({ id: gameId });

      // Assert
      expect(result.ok).toBe(false);
      expect(mockCtx.prisma.game.findUnique).toHaveBeenCalledWith({
        where: { id: gameId },
        select: { developers: true },
      });
    });
  });

  describe("and the game exists", () => {
    describe("and the game has no developers", () => {
      it("should return an empty array", async () => {
        // Arrange
        const game: Game & { developers: Array<Developer> } = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          developers: [],
        };

        mockCtx.prisma.game.findUnique.mockResolvedValue(game);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.game.getDevelopers({ id: game.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap()).toEqual([]);
      });
    });

    describe("and the game has developers", () => {
      it("should return the developers", async () => {
        // Arrange
        const developers: Array<Developer> = [
          {
            id: createId(),
            name: faker.company.name(),
            // REWRITE_2: remove country, add image and description
            // country: faker.address.country(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          },
          {
            id: createId(),
            name: faker.company.name(),
            // REWRITE_2: remove country, add image
            // country: faker.address.country(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          },
        ];

        const game: Game & { developers: Array<Developer> } = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          developers: developers,
        };

        mockCtx.prisma.game.findUnique.mockResolvedValue(game);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.game.getDevelopers({ id: game.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap()).toEqual(developers);
      });
    });
  });
});

describe("When retrieving genres of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();
      mockCtx.prisma.game.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getGenres({ id: gameId });

      // Assert
      expect(result.ok).toBe(false);
      expect(mockCtx.prisma.game.findUnique).toHaveBeenCalledWith({
        where: { id: gameId },
        select: { genres: true },
      });
    });
  });

  describe("and the game exists", () => {
    describe("and the game has no genres", () => {
      it("should return an empty array", async () => {
        // Arrange
        const game: Game & { genres: Array<Genre> } = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          genres: [],
        };

        mockCtx.prisma.game.findUnique.mockResolvedValue(game);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.game.getGenres({ id: game.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap()).toEqual([]);
      });
    });

    describe("and the game has genres", () => {
      it("should return the genres", async () => {
        // Arrange
        const genres: Array<Genre> = [
          {
            id: createId(),
            // REWRITE_3: add description
            description: faker.lorem.words(),
            name: faker.company.name(),
          },
          {
            id: createId(),
            description: faker.lorem.words(),
            name: faker.company.name(),
          },
        ];

        const game: Game & { genres: Array<Genre> } = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          genres: genres,
        };

        mockCtx.prisma.game.findUnique.mockResolvedValue(game);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.game.getGenres({ id: game.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap()).toEqual(genres);
      });
    });
  });
});

describe("When retrieving features of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();
      mockCtx.prisma.game.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getFeatures({ id: gameId });

      // Assert
      expect(result.ok).toBe(false);
      expect(mockCtx.prisma.game.findUnique).toHaveBeenCalledWith({
        where: { id: gameId },
        select: { features: true },
      });
    });
  });

  describe("and the game exists", () => {
    describe("and the game has no features", () => {
      it("should return an empty array", async () => {
        // Arrange
        const game: Game & { features: Array<Feature> } = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          features: [],
        };

        mockCtx.prisma.game.findUnique.mockResolvedValue(game);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.game.getFeatures({ id: game.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap()).toEqual([]);
      });
    });

    describe("and the game has features", () => {
      it("should return the features", async () => {
        // Arrange
        const features: Array<Feature> = [
          {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
            // REWRITE_4: add image
            image: faker.image.url(),
          },
          {
            id: createId(),
            name: faker.company.name(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          },
        ];

        const game: Game & { features: Array<Feature> } = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          features: features,
        };

        mockCtx.prisma.game.findUnique.mockResolvedValue(game);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.game.getFeatures({ id: game.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap()).toEqual(features);
      });
    });
  });
});

describe("When retrieving platforms of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();
      mockCtx.prisma.game.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getPlatforms({ id: gameId });

      // Assert
      expect(result.ok).toBe(false);
      expect(mockCtx.prisma.game.findUnique).toHaveBeenCalledWith({
        where: { id: gameId },
        select: {
          platforms: {
            include: { platform: true },
          },
        },
      });
    });
  });

  describe("and the game exists", () => {
    describe("and the game has no platforms", () => {
      it("should return an empty array", async () => {
        // Arrange
        const game: Game & { platforms: Array<GameToPlatformDetails> } = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          platforms: [],
        };

        mockCtx.prisma.game.findUnique.mockResolvedValue(game);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.game.getPlatforms({ id: game.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap()).toEqual([]);
      });
    });

    describe("and the game has platforms", () => {
      it("should return the platforms", async () => {
        // Arrange
        // END_COPILOT_CODE

        // BEGIN_NON_COPILOT_CODE
        // Copilot couldn't deal with the errors
        const platformId = createId();
        const gameId = createId();
        const platforms: Array<GameToPlatformDetails> = [
          {
            id: faker.number.int(),
            storeLink: faker.internet.url(),
            gameId: gameId,
            platformId: platformId,
            platform: {
              id: platformId,
              name: faker.company.name(),
              // REWRITE_5: add description and image
              description: faker.lorem.words(),
              image: faker.image.url(),
            },
          },
          {
            id: faker.number.int(),
            storeLink: faker.internet.url(),
            gameId: gameId,
            platformId: platformId,
            platform: {
              id: platformId,
              name: faker.company.name(),
              // REWRITE_5: add description and image
              description: faker.lorem.words(),
              image: faker.image.url(),
            },
          },
        ];
        // END_NON_COPILOT_CODE

        // BEGIN_COPILOT_CODE

        const game: Game & { platforms: Array<GameToPlatformDetails> } = {
          id: gameId,
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          platforms: platforms,
        };

        mockCtx.prisma.game.findUnique.mockResolvedValue(game);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.game.getPlatforms({ id: game.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap()).toEqual(platforms);
      });
    });
  });
});

describe("When retrieving the franchise of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();
      mockCtx.prisma.game.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getFranchise({ id: gameId });

      // Assert
      expect(result.ok).toBe(false);
      expect(mockCtx.prisma.game.findUnique).toHaveBeenCalledWith({
        where: { id: gameId },
        select: { franchise: true },
      });
    });
  });

  describe("and the game exists", () => {
    it("should return the franchise", async () => {
      // Arrange
      const franchise: Franchise = {
        id: createId(),
        name: faker.company.name(),
        description: faker.lorem.words(),
        image: faker.image.url(),
      };

      const game: Game & { franchise: Franchise } = {
        id: createId(),
        name: faker.company.name(),
        description: faker.lorem.words(),
        coverImage: faker.image.url(),
        backgroundImage: faker.image.url(),
        releaseDate: new Date(),
        franchiseId: franchise.id,
        publisherId: createId(),
        franchise: franchise,
      };

      mockCtx.prisma.game.findUnique.mockResolvedValue(game);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getFranchise({ id: game.id });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.unwrap()).toEqual(franchise);
    });
  });
});

describe("When retrieving the publisher of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();
      mockCtx.prisma.game.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getPublisher({ id: gameId });

      // Assert
      expect(result.ok).toBe(false);
      expect(mockCtx.prisma.game.findUnique).toHaveBeenCalledWith({
        where: { id: gameId },
        select: { publisher: true },
      });
    });
  });

  describe("and the game exists", () => {
    it("should return the publisher", async () => {
      // Arrange
      const publisher: Publisher = {
        id: createId(),
        name: faker.company.name(),
        description: faker.lorem.words(),
        image: faker.image.url(),
      };

      const game: Game & { publisher: Publisher } = {
        id: createId(),
        name: faker.company.name(),
        description: faker.lorem.words(),
        coverImage: faker.image.url(),
        backgroundImage: faker.image.url(),
        releaseDate: new Date(),
        franchiseId: createId(),
        publisherId: publisher.id,
        publisher: publisher,
      };

      mockCtx.prisma.game.findUnique.mockResolvedValue(game);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getPublisher({ id: game.id });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.unwrap()).toEqual(publisher);
    });
  });
});

describe("When retrieving the reviews of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();
      mockCtx.prisma.game.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getReviews({ id: gameId });

      // Assert
      expect(result.ok).toBe(false);
      expect(mockCtx.prisma.game.findUnique).toHaveBeenCalledWith({
        where: { id: gameId },
        select: { reviews: true },
      });
    });
  });

  describe("and the game exists", () => {
    describe("and the game has no reviews", () => {
      it("should return an empty array", async () => {
        // Arrange
        const game: Game & { reviews: Array<Review> } = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          reviews: [],
        };

        mockCtx.prisma.game.findUnique.mockResolvedValue(game);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.game.getReviews({ id: game.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap()).toEqual([]);
      });
    });

    describe("and the game has reviews", () => {
      it("should return the reviews", async () => {
        // Arrange
        const reviews: Array<Review> = [
          {
            id: createId(),
            // REWRITE_7: add dates
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
            // REWRITE_6: remove title
            // title: faker.lorem.words(),
            content: faker.lorem.words(),
            // MANUAL_REWRITE: correct rating type
            // rating: faker.datatype.number({ min: 1, max: 5 }),
            rating: faker.number.int({ min: 1, max: 5 }),
            gameId: createId(),
            userId: createId(),
          },
          {
            id: createId(),
            // REWRITE_7: add dates
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
            // REWRITE_6: remove title
            // title: faker.lorem.words(),
            content: faker.lorem.paragraph(),
            // MANUAL_REWRITE: correct rating type
            // rating: faker.datatype.number({ min: 1, max: 5 }),
            rating: faker.number.int({ min: 1, max: 5 }),
            gameId: createId(),
            userId: createId(),
          },
        ];

        const game: Game & { reviews: Array<Review> } = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          coverImage: faker.image.url(),
          backgroundImage: faker.image.url(),
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          reviews: reviews,
        };

        mockCtx.prisma.game.findUnique.mockResolvedValue(game);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.game.getReviews({ id: game.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap()).toEqual(reviews);
      });
    });
  });
});

describe("When retrieving the details of a game", () => {
  describe("and the game does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const gameId = createId();
      mockCtx.prisma.game.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getDetails({ id: gameId });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the game exists", () => {
    it("should return the game details", async () => {
      // Arrange
      const gameDetails: GameDetails = {
        id: createId(),
        name: faker.company.name(),
        description: faker.lorem.words(),
        coverImage: faker.image.url(),
        backgroundImage: faker.image.url(),
        releaseDate: new Date(),
        _count: { reviews: faker.number.int() },
        developers: [
          {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
          },
        ],
        features: [
          {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
          },
        ],
        genres: [
          {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
          },
        ],
        platforms: [
          {
            storeLink: faker.internet.url(),
            platform: {
              id: createId(),
              name: faker.company.name(),
              description: faker.lorem.words(),
            },
          },
        ],
        franchise: {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
        },
        publisher: {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
        },
        reviews: [
          {
            content: faker.lorem.paragraph(),
            // MANUAL_REWRITE: correct rating type
            // rating: faker.datatype.number({ min: 1, max: 5 }),
            rating: faker.number.int({ min: 1, max: 5 }),
            _count: {
              likes: faker.number.int(),

              comments: faker.number.int(),
            },
            user: {
              name: faker.person.firstName(),
              image: faker.image.url(),
              id: createId(),
            },
          },
        ],
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockCtx.prisma.game.findUnique.mockResolvedValue(gameDetails as any);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.game.getDetails({ id: gameDetails.id });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.unwrap()).toEqual(gameDetails);
      // BEGIN_COPILOT_SUGGESTION
      expect(mockCtx.prisma.game.findUnique).toHaveBeenCalledWith({
        where: { id: gameDetails.id },
        select: {
          backgroundImage: true,
          coverImage: true,
          description: true,
          id: true,
          name: true,
          releaseDate: true,
          _count: { select: { reviews: true } },
          developers: { select: { id: true, name: true, description: true } },
          features: { select: { id: true, name: true, description: true } },
          genres: { select: { id: true, name: true, description: true } },
          franchise: { select: { id: true, name: true, description: true } },
          publisher: { select: { id: true, name: true, description: true } },
          platforms: {
            select: {
              storeLink: true,
              platform: { select: { id: true, name: true, description: true } },
            },
          },
          reviews: {
            take: 4,
            orderBy: { likes: { _count: "desc" } },
            select: {
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
              content: true,
              id: true,
              rating: true,
              user: {
                select: {
                  name: true,
                  image: true,
                  id: true,
                },
              },
            },
          },
        },
      });
    });
    // END_COPILOT_SUGGESTION
  });
});
// END_COPILOT_CODE
