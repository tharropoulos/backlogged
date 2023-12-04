/* eslint-disable testing-library/no-await-sync-query */
// BEGIN_COPILOT_CODE
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import type { Session } from "next-auth";
import type { User } from "next-auth";
import type { Genre } from "@prisma/client";
import type { z } from "zod";
import type { createGenreSchema } from "~/lib/validations/genre";

afterAll(async () => {
  const genres = prisma.genre.deleteMany();
  const franchises = prisma.franchise.deleteMany();
  const publishers = prisma.publisher.deleteMany();
  const games = prisma.game.deleteMany();
  await prisma.$transaction([genres, franchises, publishers, games]);
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

describe("When creating a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.genre.create({
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
      });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.genre.create({
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });

    describe("and the user is an admin", () => {
      it("should create a genre", async () => {
        // Arrange
        const genre: z.infer<typeof createGenreSchema> = {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
        };

        // Act
        const result = await adminCaller.genre.create(genre);

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject(genre);
      });
    });
  });
});

describe("When retrieving a genre by Id", () => {
  describe("and the genre does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await unauthenticatedCaller.genre.getById({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the genre exists", () => {
    it("should return a genre", async () => {
      // Arrange
      const data = await prisma.genre.create({
        data: {
          description: faker.company.catchPhrase(),
          name: faker.company.name(),
        },
      });

      // Act
      const result = await authenticatedCaller.genre.getById({
        id: data.id,
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(data);
    });
  });
});

describe("When retrieving all genres", () => {
  describe("and there are no genres", () => {
    it("should return an empty array", async () => {
      // Arrange
      await prisma.genre.deleteMany();

      // Act
      const result = await unauthenticatedCaller.genre.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
    });
  });

  describe("and there are genres", () => {
    it("should return an array of genres", async () => {
      // Arrange
      const genres = [
        {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
        },
        {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
        },
      ];

      await prisma.genre.createMany({
        data: genres,
      });

      // Act
      const result = await unauthenticatedCaller.genre.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toHaveLength(2);
    });
  });
});

describe("When updating a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.genre.update({
        id: createId(),
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
      });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.genre.update({
          id: createId(),
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the genre does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          const nonExistentGenreId = createId();

          // Act
          const result = await adminCaller.genre.update({
            id: nonExistentGenreId,
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
          });

          // Assert
          expect(result.ok).toBe(false);
          expect(result.err).toBeTruthy();
        });
      });

      describe("and the genre exists", () => {
        it("should update a genre", async () => {
          // Arrange
          const existingGenre: Genre = {
            id: createId(),
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
          };

          await prisma.genre.create({ data: existingGenre });

          const updatedGenre = {
            ...existingGenre,
            name: faker.company.name(),
          };

          // Act
          const result = await adminCaller.genre.update(updatedGenre);

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(updatedGenre);
        });
      });
    });
  });
});

describe("When deleting a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.genre.delete({ id: createId() });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.genre.delete({
          id: createId(),
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the genre does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          const nonExistentGenreId = createId();

          // Act
          const result = await adminCaller.genre.delete({
            id: nonExistentGenreId,
          });

          // Assert
          expect(result.ok).toBe(false);
          expect(result.err).toBeTruthy();
        });
      });

      describe("and the genre exists", () => {
        it("should delete a genre", async () => {
          // Arrange
          const existingGenre: Genre = {
            id: createId(),
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
          };

          await prisma.genre.create({ data: existingGenre });

          // Act
          const result = await adminCaller.genre.delete({
            id: existingGenre.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          // REWRITE_1: check for id and not the whole object
          expect(result.unwrap().id).toBe(existingGenre.id);
          // expect(result.val.id).toBe(existingGenre.id);
          // expect(result.val).toBe(existingGenre.id);
        });
      });
    });
  });
});

describe("When retrieving games of a genre", () => {
  describe("and the genre does not exist", () => {
    it("should return an error", async () => {
      // Act
      const nonExistentGenreId = createId();
      const result = await unauthenticatedCaller.genre.getGames({
        id: nonExistentGenreId,
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the genre exists", () => {
    describe("and the genre has no games", () => {
      it("should return an empty array", async () => {
        // Arrange
        const genre = await prisma.genre.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
          },
        });

        // Act
        const result = await authenticatedCaller.genre.getGames({
          id: genre.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject([]);
      });
    });

    describe("and the genre has games", () => {
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

        const genre = await prisma.genre.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            games: {
              create: [
                {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                  coverImage: faker.image.url(),
                  backgroundImage: faker.image.url(),
                  releaseDate: faker.date.past(),
                  franchiseId: franchise.id,
                  publisherId: publisher.id,
                },
                {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                  coverImage: faker.image.url(),
                  backgroundImage: faker.image.url(),
                  releaseDate: faker.date.past(),
                  franchiseId: franchise.id,
                  publisherId: publisher.id,
                },
              ],
            },
          },
          include: {
            games: true,
          },
        });

        // Act
        const result = await authenticatedCaller.genre.getGames({
          id: genre.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toHaveLength(2);
      });
    });
  });
});

