/* eslint-disable @typescript-eslint/unbound-method */
//NOTE: Written by myself

import { appRouter } from "~/server/api/root";
import { createId } from "@paralleldrive/cuid2";
import type { z } from "zod";
import { createMockContext, type MockContext } from "~/server/api/context";
import type { Session } from "next-auth";
import type { createGenreSchema, genreSchema } from "~/lib/validations/genre";
import type { gameSchema } from "~/lib/validations/game";

let mockCtx: MockContext;

type CreateGenre = z.infer<typeof createGenreSchema>;
type Genre = z.infer<typeof genreSchema>;
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

describe("When creating a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      const input: CreateGenre = {
        name: "Test Genre",
        description: "Test Description",
      };

      // Act + Expect
      await expect(() => caller.genre.create(input)).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    it("should create a genre", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      const expectedCreated: Genre = {
        id: createId(),
        name: "Test Genre",
        description: "Test Description",
        games: [],
      };

      mockCtx.prisma.genre.create.mockResolvedValue(expectedCreated);

      // Act
      const result = await caller.genre.create(expectedCreated);

      // Assert

      expect(result).toMatchObject(expectedCreated);

      expect(mockCtx.prisma.genre.create).toHaveBeenCalledWith({
        data: {
          name: expectedCreated.name,
          description: expectedCreated.description,
        },
      });
    });
  });
});

describe("When retrieving all genres", () => {
  describe("and there are no genres", () => {
    it("should return an empty array", async () => {
      //Arrange
      mockCtx.prisma.genre.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act
      const result = await caller.genre.getAll();

      //Assert
      expect(result).toMatchObject([]);

      expect(mockCtx.prisma.genre.findMany).toHaveBeenCalledWith();
    });
  });

  describe("and there are genres", () => {
    it("should return the genres", async () => {
      //Arrange

      const genres: Genre[] = [
        {
          name: "Test Genre",
          description: "Test Description",
          games: [],
          id: createId(),
        },
        {
          name: "Test Genre",
          description: "Test Description",
          games: [],
          id: createId(),
        },
      ];
      mockCtx.prisma.genre.findMany.mockResolvedValue(genres);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act
      const result = await caller.genre.getAll();

      //Assert
      expect(result).toMatchObject(genres);
    });
  });
});

describe("When retrieving a genre by id", () => {
  describe("and the genre does not exist", () => {
    it("should throw a not found error", async () => {
      //Arrange
      mockCtx.prisma.genre.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act + Assert
      await expect(() =>
        caller.genre.getById({ id: createId() })
      ).rejects.toThrow();
    });
  });
  describe("and the genre exists", () => {
    it("should return the genre", async () => {
      //Arrange
      const genre: Genre = {
        name: "Test Genre",
        description: "Test Description",
        games: [],
        id: createId(),
      };

      mockCtx.prisma.genre.findUnique.mockResolvedValue(genre);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      //Act
      // eslint-disable-next-line testing-library/no-await-sync-query
      const result = await caller.genre.getById({ id: genre.id });

      //Assert
      expect(result).toMatchObject(genre);
      expect(mockCtx.prisma.genre.findUnique).toHaveBeenCalledWith({
        where: {
          id: genre.id,
        },
      });
    });
  });
  describe("and the genre exists", () => {
    describe("and the games are included", () => {
      it("should return the genre with the games", async () => {
        //Arrange
        const genre: Genre = {
          name: "Test Genre",
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

        mockCtx.prisma.genre.findUnique.mockResolvedValue(genre);
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockSession,
        });

        //Act
        // eslint-disable-next-line testing-library/no-await-sync-query
        const result = await caller.genre.getGames({ id: genre.id });
        expect(result).toMatchObject(genre);
      });
    });
  });
});

