/* eslint-disable @typescript-eslint/unbound-method */
//NOTE: Written by myself

import { appRouter } from "~/server/api/root";
import { createId } from "@paralleldrive/cuid2";
import type { z } from "zod";
import { createMockContext, type MockContext } from "~/server/api/context";
import type { Session } from "next-auth";
import type {
  createPlatformSchema,
  platformSchema,
} from "~/lib/validations/platform";
import type { gameSchema } from "~/lib/validations/game";

let mockCtx: MockContext;

type CreatePlatform = z.infer<typeof createPlatformSchema>;
type Platform = z.infer<typeof platformSchema>;
type Game = z.infer<typeof gameSchema>;
type PlatFormResponse = Omit<Platform, "games"> & {
  games: {
    id: number;
    gameId: string;
    platformId: string;
    storeLink: string;
    game: Game;
  }[];
};

beforeEach(() => {
  mockCtx = createMockContext();
});

afterEach(() => {
  jest.clearAllMocks();
});

const user = {
  id: createId(),
  name: "Test User",
};

const mockSession: Session = {
  expires: new Date().toISOString(),
  user,
};

describe("When creating a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      const input: CreatePlatform = {
        name: "Test Platform",
        coverImage: "Test Platform",
        description: "Test Description",
      };

      // Act + Expect
      await expect(() => caller.platform.create(input)).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    it("should create a platform", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      const expectedCreated: Platform = {
        id: createId(),
        coverImage: "Test Platform",
        name: "Test Platform",
        description: "Test Description",
        games: [],
      };

      mockCtx.prisma.platform.create.mockResolvedValue(expectedCreated);

      // Act
      const result = await caller.platform.create(expectedCreated);

      // Assert

      expect(result).toMatchObject(expectedCreated);

      expect(mockCtx.prisma.platform.create).toHaveBeenCalledWith({
        data: {
          name: expectedCreated.name,
          coverImage: expectedCreated.coverImage,
          description: expectedCreated.description,
        },
      });
    });
  });
});

describe("When retrieving all platforms", () => {
  describe("and there are no platforms", () => {
    it("should return an empty array", async () => {
      //Arrange
      mockCtx.prisma.platform.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act
      const result = await caller.platform.getAll();

      //Assert
      expect(result).toMatchObject([]);

      expect(mockCtx.prisma.platform.findMany).toHaveBeenCalledWith();
    });
  });

  describe("and there are platforms", () => {
    it("should return the platforms", async () => {
      //Arrange

      const platforms: Platform[] = [
        {
          name: "Test Platform",
          description: "Test Description",
          coverImage: "Test Cover Image",
          games: [],
          id: createId(),
        },
        {
          name: "Test Platform",
          description: "Test Description",
          coverImage: "Test Cover Image",
          games: [],
          id: createId(),
        },
      ];
      mockCtx.prisma.platform.findMany.mockResolvedValue(platforms);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act
      const result = await caller.platform.getAll();

      //Assert
      expect(result).toMatchObject(platforms);
    });
  });
});

describe("When retrieving a platform by id", () => {
  describe("and the platform does not exist", () => {
    it("should throw a not found error", async () => {
      //Arrange
      mockCtx.prisma.platform.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act + Assert
      await expect(() =>
        caller.platform.getById({ id: createId() })
      ).rejects.toThrow();
    });
  });
  describe("and the platform exists", () => {
    it("should return the platform", async () => {
      //Arrange
      const platform: Platform = {
        coverImage: "Test Cover Image",
        name: "Test Platform",
        description: "Test Description",
        games: [],
        id: createId(),
      };

      mockCtx.prisma.platform.findUnique.mockResolvedValue(platform);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act
      // eslint-disable-next-line testing-library/no-await-sync-query
      const result = await caller.platform.getById({ id: platform.id });

      //Assert
      expect(result).toMatchObject(platform);
      expect(mockCtx.prisma.platform.findUnique).toHaveBeenCalledWith({
        where: {
          id: platform.id,
        },
      });
    });
  });
  describe("and the platform exists", () => {
    describe("and the games are included", () => {
      it("should return the platform with the games", async () => {
        //Arrange

        const platform: PlatFormResponse = {
          id: createId(),
          name: "platform1",
          description: "platform1",
          coverImage: "platform1",
          games: [
            {
              id: 74,
              gameId: "clod4envq000ri0y2bfgchrru",
              platformId: "clod4env4000ji0y2fjf0eluw",
              storeLink: "link",
              game: {
                releaseDate: new Date(),
                id: "clod4envq000ri0y2bfgchrru",
                franchiseId: createId(),
                publisherId: createId(),
                name: "game2",
                backgroundImage: "game2",
                coverImage: "game2",
                description: "game2",
              },
            },
            {
              id: 75,
              gameId: "clod4envl000pi0y2tv1c54rm",
              platformId: "clod4env4000ji0y2fjf0eluw",
              storeLink: "link",
              game: {
                releaseDate: new Date(),
                id: "clod4envl000pi0y2tv1c54rm",
                franchiseId: createId(),
                publisherId: createId(),
                name: "game3",
                backgroundImage: "game3",
                coverImage: "game3",
                description: "game3",
              },
            },
          ],
        };

        mockCtx.prisma.platform.findUnique.mockResolvedValue(platform);
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockSession,
        });

        //Act
        // eslint-disable-next-line testing-library/no-await-sync-query
        const result = await caller.platform.getGames({ id: platform.id });
        expect(result).toMatchObject(platform.games.map((g) => g.game));
      });
    });
  });
});

