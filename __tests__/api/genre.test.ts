/* eslint-disable testing-library/no-await-sync-query */
/* eslint-disable @typescript-eslint/unbound-method */
// BEGIN_COPILOT_CODE
// Import necessary modules and types
import { appRouter } from "~/server/api/root";
import { createMockContext, type MockContext } from "~/server/api/context";
import type { Session, User } from "next-auth";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { type z } from "zod";
import { type createGenreSchema } from "~/lib/validations/genre";
import { Prisma, type Genre, type Game } from "@prisma/client";

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

describe("When creating a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.genre.create({
          description: faker.lorem.words(),
          name: faker.company.name(),
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
          caller.genre.create({
            name: faker.company.name(),
            description: faker.lorem.words(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      it("should create a genre", async () => {
        // Arrange
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockAdminSession,
        });

        const expectedCreated: z.infer<typeof createGenreSchema> & {
          id: string;
        } = {
          name: faker.company.name(),
          id: createId(),
          description: faker.lorem.words(),
        };

        mockCtx.prisma.genre.create.mockResolvedValue(expectedCreated);

        // Act
        const result = await caller.genre.create(expectedCreated);

        // Assert
        expect(result.ok).toBe(true);
        expect(mockCtx.prisma.genre.create).toHaveBeenCalledWith({
          data: {
            name: expectedCreated.name,
            description: expectedCreated.description,
          },
        });
      });
    });
  });
});

describe("When retrieving all genres", () => {
  describe("and there are no genres", () => {
    it("should return an empty array", async () => {
      // Arrange
      mockCtx.prisma.genre.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.genre.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
      expect(mockCtx.prisma.genre.findMany).toHaveBeenCalledWith();
    });
  });

  describe("and there are genres", () => {
    it("should return the genres", async () => {
      // Arrange
      const genres: Array<Genre> = [
        {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
        },
        {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
        },
      ];

      mockCtx.prisma.genre.findMany.mockResolvedValue(genres);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.genre.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(genres);
    });
  });
});

describe("When retrieving a single genre by Id", () => {
  describe("and the genre does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const genreId = createId();
      mockCtx.prisma.genre.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.genre.getById({ id: genreId });

      // Assert
      expect(result.ok).toBe(false);
      expect(mockCtx.prisma.genre.findUnique).toHaveBeenCalledWith({
        where: { id: genreId },
      });
    });
  });

  describe("and the genre exists", () => {
    it("should return the genre", async () => {
      // Arrange
      const genre: Genre = {
        id: createId(),
        name: faker.company.name(),
        description: faker.lorem.words(),
      };

      mockCtx.prisma.genre.findUnique.mockResolvedValue(genre);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.genre.getById({ id: genre.id });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(genre);
    });
  });
});

