/* eslint-disable testing-library/no-await-sync-query */
//NOTE: Written by myself
import type { User } from "@prisma/client";
import type { Session } from "next-auth";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import type { z } from "zod";
import type { createGenreSchema, genreSchema } from "~/lib/validations/genre";
import { createId } from "@paralleldrive/cuid2";
import type { gameSchema } from "~/lib/validations/game";

type CreateGenre = z.infer<typeof createGenreSchema>;
type Genre = z.infer<typeof genreSchema>;
type Game = z.infer<typeof gameSchema>;
const initGenres: CreateGenre[] = [
  {
    name: "genre1",
    description: "genre1",
  },
  {
    name: "genre2",
    description: "genre2",
  },
];

beforeAll(async () => {
  await prisma.genre.createMany({
    data: initGenres,
  });
  console.log("✨ 2 genres created");
  console.log("On: ", process.env.DATABASE_URL);
});

afterAll(async () => {
  const deleteGenres = prisma.genre.deleteMany();

  await prisma.$transaction([deleteGenres]);
  console.log("Everything deleted on: ", process.env.DATABASE_URL);
  await prisma.$disconnect();
});

const user: User = {
  id: createId(),
  email: "email",
  emailVerified: null,
  image: "image",
  name: "test",
};

describe("When creating a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.genre.create({
        name: "genre1",
        description: "genre1",
      });

      //Assert
      await expect(result).rejects.toThrowError("UNAUTHORIZED");
    });
  });

  describe("and the user is authenticated", () => {
    it("should create a genre", async () => {
      //Arrange
      const genre = {
        name: "genre1",
        description: "genre1",
      };
      const mockSession: Session = {
        expires: new Date().toISOString(),
        user: user,
      };

      const caller = appRouter.createCaller({
        session: mockSession,
        prisma: prisma,
      });

      //Act
      const result = await caller.genre.create(genre);

      const expectedCreated = await prisma.genre.findUnique({
        where: {
          id: result.id,
        },
      });

      //Assert
      expect(expectedCreated).toMatchObject(genre);
    });
  });
});

describe("When retrieving a genre by Id", () => {
  describe("and the genre does not exist", () => {
    it("should throw an error", async () => {
      //Arrange

      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.genre.getById({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError("Genre not found");
    });
  });

  describe("and the genre exists", () => {
    it("should return the genre", async () => {
      //Arrange
      const genre: CreateGenre = {
        name: "genre1",
        description: "genre1",
      };

      const data = await prisma.genre.create({
        data: genre,
      });

      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = await caller.genre.getById({ id: data.id });

      //Assert
      expect(result).toMatchObject(data);
    });
  });
});

describe("When retrieving all genres", () => {
  describe("and there are no genres", () => {
    it("should return an empty array", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      await prisma.genre.deleteMany();

      //Act
      const result = await caller.genre.getAll();

      //Assert
      expect(result).toMatchObject([]);
    });
  });

  describe("and there are genres", () => {
    it("should return an array of genres", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      await prisma.genre.deleteMany();

      await prisma.genre.createMany({
        data: initGenres,
      });

      //Act
      const result = await caller.genre.getAll();

      //Assert
      expect(result).toMatchObject(initGenres);
    });
  });
});

describe("When updating a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.genre.update({
        id: createId(),
        name: "genre1",
        description: "genre1",
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });
  describe("and the genre does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const mockSession: Session = {
        expires: new Date().toISOString(),
        user: user,
      };

      const caller = appRouter.createCaller({
        session: mockSession,
        prisma: prisma,
      });

      //Act
      const result = caller.genre.update({
        id: createId(),
        name: "genre1",
        description: "genre1",
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the genre exists", () => {
    it("should update the genre", async () => {
      //Arrange
      const data = await prisma.genre.create({
        data: {
          description: "genre1",
          name: "genre1",
        },
      });

      const mockSession: Session = {
        expires: new Date().toISOString(),
        user: user,
      };

      const caller = appRouter.createCaller({
        session: mockSession,
        prisma: prisma,
      });

      //Act
      const result = await caller.genre.update({
        id: data.id,
        name: "genre2",
        description: "genre2",
      });

      const expectedUpdated = await caller.genre.getById({ id: data.id });

      //Assert
      expect(expectedUpdated).toMatchObject(result);
    });
  });
});