describe("When adding games to a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      // Arrange
      const genreId = createId();
      const gameIds = [createId(), createId()];

      // Act
      const result = unauthenticatedCaller.genre.addGames({
        genreId: genreId,
        gameIds: gameIds,
      });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should return an error", async () => {
        // Arrange
        const genreId = createId();
        const gameIds = [createId(), createId()];

        // Act
        const result = authenticatedCaller.genre.addGames({
          genreId: genreId,
          gameIds: gameIds,
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });
    describe("and the user is an admin", () => {
      describe("and the genre does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          const gameIds = [createId(), createId()];

          // Act
          const result = await adminCaller.genre.addGames({
            genreId: createId(),
            gameIds: gameIds,
          });

          // Assert
          expect(result.ok).toBe(false);
          expect(result.err).toBeTruthy();
        });
      });
      describe("and the genre exists", () => {
        describe("and a game does not exist", () => {
          it("should return an error", async () => {
            // Arrange
            const genre = await prisma.genre.create({
              data: {
                name: faker.company.name(),
                description: faker.company.catchPhrase(),
              },
            });

            const nonExistentGameId = createId();

            // Act
            const result = await adminCaller.genre.addGames({
              genreId: genre.id,
              gameIds: [nonExistentGameId],
            });

            // Assert
            expect(result.ok).toBe(false);
            expect(result.err).toBeTruthy();
          });
        });
        describe("and the games exist", () => {
          it("should add the games to the genre", async () => {
            // Arrange
            const genre = await prisma.genre.create({
              data: {
                name: faker.company.name(),
                description: faker.company.catchPhrase(),
              },
            });

            const game1 = await prisma.game.create({
              data: {
                name: faker.company.name(),
                description: faker.company.catchPhrase(),
                coverImage: faker.image.url(),
                backgroundImage: faker.image.url(),
                releaseDate: new Date(),
                franchiseId: createId(),
                publisherId: createId(),
              },
            });

            const game2 = await prisma.game.create({
              data: {
                name: faker.company.name(),
                description: faker.company.catchPhrase(),
                coverImage: faker.image.url(),
                backgroundImage: faker.image.url(),
                releaseDate: new Date(),
                franchiseId: createId(),
                publisherId: createId(),
              },
            });

            // Act
            const result = await adminCaller.genre.addGames({
              genreId: genre.id,
              gameIds: [game1.id, game2.id],
            });

            // Assert
            expect(result.ok).toBe(true);
            // REWRITE_2: unwrap the result and check for the games
            // expect(result.val).toContainEqual(game1.id);
            expect(result.unwrap().games).toContainEqual(game1);
            expect(result.unwrap().games).toContainEqual(game2);
          });
        });
      });
    });
  });
});

describe("When removing games from a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      // Arrange
      const genreId = createId();
      const gameIds = [createId(), createId()];

      // Act
      const result = unauthenticatedCaller.genre.removeGames({
        genreId: genreId,
        gameIds: gameIds,
      });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should return an error", async () => {
        // Arrange
        const genreId = createId();
        const gameIds = [createId(), createId()];

        // Act
        const result = authenticatedCaller.genre.removeGames({
          genreId: genreId,
          gameIds: gameIds,
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });
    describe("and the user is an admin", () => {
      describe("and the genre does not exist", () => {
        it("shouldn't do anything", async () => {
          // Arrange
          const nonExistentGenreId = createId();
          const gameIds = [createId(), createId()];

          // Act
          const result = await adminCaller.genre.removeGames({
            genreId: nonExistentGenreId,
            gameIds: gameIds,
          });

          // Assert
          expect(result.ok).toBe(false);
          expect(result.err).toBeTruthy();
        });
      });

      describe("and the genre exists", () => {
        describe("and a game does not exist", () => {
          // REVISION_1: idempotent operation
          it("shouldn't do anything", async () => {
            // Arrange
            const genre = await prisma.genre.create({
              data: {
                name: faker.company.name(),
                description: faker.company.catchPhrase(),
              },
            });

            const nonExistentGameId = createId();

            // Act
            const result = await adminCaller.genre.removeGames({
              genreId: genre.id,
              gameIds: [nonExistentGameId],
            });

            // Assert
            expect(result.ok).toBe(true);
            expect(result.unwrap().games.map((game) => game.id)).not.toContain(
              nonExistentGameId
            );
            // END_REVISION_1
          });
        });
        describe("and the games exist", () => {
          describe("and the games do not belong to the genre", () => {
            it("shouldn't do anything", async () => {
              // Arrange
              const genre = await prisma.genre.create({
                data: {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                },
              });

              const game = await prisma.game.create({
                data: {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                  coverImage: faker.image.url(),
                  backgroundImage: faker.image.url(),
                  releaseDate: faker.date.past(),
                  franchiseId: createId(),
                  publisherId: createId(),
                },
              });

              // Act
              const result = await adminCaller.genre.removeGames({
                genreId: genre.id,
                gameIds: [game.id],
              });

              // Assert
              expect(result.ok).toBe(true);
              if (result.ok) {
                const updatedGenre = await prisma.genre.findUnique({
                  where: { id: genre.id },
                  include: { games: true },
                });
                expect(updatedGenre?.games).not.toContainEqual(game);
              }
            });
          });

          describe("and the games belong to the genre", () => {
            it("should remove the games successfully", async () => {
              // Arrange
              const genre = await prisma.genre.create({
                data: {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                },
              });

              const game = await prisma.game.create({
                data: {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                  coverImage: faker.image.url(),
                  backgroundImage: faker.image.url(),
                  releaseDate: faker.date.past(),
                  franchiseId: createId(),
                  publisherId: createId(),
                  genres: {
                    connect: {
                      id: genre.id,
                    },
                  },
                },
              });

              // Act
              const result = await adminCaller.genre.removeGames({
                genreId: genre.id,
                gameIds: [game.id],
              });

              // Assert
              expect(result.ok).toBe(true);
              if (result.ok) {
                const updatedGenre = await prisma.genre.findUnique({
                  where: { id: genre.id },
                  include: { games: true },
                });
                expect(updatedGenre?.games).not.toContainEqual(game);
              }
            });
          });
        });
      });
    });
  });
});
// END_COPILOT_CODE
