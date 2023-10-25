/* eslint-disable testing-library/no-await-sync-query */
import type { User } from "@prisma/client";
import type { Session } from "next-auth";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import type { z } from "zod";
import type {
  createDeveloperSchema,
  developerSchema,
} from "~/lib/validations/developer";
import { createId } from "@paralleldrive/cuid2";
import type { gameSchema } from "~/lib/validations/game";

type CreateDeveloper = z.infer<typeof createDeveloperSchema>;
type Developer = z.infer<typeof developerSchema>;
type Game = z.infer<typeof gameSchema>;
const initDevelopers: CreateDeveloper[] = [
  {
    name: "developer1",
    description: "developer1",
    coverImage: "developer1",
  },
  {
    name: "developer2",
    description: "developer2",
    coverImage: "developer2",
  },
];

beforeAll(async () => {
  await prisma.developer.createMany({
    data: initDevelopers,
  });
  console.log("✨ 2 developers created");
  console.log("On: ", process.env.DATABASE_URL);
});

afterAll(async () => {
  const deleteDevelopers = prisma.developer.deleteMany();

  await prisma.$transaction([deleteDevelopers]);
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

describe("When creating a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.developer.create({
        name: "developer1",
        description: "developer1",
        coverImage: "developer1",
      });

      //Assert
      await expect(result).rejects.toThrowError("UNAUTHORIZED");
    });
  });

  describe("and the user is authenticated", () => {
    it("should create a developer", async () => {
      //Arrange
      const developer = {
        name: "developer1",
        description: "developer1",
        coverImage: "developer1",
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
      const result = await caller.developer.create(developer);

      const expectedCreated = await prisma.developer.findUnique({
        where: {
          id: result.id,
        },
      });

      //Assert
      expect(expectedCreated).toMatchObject(developer);
    });
  });
});

describe("When retrieving a developer by Id", () => {
  describe("and the developer does not exist", () => {
    it("should throw an error", async () => {
      //Arrange

      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.developer.getById({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError("Developer not found");
    });
  });

  describe("and the developer exists", () => {
    it("should return the developer", async () => {
      //Arrange
      const developer: CreateDeveloper = {
        name: "developer1",
        description: "developer1",
        coverImage: "developer1",
      };

      const data = await prisma.developer.create({
        data: developer,
      });

      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = await caller.developer.getById({ id: data.id });

      //Assert
      expect(result).toMatchObject(data);
    });
  });
});

describe("When retrieving all developers", () => {
  describe("and there are no developers", () => {
    it("should return an empty array", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      await prisma.developer.deleteMany();

      //Act
      const result = await caller.developer.getAll();

      //Assert
      expect(result).toMatchObject([]);
    });
  });

  describe("and there are developers", () => {
    it("should return an array of developers", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      await prisma.developer.deleteMany();

      await prisma.developer.createMany({
        data: initDevelopers,
      });

      //Act
      const result = await caller.developer.getAll();

      //Assert
      expect(result).toMatchObject(initDevelopers);
    });
  });
});