describe("When deleting a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.genre.delete({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the genre does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const mockSession: Session = {
        expires: new Date().toISOString(),
        user: user,
      };

      const caller = appRouter.createCaller({
        session: mockSession,
        prisma: prisma,
      });

      //Act
      const result = caller.genre.delete({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the genre exists", () => {
    describe("and the user is authenticated", () => {
      it("should delete the genre", async () => {
        //Arrange
        const data = await prisma.genre.create({
          data: {
            description: "genre1",
            name: "genre1",
          },
        });

        const mockSession: Session = {
          expires: new Date().toISOString(),
          user: user,
        };

        const caller = appRouter.createCaller({
          session: mockSession,
          prisma: prisma,
        });

        //Act
        const result = await caller.genre.delete({ id: data.id });

        //Assert
        expect(result).toMatchObject(data);
      });
    });
  });
});

describe("When retrieving a genre's games", () => {
  describe("and the genre does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.genre.getGames({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the genre exists", () => {
    describe("and the genre has no games", () => {
      it("should return an empty array", async () => {
        //Arrange
        const data = await prisma.genre.create({
          data: {
            description: "genre1",
            name: "genre1",
          },
        });

        const caller = appRouter.createCaller({
          session: null,
          prisma: prisma,
        });

        //Act
        const result = await caller.genre.getGames({ id: data.id });

        //Assert
        expect(result).toMatchObject({ games: [] });
      });
    });

    describe("and the genre has games", () => {
      it("should return an array of games", async () => {
        //Arrange
        const genre = await prisma.genre.create({
          data: {
            description: "genre1",
            name: "genre1",
          },
        });

        const franchise = await prisma.franchise.create({
          data: {
            backgroundImage: "franchise1",
            description: "franchise1",
            name: "franchise1",
          },
        });

        const publisher = await prisma.publisher.create({
          data: {
            coverImage: "publisher1",
            description: "publisher1",
            name: "publisher1",
          },
        });

        const game = await prisma.game.create({
          data: {
            backgroundImage: "game1",
            genres: {
              connect: {
                id: genre.id,
              },
            },
            coverImage: "game1",
            description: "game1",
            name: "game1",
            publisherId: publisher.id,
            franchiseId: franchise.id,
          },
        });

        const caller = appRouter.createCaller({
          session: null,
          prisma: prisma,
        });

        //Act
        const result = await caller.genre.getGames({ id: genre.id });

        //Assert
        expect(result).toMatchObject({ games: [game] });
      });
    });
  });
});

describe("When adding games to a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.genre.addGames({
        id: createId(),
        gameIds: [],
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the genre does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const mockSession: Session = {
        expires: new Date().toISOString(),
        user: user,
      };

      const caller = appRouter.createCaller({
        session: mockSession,
        prisma: prisma,
      });

      //Act
      const result = caller.genre.addGames({
        id: createId(),
        gameIds: [],
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the genre exists", () => {
    describe("and the games do not exist", () => {
      it("should throw an error", async () => {
        //Arrange
        const genre = await prisma.genre.create({
          data: {
            description: "genre1",
            name: "genre1",
          },
        });

        const mockSession: Session = {
          expires: new Date().toISOString(),
          user: user,
        };

        const caller = appRouter.createCaller({
          session: mockSession,
          prisma: prisma,
        });

        //Act
        const result = caller.genre.addGames({
          id: genre.id,
          gameIds: [createId()],
        });

        //Assert
        await expect(result).rejects.toThrowError("Game not found");
      });
    });

    describe("and the games exist", () => {
      describe("and the games are already connected to the genre", () => {
        it("should throw an error", async () => {
          //Arrange

          const franchise = await prisma.franchise.create({
            data: {
              backgroundImage: "franchise1",
              description: "franchise1",
              name: "franchise1",
            },
          });

          const publisher = await prisma.publisher.create({
            data: {
              coverImage: "publisher1",
              description: "publisher1",
              name: "publisher1",
            },
          });

          const genre = await prisma.genre.create({
            data: {
              description: "genre1",
              name: "genre1",
            },
          });

          const game = await prisma.game.create({
            data: {
              name: "game2",
              genres: {
                connect: {
                  id: genre.id,
                },
              },
              backgroundImage: "game2",
              coverImage: "game2",
              description: "game2",
              franchiseId: franchise.id,
              publisherId: publisher.id,
            },
          });

          const mockSession: Session = {
            expires: new Date().toISOString(),
            user: user,
          };

          const caller = appRouter.createCaller({
            session: mockSession,
            prisma: prisma,
          });

          //Act
          const result = caller.genre.addGames({
            id: genre.id,
            gameIds: [game.id],
          });

          //Assert
          await expect(result).rejects.toThrowError(
            "Game already linked to Genre"
          );
        });
      });
      describe("and the games are not connected to the genre", () => {
        it("should add the games to the genre", async () => {
          //Arrange
          const genre = await prisma.genre.create({
            data: {
              description: "genre1",
              name: "genre1",
            },
          });

          await prisma.franchise.createMany({
            data: [
              {
                backgroundImage: "franchise1",
                description: "franchise1",
                name: "franchise1",
              },
              {
                backgroundImage: "franchise2",
                description: "franchise2",
                name: "franchise2",
              },
            ],
          });

          await prisma.publisher.createMany({
            data: [
              {
                coverImage: "publisher1",
                description: "publisher1",
                name: "publisher1",
              },
              {
                coverImage: "publisher2",
                description: "publisher2",
                name: "publisher2",
              },
            ],
          });

          const franchises = await prisma.franchise.findMany();
          const publishers = await prisma.publisher.findMany();

          const games: Game[] = [];
          for (let i = 0; i < 2; i++) {
            const game = await prisma.game.create({
              data: {
                backgroundImage: `game${i + 1}`,
                coverImage: `game${i + 1}`,
                description: `game${i + 1}`,
                name: `game${i + 1}`,
                publisherId: publishers[i]?.id ?? createId(),
                franchiseId: franchises[i]?.id ?? createId(),
              },
            });
            games.push(game);
          }
          const mockSession: Session = {
            expires: new Date().toISOString(),
            user: user,
          };

          const caller = appRouter.createCaller({
            session: mockSession,
            prisma: prisma,
          });

          //Act
          await caller.genre.addGames({
            id: genre.id,
            gameIds: games.map((g) => g.id),
          });

          const result = await caller.genre.getGames({ id: genre.id });
          const gamesResult = await prisma.game.findMany({
            where: {
              id: { in: games.map((g) => g.id) },
            },
            select: {
              genres: {
                select: {
                  id: true,
                },
              },
            },
          });

          const expectedGames: { genres: { id: string }[] }[] = [];
          games.forEach(() => {
            expectedGames.push({ genres: [{ id: genre.id }] });
          });

          //Assert
          expect(result).toMatchObject({ games: games });
          expect(gamesResult).toMatchObject(expectedGames);
        });
      });
    });
  });
});

