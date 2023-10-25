/* eslint-disable @typescript-eslint/unbound-method */
// NOTE: Written by myself

import { appRouter } from "~/server/api/root";
import { createId } from "@paralleldrive/cuid2";
import type { z } from "zod";
import { createMockContext, type MockContext } from "~/server/api/context";
import type { Session } from "next-auth";
import type {
  createDeveloperSchema,
  developerSchema,
} from "~/lib/validations/developer";

let mockCtx: MockContext;

type CreateDeveloper = z.infer<typeof createDeveloperSchema>;
type Developer = z.infer<typeof developerSchema>;

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

describe("When creating a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      const input: CreateDeveloper = {
        name: "Test Developer",
        description: "Test Description",
        coverImage: "Test Cover Image",
      };

      // Act + Expect
      await expect(() => caller.developer.create(input)).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    it("should create a developer", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      const expectedCreated: Developer = {
        id: createId(),
        name: "Test Developer",
        description: "Test Description",
        coverImage: "Test Cover Image",
      };

      mockCtx.prisma.developer.create.mockResolvedValue(expectedCreated);

      // Act
      const result = await caller.developer.create(expectedCreated);

      // Assert

      expect(result).toMatchObject(expectedCreated);

      expect(mockCtx.prisma.developer.create).toHaveBeenCalledWith({
        data: {
          name: expectedCreated.name,
          description: expectedCreated.description,
          coverImage: expectedCreated.coverImage,
        },
      });
    });
  });
});

describe("When retrieving all developers", () => {
  describe("and there are no developers", () => {
    it("should return an empty array", async () => {
      //Arrange
      mockCtx.prisma.developer.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act
      const result = await caller.developer.getAll();

      //Assert
      expect(result).toMatchObject([]);

      expect(mockCtx.prisma.developer.findMany).toHaveBeenCalledWith();
    });
  });

  describe("and there are developers", () => {
    it("should return the developers", async () => {
      //Arrange

      const developers: Developer[] = [
        {
          coverImage: "Test Cover Image",
          description: "Test Description",
          name: "Test Developer",
          id: createId(),
        },
        {
          coverImage: "Test Cover Image",
          description: "Test Description",
          name: "Test Developer",
          id: createId(),
        },
      ];
      mockCtx.prisma.developer.findMany.mockResolvedValue(developers);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act
      const result = await caller.developer.getAll();

      //Assert
      expect(result).toMatchObject(developers);
    });
  });
});

describe("When retrieving a developer by id", () => {
  describe("and the developer does not exist", () => {
    it("should throw a not found error", async () => {
      //Arrange
      mockCtx.prisma.developer.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act + Assert
      await expect(() =>
        caller.developer.getById({ id: createId() })
      ).rejects.toThrow();
    });
  });
  describe("and the developer exists", () => {
    it("should return the developer", async () => {
      //Arrange
      const developer: Developer = {
        coverImage: "Test Cover Image",
        description: "Test Description",
        name: "Test Developer",
        id: createId(),
      };

      mockCtx.prisma.developer.findUnique.mockResolvedValue(developer);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act
      // eslint-disable-next-line testing-library/no-await-sync-query
      const result = await caller.developer.getById({ id: developer.id });

      //Assert
      expect(result).toMatchObject(developer);
      expect(mockCtx.prisma.developer.findUnique).toHaveBeenCalledWith({
        where: {
          id: developer.id,
        },
      });
    });
  });
  describe("and the developer exists", () => {
    describe("and the games are included", () => {
      it("should return the developer with the games", async () => {
        //Arrange
        const developer: Developer = {
          coverImage: "Test Cover Image",
          description: "Test Description",
          name: "Test Developer",
          id: createId(),
          games: [
            {
              id: createId(),
              name: "Test Game",
              description: "Test Description",
              releaseDate: new Date(),
              // logo: "test1.jpg",
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
        };

        mockCtx.prisma.developer.findUnique.mockResolvedValue(developer);
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockSession,
        });

        //Act
        // eslint-disable-next-line testing-library/no-await-sync-query
        const result = await caller.developer.getGames({ id: developer.id });
        expect(result).toMatchObject(developer);
      });
    });
  });
});

describe("When updating a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.developer.update({
          id: createId(),
          name: "Test Developer",
          description: "Test Description",
          coverImage: "Test Cover Image",
        })
      ).rejects.toThrow();
    });
  });
  describe("and the developer does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.developer.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert
      await expect(() =>
        caller.developer.update({
          id: createId(),
          name: "Test Developer",
          description: "Test Description",
          coverImage: "Test Cover Image",
        })
      ).rejects.toThrow();
    });
  });

  describe("and the developer exists", () => {
    describe("and the user is authenticated", () => {
      it("should update the developer", async () => {
        //Arrange
        const developer: Developer = {
          coverImage: "Test Cover Image",
          description: "Test Description",
          name: "Test Developer",
          id: createId(),
        };
        mockCtx.prisma.developer.findUnique.mockResolvedValue(developer);

        const expectedUpdated: Developer = {
          coverImage: "Test Cover Image",
          description: "Test Description",
          name: "Test Developer",
          id: developer.id,
        };

        mockCtx.prisma.developer.update.mockResolvedValue(expectedUpdated);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockSession,
        });

        //Act
        const result = await caller.developer.update(expectedUpdated);

        //Assert
        expect(result).toMatchObject(expectedUpdated);
        expect(mockCtx.prisma.developer.update).toHaveBeenCalledWith({
          data: {
            name: expectedUpdated.name,
            description: expectedUpdated.description,
            coverImage: expectedUpdated.coverImage,
          },
          where: {
            id: expectedUpdated.id,
          },
        });
      });
    });
  });
});