describe("When updating a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.genre.update({
          id: createId(),
          name: "Test Genre",
          description: "Test Description",
        })
      ).rejects.toThrow();
    });
  });
  describe("and the genre does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.genre.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert
      await expect(() =>
        caller.genre.update({
          id: createId(),
          name: "Test Genre",
          description: "Test Description",
        })
      ).rejects.toThrow();
    });
  });

  describe("and the genre exists", () => {
    describe("and the user is authenticated", () => {
      it("should update the genre", async () => {
        //Arrange
        const genre: Genre = {
          name: "Test Genre",
          description: "Test Description",
          games: [],
          id: createId(),
        };
        mockCtx.prisma.genre.findUnique.mockResolvedValue(genre);

        const expectedUpdated: Genre = {
          name: "Test Genre",
          description: "Test Description",
          games: [],
          id: genre.id,
        };

        mockCtx.prisma.genre.update.mockResolvedValue(expectedUpdated);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockSession,
        });

        //Act
        const result = await caller.genre.update(expectedUpdated);

        //Assert
        expect(result).toMatchObject(expectedUpdated);
        expect(mockCtx.prisma.genre.update).toHaveBeenCalledWith({
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

describe("When deleting a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.genre.delete({ id: createId() })
      ).rejects.toThrow();
    });
  });

  describe("and the genre does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.genre.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });
      // Act + Assert
      await expect(() =>
        caller.genre.delete({ id: createId() })
      ).rejects.toThrow();
    });
  });

  describe("and the genre exists", () => {
    describe("and the user is authenticated", () => {
      it("should delete the genre", async () => {
        //Arrange
        const genre: Genre = {
          name: "Test Genre",
          description: "Test Description",
          games: [],
          id: createId(),
        };
        mockCtx.prisma.genre.findUnique.mockResolvedValue(genre);

        const expectedDeleted: Genre = {
          name: "Test Genre",
          description: "Test Description",
          games: [],
          id: genre.id,
        };
        mockCtx.prisma.genre.delete.mockResolvedValue(expectedDeleted);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockSession,
        });

        //Act
        const result = await caller.genre.delete({ id: genre.id });

        //Assert
        expect(result).toMatchObject(expectedDeleted);
        expect(mockCtx.prisma.genre.delete).toHaveBeenCalledWith({
          where: {
            id: expectedDeleted.id,
          },
        });
      });
    });
  });
});

describe("When adding games to a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.genre.addGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the genre does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.genre.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert
      await expect(() =>
        caller.genre.addGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the games do not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const genre: Genre = {
        name: "Test Genre",
        description: "Test Description",
        games: [],
        id: createId(),
      };
      mockCtx.prisma.genre.findUnique.mockResolvedValue(genre);

      mockCtx.prisma.game.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert

      await expect(
        caller.genre.addGames({
          id: genre.id,
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the genre exists", () => {
    describe("and the user is authenticated", () => {
      describe("and the games exist", () => {
        it("should add the games to the genre", async () => {
          //Arrange
          const genre: Genre = {
            name: "Test Genre",
            description: "Test Description",
            games: [],
            id: createId(),
          };
          mockCtx.prisma.genre.findUnique.mockResolvedValue(genre);

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

          const expectedUpdated: Genre = {
            name: "Test Genre",
            description: "Test Description",
            games: games,
            id: genre.id,
          };

          mockCtx.prisma.genre.update.mockResolvedValue(expectedUpdated);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockSession,
          });

          //Act
          const result = await caller.genre.addGames({
            id: genre.id,
            gameIds: games.map((g) => g.id),
          });

          //Assert
          expect(result).toMatchObject(expectedUpdated);
          expect(mockCtx.prisma.genre.update).toHaveBeenCalledWith({
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

describe("When removing games from a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an Unauthorized error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.genre.removeGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the genre does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      mockCtx.prisma.genre.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert
      await expect(() =>
        caller.genre.removeGames({
          id: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the games do not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const genre: Genre = {
        name: "Test Genre",
        description: "Test Description",
        games: [],
        id: createId(),
      };
      mockCtx.prisma.genre.findUnique.mockResolvedValue(genre);

      mockCtx.prisma.game.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Assert

      await expect(
        caller.genre.removeGames({
          id: genre.id,
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the genre exists", () => {
    describe("and the user is authenticated", () => {
      describe("and the games exist", () => {
        it("should remove the games from the genre", async () => {
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
          const genre: Genre = {
            name: "Test Genre",
            description: "Test Description",
            games: games,
            id: createId(),
          };

          mockCtx.prisma.genre.findUnique.mockResolvedValue(genre);
          mockCtx.prisma.game.findMany.mockResolvedValue(games);

          const expectedUpdated: Genre = {
            id: genre.id,
            name: genre.name,
            description: genre.description,
            games: [],
          };

          mockCtx.prisma.genre.update.mockResolvedValue(expectedUpdated);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockSession,
          });

          //Act
          const result = await caller.genre.removeGames({
            id: genre.id,
            gameIds: genre?.games?.map((g) => g.id) ?? [],
          });

          //Assert
          expect(result).toMatchObject(expectedUpdated);
          expect(mockCtx.prisma.genre.update).toHaveBeenCalledWith({
            data: {
              games: {
                disconnect: genre?.games?.map((game) => ({
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