describe("When updating a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.platform.update({
          coverImage: "Test Cover Image",
          id: createId(),
          name: "Test Platform",
          description: "Test Description",
        })
      ).rejects.toThrow();
    });
  });
  describe("and the platform does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.platform.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert
      await expect(() =>
        caller.platform.update({
          coverImage: "Test Cover Image",
          id: createId(),
          name: "Test Platform",
          description: "Test Description",
        })
      ).rejects.toThrow();
    });
  });

  describe("and the platform exists", () => {
    describe("and the user is authenticated", () => {
      it("should update the platform", async () => {
        //Arrange
        const platform: Platform = {
          name: "Test Platform",
          coverImage: "Test Cover Image",
          description: "Test Description",
          games: [],
          id: createId(),
        };
        mockCtx.prisma.platform.findUnique.mockResolvedValue(platform);

        const expectedUpdated: Platform = {
          coverImage: "Test Cover Image",
          name: "Test Platform",
          description: "Test Description",
          games: [],
          id: platform.id,
        };

        mockCtx.prisma.platform.update.mockResolvedValue(expectedUpdated);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockSession,
        });

        //Act
        const result = await caller.platform.update(expectedUpdated);

        //Assert
        expect(result).toMatchObject(expectedUpdated);
        expect(mockCtx.prisma.platform.update).toHaveBeenCalledWith({
          data: {
            name: expectedUpdated.name,
            coverImage: expectedUpdated.coverImage,
            description: expectedUpdated.description,
          },
          where: {
            id: expectedUpdated.id,
          },
        });
      });
    });
  });
});

describe("When deleting a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.platform.delete({ id: createId() })
      ).rejects.toThrow();
    });
  });

  describe("and the platform does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.platform.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });
      // Act + Assert
      await expect(() =>
        caller.platform.delete({ id: createId() })
      ).rejects.toThrow();
    });
  });

  describe("and the platform exists", () => {
    describe("and the user is authenticated", () => {
      it("should delete the platform", async () => {
        //Arrange
        const platform: Platform = {
          coverImage: "Test Cover Image",
          name: "Test Platform",
          description: "Test Description",
          games: [],
          id: createId(),
        };
        mockCtx.prisma.platform.findUnique.mockResolvedValue(platform);

        const expectedDeleted: Platform = {
          coverImage: "Test Cover Image",
          name: "Test Platform",
          description: "Test Description",
          games: [],
          id: platform.id,
        };
        mockCtx.prisma.platform.delete.mockResolvedValue(expectedDeleted);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockSession,
        });

        //Act
        const result = await caller.platform.delete({ id: platform.id });

        //Assert
        expect(result).toMatchObject(expectedDeleted);
        expect(mockCtx.prisma.platform.delete).toHaveBeenCalledWith({
          where: {
            id: expectedDeleted.id,
          },
        });
      });
    });
  });
});