describe("When updating a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.genre.update({
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
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
          caller.genre.update({
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the genre does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.genre.update.mockRejectedValue(
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
          const result = await caller.genre.update({
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the genre exists", () => {
        it("should update the genre", async () => {
          // Arrange
          const genre: Genre = {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.genre.findUnique.mockResolvedValue(genre);

          const expectedUpdated: Genre = {
            id: genre.id,
            name: faker.company.name(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.genre.update.mockResolvedValue(expectedUpdated);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.genre.update(expectedUpdated);

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(expectedUpdated);
          expect(mockCtx.prisma.genre.update).toHaveBeenCalledWith({
            where: {
              id: genre.id,
            },
            data: {
              name: expectedUpdated.name,
              description: expectedUpdated.description,
            },
          });
        });
      });
    });
  });
});

describe("When deleting a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.genre.delete({
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
          caller.genre.delete({
            id: createId(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the genre does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.genre.delete.mockRejectedValue(
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
          const result = await caller.genre.delete({
            id: createId(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the genre exists", () => {
        it("should delete the genre", async () => {
          // Arrange
          const genre: Genre = {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.genre.findUnique.mockResolvedValue(genre);

          const expectedDeleted: Genre = {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.genre.delete.mockResolvedValue(expectedDeleted);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.genre.delete({
            id: genre.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(expectedDeleted);
          expect(mockCtx.prisma.genre.delete).toHaveBeenCalledWith({
            where: {
              id: genre.id,
            },
          });
        });
      });
    });
  });
});

describe("When retrieving games of a genre", () => {
  describe("and the genre does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      mockCtx.prisma.genre.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.genre.getGames({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the genre exists", () => {
    describe("and the genre has no games", () => {
      it("should return an empty array", async () => {
        // Arrange
        const genre: Genre & { games: Array<Game> } = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          games: [],
        };

        mockCtx.prisma.genre.findUnique.mockResolvedValue(genre);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.genre.getGames({ id: genre.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap().length).toBe(0);
      });
    });

    describe("and the genre has games", () => {
      it("should return the games of the genre", async () => {
        // Arrange
        const games: Array<Game> = [
          {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
            backgroundImage: faker.image.url(),
            coverImage: faker.image.url(),
            releaseDate: faker.date.past(),
            publisherId: createId(),
            franchiseId: createId(),
          },
          {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
            backgroundImage: faker.image.url(),
            coverImage: faker.image.url(),
            releaseDate: faker.date.past(),
            publisherId: createId(),
            franchiseId: createId(),
          },
        ];

        const genre: Genre & { games: Array<Game> } = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          games: games,
        };

        mockCtx.prisma.genre.findUnique.mockResolvedValue(genre);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.genre.getGames({ id: genre.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap().length).toBe(games.length);
      });
    });
  });
});

describe("When adding games to a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.genre.addGames({
          genreId: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should return an error", async () => {
        // Arrange
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockUserSession,
        });

        // Act + Assert
        await expect(() =>
          caller.genre.addGames({
            genreId: createId(),
            gameIds: [createId()],
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the genre does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.genre.update.mockRejectedValue(
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
          const result = await caller.genre.addGames({
            genreId: createId(),
            gameIds: [createId()],
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the genre exists", () => {
        describe("and the games do not exist", () => {
          it("should return an error", async () => {
            // Arrange
            const nonExistentGameId = createId();

            mockCtx.prisma.genre.update.mockRejectedValue(
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
            const result = await caller.genre.addGames({
              genreId: createId(),
              gameIds: [nonExistentGameId],
            });

            // Assert
            expect(result.ok).toBe(false);
          });
        });

        describe("and the games exist", () => {
          it("should add the games to the genre", async () => {
            // Arrange
            const genre: Genre = {
              id: createId(),
              name: faker.company.name(),
              description: faker.lorem.words(),
            };

            const games: Array<Game> = [
              {
                id: createId(),
                name: faker.company.name(),
                description: faker.lorem.words(),
                backgroundImage: faker.image.url(),
                coverImage: faker.image.url(),
                releaseDate: faker.date.past(),
                publisherId: createId(),
                franchiseId: createId(),
              },
              {
                id: createId(),
                name: faker.company.name(),
                description: faker.lorem.words(),
                backgroundImage: faker.image.url(),
                coverImage: faker.image.url(),
                releaseDate: faker.date.past(),
                publisherId: createId(),
                franchiseId: createId(),
              },
            ];

            const updatedGenre = {
              ...genre,
              games: games,
            };
            mockCtx.prisma.genre.update.mockResolvedValue(updatedGenre);

            const caller = appRouter.createCaller({
              prisma: mockCtx.prisma,
              session: mockAdminSession,
            });

            // Act
            const result = await caller.genre.addGames({
              genreId: genre.id,
              gameIds: games.map((game) => game.id),
            });

            // Assert
            expect(result.ok).toBe(true);
            expect(result.val).toMatchObject({
              ...genre,
              games: games,
            });
            expect(mockCtx.prisma.genre.update).toHaveBeenCalledWith({
              where: {
                id: genre.id,
              },
              data: {
                games: {
                  connect: games.map((game) => ({ id: game.id })),
                },
              },
              include: {
                games: true,
              },
            });
          });
        });
      });
    });
  });
});

// BEGIN_COPILOT_CODE
describe("When removing games from a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.genre.removeGames({
          genreId: createId(),
          gameIds: [createId()],
        })
      ).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should return an error", async () => {
        // Arrange
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockUserSession,
        });

        // Act + Assert
        await expect(() =>
          caller.genre.removeGames({
            genreId: createId(),
            gameIds: [createId()],
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the genre does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.genre.update.mockRejectedValue(
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
          const result = await caller.genre.removeGames({
            genreId: createId(),
            gameIds: [createId()],
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the genre exists", () => {
        describe("and the games do not exist", () => {
          it("should return an error", async () => {
            // Arrange
            const nonExistentGameId = createId();

            mockCtx.prisma.genre.update.mockRejectedValue(
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
            const result = await caller.genre.removeGames({
              genreId: createId(),
              gameIds: [nonExistentGameId],
            });

            // Assert
            expect(result.ok).toBe(false);
          });
        });
        describe("and the games exist", () => {
          it("should disconnect the games from the genre", async () => {
            // Arrange
            const genre: Genre = {
              id: createId(),
              name: faker.company.name(),
              description: faker.lorem.words(),
            };

            const games: Array<Game> = [
              {
                id: createId(),
                name: faker.company.name(),
                description: faker.lorem.words(),
                backgroundImage: faker.image.url(),
                coverImage: faker.image.url(),
                releaseDate: faker.date.past(),
                publisherId: createId(),
                franchiseId: createId(),
              },
              {
                id: createId(),
                name: faker.company.name(),
                description: faker.lorem.words(),
                backgroundImage: faker.image.url(),
                coverImage: faker.image.url(),
                releaseDate: faker.date.past(),
                publisherId: createId(),
                franchiseId: createId(),
              },
            ];

            const updatedGenre = {
              ...genre,
              games: [],
            };

            mockCtx.prisma.genre.update.mockResolvedValue(updatedGenre);

            const caller = appRouter.createCaller({
              prisma: mockCtx.prisma,
              session: mockAdminSession,
            });

            // Act
            const result = await caller.genre.removeGames({
              genreId: genre.id,
              gameIds: games.map((game) => game.id),
            });

            // Assert
            expect(result.ok).toBe(true);
            expect(result.val).toMatchObject(updatedGenre);
            expect(mockCtx.prisma.genre.update).toHaveBeenCalledWith({
              where: {
                id: genre.id,
              },
              data: {
                games: {
                  disconnect: games.map((game) => ({ id: game.id })),
                },
              },
              include: {
                games: true,
              },
            });
          });
        });
      });
    });
  });
});
// END_COPILOT_CODE