describe("When deleting a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.developer.delete({ id: createId() })
      ).rejects.toThrow();
    });
  });

  describe("and the developer does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.developer.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });
      // Act + Assert
      await expect(() =>
        caller.developer.delete({ id: createId() })
      ).rejects.toThrow();
    });
  });

  describe("and the developer exists", () => {
    describe("and the user is authenticated", () => {
      it("should delete the developer", async () => {
        //Arrange
        const developer: Developer = {
          coverImage: "Test Cover Image",
          description: "Test Description",
          name: "Test Developer",
          id: createId(),
        };
        mockCtx.prisma.developer.findUnique.mockResolvedValue(developer);

        const expectedDeleted: Developer = {
          coverImage: "Test Cover Image",
          description: "Test Description",
          name: "Test Developer",
          id: developer.id,
        };
        mockCtx.prisma.developer.delete.mockResolvedValue(expectedDeleted);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockSession,
        });

        //Act
        const result = await caller.developer.delete({ id: developer.id });

        //Assert
        expect(result).toMatchObject(expectedDeleted);
        expect(mockCtx.prisma.developer.delete).toHaveBeenCalledWith({
          where: {
            id: expectedDeleted.id,
          },
        });
      });
    });
  });
});

describe("When adding games to a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.developer.addGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the developer does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.developer.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert
      await expect(() =>
        caller.developer.addGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the games do not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const developer: Developer = {
        coverImage: "Test Cover Image",
        description: "Test Description",
        name: "Test Developer",
        id: createId(),
      };
      mockCtx.prisma.developer.findUnique.mockResolvedValue(developer);

      mockCtx.prisma.game.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert

      await expect(
        caller.developer.addGames({
          id: developer.id,
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the developer exists", () => {
    describe("and the user is authenticated", () => {
      describe("and the games exist", () => {
        it("should add the games to the developer", async () => {
          //Arrange
          const developer: Developer = {
            coverImage: "Test Cover Image",
            description: "Test Description",
            name: "Test Developer",
            id: createId(),
            games: [],
          };
          mockCtx.prisma.developer.findUnique.mockResolvedValue(developer);

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

          const expectedUpdated: Developer = {
            coverImage: "Test Cover Image",
            description: "Test Description",
            name: "Test Developer",
            id: developer.id,
            games: games,
          };

          mockCtx.prisma.developer.update.mockResolvedValue(expectedUpdated);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockSession,
          });

          //Act
          const result = await caller.developer.addGames({
            id: developer.id,
            gameIds: games.map((g) => g.id),
          });

          //Assert
          expect(result).toMatchObject(expectedUpdated);
          expect(mockCtx.prisma.developer.update).toHaveBeenCalledWith({
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

describe("When removing games from a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.developer.removeGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });
  describe("and the developer does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.developer.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert
      await expect(() =>
        caller.developer.removeGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });
  describe("and the games do not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const developer: Developer = {
        coverImage: "Test Cover Image",
        description: "Test Description",
        name: "Test Developer",
        id: createId(),
      };
      mockCtx.prisma.developer.findUnique.mockResolvedValue(developer);

      mockCtx.prisma.game.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert

      await expect(
        caller.developer.removeGames({
          id: developer.id,
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });
  describe("and the developer exists", () => {
    describe("and the user is authenticated", () => {
      describe("and the games exist", () => {
        it("should remove the games from the developer", async () => {
          //Arrange
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
          const developer: Developer = {
            coverImage: "Test Cover Image",
            description: "Test Description",
            name: "Test Developer",
            id: createId(),
            games: games,
          };

          mockCtx.prisma.developer.findUnique.mockResolvedValue(developer);
          mockCtx.prisma.game.findMany.mockResolvedValue(games);

          const expectedUpdated: Developer = {
            id: developer.id,
            coverImage: developer.coverImage,
            description: developer.description,
            name: developer.name,
            games: [],
          };

          mockCtx.prisma.developer.update.mockResolvedValue(expectedUpdated);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockSession,
          });

          //Act
          const result = await caller.developer.removeGames({
            id: developer.id,
            gameIds: developer?.games?.map((g) => g.id) ?? [],
          });

          //Assert
          expect(result).toMatchObject(expectedUpdated);
          expect(mockCtx.prisma.developer.update).toHaveBeenCalledWith({
            data: {
              games: {
                disconnect: developer?.games?.map((game) => ({
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