describe("When updating a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.developer.update({
        id: createId(),
        name: "developer1",
        description: "developer1",
        coverImage: "developer1",
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });
  describe("and the developer does not exist", () => {
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
      const result = caller.developer.update({
        id: createId(),
        name: "developer1",
        description: "developer1",
        coverImage: "developer1",
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the developer exists", () => {
    it("should update the developer", async () => {
      //Arrange
      const data = await prisma.developer.create({
        data: {
          coverImage: "developer1",
          description: "developer1",
          name: "developer1",
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
      const result = await caller.developer.update({
        id: data.id,
        name: "developer2",
        description: "developer2",
        coverImage: "developer2",
      });

      const expectedUpdated = await caller.developer.getById({ id: data.id });

      //Assert
      expect(expectedUpdated).toMatchObject(result);
    });
  });
});

describe("When deleting a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.developer.delete({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the developer does not exist", () => {
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
      const result = caller.developer.delete({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the developer exists", () => {
    describe("and the user is authenticated", () => {
      it("should delete the developer", async () => {
        //Arrange
        const data = await prisma.developer.create({
          data: {
            coverImage: "developer1",
            description: "developer1",
            name: "developer1",
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
        const result = await caller.developer.delete({ id: data.id });

        //Assert
        expect(result).toMatchObject(data);
      });
    });
  });
});

describe("When retrieving a developer's games", () => {
  describe("and the developer does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.developer.getGames({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the developer exists", () => {
    describe("and the developer has no games", () => {
      it("should return an empty array", async () => {
        //Arrange
        const data = await prisma.developer.create({
          data: {
            coverImage: "developer1",
            description: "developer1",
            name: "developer1",
          },
        });

        const caller = appRouter.createCaller({
          session: null,
          prisma: prisma,
        });

        //Act
        const result = await caller.developer.getGames({ id: data.id });

        //Assert
        expect(result).toMatchObject({ games: [] });
      });
    });

    describe("and the developer has games", () => {
      it("should return an array of games", async () => {
        //Arrange
        const developer = await prisma.developer.create({
          data: {
            coverImage: "developer1",
            description: "developer1",
            name: "developer1",
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
            developers: {
              connect: {
                id: developer.id,
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
        const result = await caller.developer.getGames({ id: developer.id });

        //Assert
        expect(result).toMatchObject({ games: [game] });
      });
    });
  });
});

describe("When adding games to a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.developer.addGames({
        id: createId(),
        gameIds: [],
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the developer does not exist", () => {
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
      const result = caller.developer.addGames({
        id: createId(),
        gameIds: [],
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the developer exists", () => {
    describe("and the games do not exist", () => {
      it("should throw an error", async () => {
        //Arrange
        const developer = await prisma.developer.create({
          data: {
            coverImage: "developer1",
            description: "developer1",
            name: "developer1",
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
        const result = caller.developer.addGames({
          id: developer.id,
          gameIds: [createId()],
        });

        //Assert
        await expect(result).rejects.toThrowError("Game not found");
      });
    });

    describe("and the games exist", () => {
      describe("and the games are already connected to the developer", () => {
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

          const developer = await prisma.developer.create({
            data: {
              coverImage: "developer1",
              description: "developer1",
              name: "developer1",
            },
          });

          const game = await prisma.game.create({
            data: {
              name: "game2",
              developers: {
                connect: {
                  id: developer.id,
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
          const result = caller.developer.addGames({
            id: developer.id,
            gameIds: [game.id],
          });

          //Assert
          await expect(result).rejects.toThrowError(
            "Game already linked to Developer"
          );
        });
      });
      describe("and the games are not connected to the developer", () => {
        it("should add the games to the developer", async () => {
          //Arrange
          const developer = await prisma.developer.create({
            data: {
              coverImage: "developer1",
              description: "developer1",
              name: "developer1",
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
          await caller.developer.addGames({
            id: developer.id,
            gameIds: games.map((g) => g.id),
          });

          const result = await caller.developer.getGames({ id: developer.id });
          const gamesResult = await prisma.game.findMany({
            where: {
              id: { in: games.map((g) => g.id) },
            },
            select: {
              developers: {
                select: {
                  id: true,
                },
              },
            },
          });

          const expectedGames: { developers: { id: string }[] }[] = [];
          games.forEach(() => {
            expectedGames.push({ developers: [{ id: developer.id }] });
          });

          //Assert
          expect(result).toMatchObject({ games: games });
          expect(gamesResult).toMatchObject(expectedGames);
        });
      });
    });
  });
});

describe("When removing games from a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.developer.removeGames({
        id: createId(),
        gameIds: [],
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the developer does not exist", () => {
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
      const result = caller.developer.removeGames({
        id: createId(),
        gameIds: [createId()],
      });

      //Assert
      await expect(result).rejects.toThrowError("Developer not found");
    });
  });

  describe("and the developer exists", () => {
    describe("and there are no games provided", () => {
      it("should throw an error", async () => {
        //Arrange
        const developer = await prisma.developer.create({
          data: {
            coverImage: "developer1",
            description: "developer1",
            name: "developer1",
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
        const result = caller.developer.removeGames({
          id: developer.id,
          gameIds: [],
        });

        //Assert
        await expect(result).rejects.toThrowError("No games to remove");
      });
    });
    describe("and the developer has no games", () => {
      it("should throw an error", async () => {
        //Arrange
        const developer = await prisma.developer.create({
          data: {
            coverImage: "developer6",
            description: "developer6",
            name: "developer6",
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
        const result = caller.developer.removeGames({
          id: developer.id,
          gameIds: [createId()],
        });

        //Assert
        await expect(result).rejects.toThrowError();
      });
    });
    describe("and the developer has games", () => {
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

          const developer = await prisma.developer.create({
            data: {
              coverImage: "developer1",
              description: "developer1",
              name: "developer1",
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
          const result = caller.developer.removeGames({
            id: developer.id,
            gameIds: [createId()],
          });

          //Assert
          await expect(result).rejects.toThrowError();
        });
      });
    });
    describe("and the games the user provides exist", () => {
      describe("and the games the user provides are not connected to the developer", () => {
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

          const developer = await prisma.developer.create({
            data: {
              coverImage: "developer1",
              description: "developer1",
              name: "developer1",
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
          const result = caller.developer.removeGames({
            id: developer.id,
            gameIds: [wrongGame.id],
          });

          //Assert
          await expect(result).rejects.toThrowError();
        });
      });
    });
    describe("and the games the user provides are connected to the developer", () => {
      it("should remove the games from the developer", async () => {
        //Arrange
        const developer = await prisma.developer.create({
          data: {
            coverImage: "developer1",
            description: "developer1",
            name: "developer1",
          },
        });

        const expectedUpdated: Developer = {
          id: developer.id,
          coverImage: developer.coverImage,
          description: developer.description,
          name: developer.name,
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
              developers: {
                connect: {
                  id: developer.id,
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
        await caller.developer.removeGames({
          id: developer.id,
          gameIds: games.map((g) => g.id),
        });

        const gamesResult = await prisma.game.findMany({
          where: {
            id: { in: games.map((g) => g.id) },
          },
          select: {
            developers: true,
          },
        });
        const developerResult = await prisma.developer.findUnique({
          where: {
            id: developer.id,
          },
          include: {
            games: true,
          },
        });

        const expectedGames: { developers: { id: string }[] }[] = [];
        games.forEach(() => {
          expectedGames.push({ developers: [] });
        });
        //Assert
        expect(developerResult).toMatchObject(expectedUpdated);
        expect(gamesResult).toMatchObject(expectedGames);
      });
    });
  });
});