describe("When removing games from a genre", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.genre.removeGames({
        id: createId(),
        gameIds: [],
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the genre does not exist", () => {
    it("should throw an error", async () => {
      //NOTE: Copilot seems to depend on formatting to generate suggestions 24-10-2023: 18:57
      //Arrange
      const mockSession: Session = {
        expires: new Date().toISOString(),
        user: user,
      };

      const caller = appRouter.createCaller({
        session: mockSession,
        prisma: prisma,
      });

      //Act
      const result = caller.genre.removeGames({
        id: createId(),
        gameIds: [createId()],
      });

      //Assert
      await expect(result).rejects.toThrowError("Genre not found");
    });
  });

  describe("and the genre exists", () => {
    describe("and there are no games provided", () => {
      it("should throw an error", async () => {
        //Arrange
        const genre = await prisma.genre.create({
          data: {
            description: "genre1",
            name: "genre1",
          },
        });

        const mockSession: Session = {
          expires: new Date().toISOString(),
          user: user,
        };

        const caller = appRouter.createCaller({
          session: mockSession,
          prisma: prisma,
        });

        //Act
        const result = caller.genre.removeGames({
          id: genre.id,
          gameIds: [],
        });

        //Assert
        await expect(result).rejects.toThrowError("No games to remove");
      });
    });
    describe("and the genre has no games", () => {
      it("should throw an error", async () => {
        //Arrange
        const genre = await prisma.genre.create({
          data: {
            description: "genre6",
            name: "genre6",
          },
        });

        const mockSession: Session = {
          expires: new Date().toISOString(),
          user: user,
        };

        const caller = appRouter.createCaller({
          session: mockSession,
          prisma: prisma,
        });

        //Act
        const result = caller.genre.removeGames({
          id: genre.id,
          gameIds: [createId()],
        });

        //Assert
        await expect(result).rejects.toThrowError();
      });
    });
    describe("and the genre has games", () => {
      describe("and the games the user provides do not exist", () => {
        it("should throw an error", async () => {
          //Arrange

          const franchise = await prisma.franchise.create({
            data: {
              backgroundImage: "franchise1",
              description: "franchise1",
              name: "franchise1",
            },
          });

          const publisher = await prisma.publisher.create({
            data: {
              coverImage: "publisher1",
              description: "publisher1",
              name: "publisher1",
            },
          });

          const genre = await prisma.genre.create({
            data: {
              description: "genre1",
              name: "genre1",
              games: {
                create: {
                  name: "game1",
                  backgroundImage: "game1",
                  coverImage: "game1",
                  description: "game1",
                  franchiseId: franchise.id,
                  publisherId: publisher.id,
                },
              },
            },
          });

          const mockSession: Session = {
            expires: new Date().toISOString(),
            user: user,
          };

          const caller = appRouter.createCaller({
            session: mockSession,
            prisma: prisma,
          });

          //Act
          const result = caller.genre.removeGames({
            id: genre.id,
            gameIds: [createId()],
          });

          //Assert
          await expect(result).rejects.toThrowError();
        });
      });
    });
    describe("and the games the user provides exist", () => {
      describe("and the games the user provides are not connected to the genre", () => {
        it("should throw an error", async () => {
          //Arrange

          const franchise = await prisma.franchise.create({
            data: {
              backgroundImage: "franchise1",
              description: "franchise1",
              name: "franchise1",
            },
          });

          const publisher = await prisma.publisher.create({
            data: {
              coverImage: "publisher1",
              description: "publisher1",
              name: "publisher1",
            },
          });

          const genre = await prisma.genre.create({
            data: {
              description: "genre1",
              name: "genre1",
              games: {
                create: {
                  name: "game1",
                  backgroundImage: "game1",
                  coverImage: "game1",
                  description: "game1",
                  franchiseId: franchise.id,
                  publisherId: publisher.id,
                },
              },
            },
          });

          const wrongGame = await prisma.game.create({
            data: {
              name: "game2",
              backgroundImage: "game2",
              coverImage: "game2",
              description: "game2",
              franchiseId: franchise.id,
              publisherId: publisher.id,
            },
          });

          const mockSession: Session = {
            expires: new Date().toISOString(),
            user: user,
          };

          const caller = appRouter.createCaller({
            session: mockSession,
            prisma: prisma,
          });

          //Act
          const result = caller.genre.removeGames({
            id: genre.id,
            gameIds: [wrongGame.id],
          });

          //Assert
          await expect(result).rejects.toThrowError();
        });
      });
    });
    describe("and the games the user provides are connected to the genre", () => {
      it("should remove the games from the genre", async () => {
        //Arrange
        const genre = await prisma.genre.create({
          data: {
            description: "genre1",
            name: "genre1",
          },
        });

        const expectedUpdated: Genre = {
          id: genre.id,
          description: genre.description,
          name: genre.name,
          games: [],
        };

        await prisma.franchise.createMany({
          data: [
            {
              backgroundImage: "franchise1",
              description: "franchise1",
              name: "franchise1",
            },
            {
              backgroundImage: "franchise2",
              description: "franchise2",
              name: "franchise2",
            },
          ],
        });

        await prisma.publisher.createMany({
          data: [
            {
              coverImage: "publisher1",
              description: "publisher1",
              name: "publisher1",
            },
            {
              coverImage: "publisher2",
              description: "publisher2",
              name: "publisher2",
            },
          ],
        });

        const franchises = await prisma.franchise.findMany();
        const publishers = await prisma.publisher.findMany();

        const games: Game[] = [];
        for (let i = 0; i <= 1; i++) {
          const game = await prisma.game.create({
            data: {
              backgroundImage: `game${i + 1}`,
              coverImage: `game${i + 1}`,
              description: `game${i + 1}`,
              genres: {
                connect: {
                  id: genre.id,
                },
              },
              name: `game${i + 1}`,
              publisherId: publishers[i]?.id ?? createId(),
              franchiseId: franchises[i]?.id ?? createId(),
            },
          });
          games.push(game);
        }

        const mockSession: Session = {
          expires: new Date().toISOString(),
          user: user,
        };

        const caller = appRouter.createCaller({
          session: mockSession,
          prisma: prisma,
        });

        //Act
        await caller.genre.removeGames({
          id: genre.id,
          gameIds: games.map((g) => g.id),
        });

        const gamesResult = await prisma.game.findMany({
          where: {
            id: { in: games.map((g) => g.id) },
          },
          select: {
            genres: true,
          },
        });
        const genreResult = await prisma.genre.findUnique({
          where: {
            id: genre.id,
          },
          include: {
            games: true,
          },
        });

        const expectedGames: { genres: { id: string }[] }[] = [];
        games.forEach(() => {
          expectedGames.push({ genres: [] });
        });
        //Assert
        expect(genreResult).toMatchObject(expectedUpdated);
        expect(gamesResult).toMatchObject(expectedGames);
      });
    });
  });
});
