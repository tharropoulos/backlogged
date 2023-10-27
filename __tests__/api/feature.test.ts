/* eslint-disable @typescript-eslint/unbound-method */
//NOTE: Written by Copilot Chat

import { appRouter } from "~/server/api/root";
import { createId } from "@paralleldrive/cuid2";
import type { z } from "zod";
import { createMockContext, type MockContext } from "~/server/api/context";
import type { Session } from "next-auth";
import type {
  createFeatureSchema,
  featureSchema,
} from "~/lib/validations/feature";
import type { gameSchema } from "~/lib/validations/game";

let mockCtx: MockContext;

type CreateFeature = z.infer<typeof createFeatureSchema>;
type Feature = z.infer<typeof featureSchema>;
type Game = z.infer<typeof gameSchema>;

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

describe("When creating a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      const input: CreateFeature = {
        name: "Test Feature",
        description: "Test Description",
      };

      // Act + Expect
      await expect(() => caller.feature.create(input)).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    it("should create a feature", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      const expectedCreated: Feature = {
        id: createId(),
        name: "Test Feature",
        description: "Test Description",
        games: [],
      };

      mockCtx.prisma.feature.create.mockResolvedValue(expectedCreated);

      // Act
      const result = await caller.feature.create(expectedCreated);

      // Assert

      expect(result).toMatchObject(expectedCreated);

      expect(mockCtx.prisma.feature.create).toHaveBeenCalledWith({
        data: {
          name: expectedCreated.name,
          description: expectedCreated.description,
        },
      });
    });
  });
});

describe("When retrieving all features", () => {
  describe("and there are no features", () => {
    it("should return an empty array", async () => {
      //Arrange
      mockCtx.prisma.feature.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act
      const result = await caller.feature.getAll();

      //Assert
      expect(result).toMatchObject([]);

      expect(mockCtx.prisma.feature.findMany).toHaveBeenCalledWith();
    });
  });

  describe("and there are features", () => {
    it("should return the features", async () => {
      //Arrange

      const features: Feature[] = [
        {
          name: "Test Feature",
          description: "Test Description",
          games: [],
          id: createId(),
        },
        {
          name: "Test Feature",
          description: "Test Description",
          games: [],
          id: createId(),
        },
      ];
      mockCtx.prisma.feature.findMany.mockResolvedValue(features);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act
      const result = await caller.feature.getAll();

      //Assert
      expect(result).toMatchObject(features);
    });
  });
});

describe("When retrieving a feature by id", () => {
  describe("and the feature does not exist", () => {
    it("should throw a not found error", async () => {
      //Arrange
      mockCtx.prisma.feature.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act + Assert
      await expect(() =>
        caller.feature.getById({ id: createId() })
      ).rejects.toThrow();
    });
  });
  describe("and the feature exists", () => {
    it("should return the feature", async () => {
      //Arrange
      const feature: Feature = {
        name: "Test Feature",
        description: "Test Description",
        games: [],
        id: createId(),
      };

      mockCtx.prisma.feature.findUnique.mockResolvedValue(feature);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act
      // eslint-disable-next-line testing-library/no-await-sync-query
      const result = await caller.feature.getById({ id: feature.id });

      //Assert
      expect(result).toMatchObject(feature);
      expect(mockCtx.prisma.feature.findUnique).toHaveBeenCalledWith({
        where: {
          id: feature.id,
        },
      });
    });
  });
  describe("and the feature exists", () => {
    describe("and the games are included", () => {
      it("should return the feature with the games", async () => {
        //Arrange
        const feature: Feature = {
          name: "Test Feature",
          description: "Test Description",
          games: [
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
          ],
          id: createId(),
        };

        mockCtx.prisma.feature.findUnique.mockResolvedValue(feature);
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockSession,
        });

        //Act
        // eslint-disable-next-line testing-library/no-await-sync-query
        const result = await caller.feature.getGames({ id: feature.id });
        expect(result).toMatchObject(feature);
      });
    });
  });
});