describe("When adding games to a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.platform.addGames({
          id: createId(),
          games: [],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the platform does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.platform.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert
      await expect(() =>
        caller.platform.addGames({
          id: createId(),
          games: [
            {
              id: createId(),
              storeLink: "Test Store Link",
            },
          ],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the games do not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const platform: Platform = {
        coverImage: "Test Cover Image",
        name: "Test Platform",
        description: "Test Description",
        games: [],
        id: createId(),
      };
      mockCtx.prisma.platform.findUnique.mockResolvedValue(platform);

      mockCtx.prisma.game.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert

      await expect(
        caller.platform.addGames({
          id: platform.id,
          games: [
            {
              id: createId(),
              storeLink: "Test Store Link",
            },
          ],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the platform exists", () => {
    describe("and the user is authenticated", () => {
      describe("and the games exist", () => {
        it("should add the games to the platform", async () => {
          //Arrange
          const platform: Platform = {
            coverImage: "Test Cover Image",
            name: "Test Platform",
            description: "Test Description",
            games: [],
            id: createId(),
          };
          mockCtx.prisma.platform.findUnique.mockResolvedValue(platform);

          const games = [
            {
              id: createId(),
              name: "Test Game",
              description: "Test Description",
              releaseDate: new Date(),
              coverImage: "Test Cover Image",
              backgroundImage: "Test Background Image",
              publisherId: createId(),
              franchiseId: createId(),
            },
            {
              id: createId(),
              name: "Test Game 2",
              description: "Test Description 2",
              releaseDate: new Date(),
              coverImage: "Test Cover Image 2 ",
              backgroundImage: "Test Background Image 2",
              publisherId: createId(),
              franchiseId: createId(),
            },
          ];

          mockCtx.prisma.game.findMany.mockResolvedValue(games);

          const expectedUpdated: Platform = {
            coverImage: "Test Cover Image",
            name: "Test Platform",
            description: "Test Description",
            games: games,
            id: platform.id,
          };

          mockCtx.prisma.platform.update.mockResolvedValue(expectedUpdated);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockSession,
          });

          //Act
          const result = await caller.platform.addGames({
            id: platform.id,
            games: games.map((game) => ({
              id: game.id,
              storeLink: "Test Store Link",
            })),
          });

          //Assert
          expect(result).toMatchObject(expectedUpdated);
        });
      });
    });
  });
});

describe("When removing games from a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.platform.removeGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the platform does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.platform.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert
      await expect(() =>
        caller.platform.removeGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the games do not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const platform: Platform = {
        name: "Test Platform",
        coverImage: "Test Cover Image",
        description: "Test Description",
        games: [],
        id: createId(),
      };
      mockCtx.prisma.platform.findUnique.mockResolvedValue(platform);

      mockCtx.prisma.game.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert

      await expect(
        caller.platform.removeGames({
          id: platform.id,
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the platform exists", () => {
    describe("and the user is authenticated", () => {
      describe("and the games exist", () => {
        it("should remove the games from the platform", async () => {
          //Arr const games: Game[] = [
          const games: Game[] = [
            {
              releaseDate: new Date(),
              id: "clod4envq000ri0y2bfgchrru",
              franchiseId: createId(),
              publisherId: createId(),
              name: "game2",
              backgroundImage: "game2",
              coverImage: "game2",
              description: "game2",
            },
            {
              releaseDate: new Date(),
              id: "clod4envl000pi0y2tv1c54rm",
              franchiseId: createId(),
              publisherId: createId(),
              name: "game3",
              backgroundImage: "game3",
              coverImage: "game3",
              description: "game3",
            },
          ];

          const platform: PlatFormResponse = {
            id: createId(),
            name: "platform1",
            description: "platform1",
            coverImage: "platform1",
            games: [
              {
                id: 74,
                gameId: "clod4envq000ri0y2bfgchrru",
                platformId: "clod4env4000ji0y2fjf0eluw",
                storeLink: "link",
                game: games[0]!,
              },
              {
                id: 75,
                gameId: "clod4envl000pi0y2tv1c54rm",
                platformId: "clod4env4000ji0y2fjf0eluw",
                storeLink: "link",
                game: games[1]!,
              },
            ],
          };

          mockCtx.prisma.platform.findUnique.mockResolvedValue(platform);
          mockCtx.prisma.game.findMany.mockResolvedValue(games);

          const expectedUpdated: Platform = {
            id: platform.id,
            coverImage: platform.coverImage,
            name: platform.name,
            description: platform.description,
            games: [],
          };

          mockCtx.prisma.platform.update.mockResolvedValue(expectedUpdated);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockSession,
          });

          //Act
          const result = await caller.platform.removeGames({
            id: platform.id,
            gameIds: platform.games.map((g) => g.game.id),
          });

          //Assert
          expect(result).toMatchObject(expectedUpdated);
        });
      });
    });
  });
});