describe("When updating a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.feature.update({
          id: createId(),
          name: "Test Feature",
          description: "Test Description",
        })
      ).rejects.toThrow();
    });
  });
  describe("and the feature does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.feature.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert
      await expect(() =>
        caller.feature.update({
          id: createId(),
          name: "Test Feature",
          description: "Test Description",
        })
      ).rejects.toThrow();
    });
  });

  describe("and the feature exists", () => {
    describe("and the user is authenticated", () => {
      it("should update the feature", async () => {
        //Arrange
        const feature: Feature = {
          name: "Test Feature",
          description: "Test Description",
          games: [],
          id: createId(),
        };
        mockCtx.prisma.feature.findUnique.mockResolvedValue(feature);

        const expectedUpdated: Feature = {
          name: "Test Feature",
          description: "Test Description",
          games: [],
          id: feature.id,
        };

        mockCtx.prisma.feature.update.mockResolvedValue(expectedUpdated);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockSession,
        });

        //Act
        const result = await caller.feature.update(expectedUpdated);

        //Assert
        expect(result).toMatchObject(expectedUpdated);
        expect(mockCtx.prisma.feature.update).toHaveBeenCalledWith({
          data: {
            name: expectedUpdated.name,
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

describe("When deleting a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.feature.delete({ id: createId() })
      ).rejects.toThrow();
    });
  });

  describe("and the feature does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.feature.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });
      // Act + Assert
      await expect(() =>
        caller.feature.delete({ id: createId() })
      ).rejects.toThrow();
    });
  });

  describe("and the feature exists", () => {
    describe("and the user is authenticated", () => {
      it("should delete the feature", async () => {
        //Arrange
        const feature: Feature = {
          name: "Test Feature",
          description: "Test Description",
          games: [],
          id: createId(),
        };
        mockCtx.prisma.feature.findUnique.mockResolvedValue(feature);

        const expectedDeleted: Feature = {
          name: "Test Feature",
          description: "Test Description",
          games: [],
          id: feature.id,
        };
        mockCtx.prisma.feature.delete.mockResolvedValue(expectedDeleted);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockSession,
        });

        //Act
        const result = await caller.feature.delete({ id: feature.id });

        //Assert
        expect(result).toMatchObject(expectedDeleted);
        expect(mockCtx.prisma.feature.delete).toHaveBeenCalledWith({
          where: {
            id: expectedDeleted.id,
          },
        });
      });
    });
  });
});

describe("When adding games to a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.feature.addGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the feature does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.feature.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert
      await expect(() =>
        caller.feature.addGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the games do not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const feature: Feature = {
        name: "Test Feature",
        description: "Test Description",
        games: [],
        id: createId(),
      };
      mockCtx.prisma.feature.findUnique.mockResolvedValue(feature);

      mockCtx.prisma.game.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert

      await expect(
        caller.feature.addGames({
          id: feature.id,
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the feature exists", () => {
    describe("and the user is authenticated", () => {
      describe("and the games exist", () => {
        it("should add the games to the feature", async () => {
          //Arrange
          const feature: Feature = {
            name: "Test Feature",
            description: "Test Description",
            games: [],
            id: createId(),
          };
          mockCtx.prisma.feature.findUnique.mockResolvedValue(feature);

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

          const expectedUpdated: Feature = {
            name: "Test Feature",
            description: "Test Description",
            games: games,
            id: feature.id,
          };

          mockCtx.prisma.feature.update.mockResolvedValue(expectedUpdated);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockSession,
          });

          //Act
          const result = await caller.feature.addGames({
            id: feature.id,
            gameIds: games.map((g) => g.id),
          });

          //Assert
          expect(result).toMatchObject(expectedUpdated);
          expect(mockCtx.prisma.feature.update).toHaveBeenCalledWith({
            data: {
              games: {
                connect: games.map((game) => ({
                  id: game.id,
                })),
              },
            },
            where: {
              id: expectedUpdated.id,
            },
          });
        });
      });
    });
  });
});

describe("When removing games from a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.feature.removeGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the feature does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.feature.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert
      await expect(() =>
        caller.feature.removeGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the games do not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const feature: Feature = {
        name: "Test Feature",
        description: "Test Description",
        games: [],
        id: createId(),
      };
      mockCtx.prisma.feature.findUnique.mockResolvedValue(feature);

      mockCtx.prisma.game.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert

      await expect(
        caller.feature.removeGames({
          id: feature.id,
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the feature exists", () => {
    describe("and the user is authenticated", () => {
      describe("and the games exist", () => {
        it("should remove the games from the feature", async () => {
          //Arrange
          const games: Game[] = [
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
          const feature: Feature = {
            name: "Test Feature",
            description: "Test Description",
            games: games,
            id: createId(),
          };

          mockCtx.prisma.feature.findUnique.mockResolvedValue(feature);
          mockCtx.prisma.game.findMany.mockResolvedValue(games);

          const expectedUpdated: Feature = {
            id: feature.id,
            name: feature.name,
            description: feature.description,
            games: [],
          };

          mockCtx.prisma.feature.update.mockResolvedValue(expectedUpdated);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockSession,
          });

          //Act
          const result = await caller.feature.removeGames({
            id: feature.id,
            gameIds: feature?.games?.map((g) => g.id) ?? [],
          });

          //Assert
          expect(result).toMatchObject(expectedUpdated);
          expect(mockCtx.prisma.feature.update).toHaveBeenCalledWith({
            data: {
              games: {
                disconnect: feature?.games?.map((game) => ({
                  id: game.id,
                })),
              },
            },
            where: {
              id: expectedUpdated.id,
            },
          });
        });
      });
    });
  });
});
