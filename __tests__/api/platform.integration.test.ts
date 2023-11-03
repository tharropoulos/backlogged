/* eslint-disable testing-library/no-await-sync-query */
//NOTE: Written by myself

import type { User } from "@prisma/client";
import type { Session } from "next-auth";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import type { z } from "zod";
import type {
  createPlatformSchema,
  platformSchema,
} from "~/lib/validations/platform";
import { createId } from "@paralleldrive/cuid2";
import type { gameSchema } from "~/lib/validations/game";

type CreatePlatform = z.infer<typeof createPlatformSchema>;
type Platform = z.infer<typeof platformSchema>;
type Game = z.infer<typeof gameSchema>;

const initPlatforms: CreatePlatform[] = [
  {
    coverImage: "platform1",
    name: "platform1",
    description: "platform1",
  },
  {
    coverImage: "platform2",
    name: "platform2",
    description: "platform2",
  },
];

beforeAll(async () => {
  await prisma.platform.createMany({
    data: initPlatforms,
  });

  console.log("✨ 2 platforms created");
  console.log("On: ", process.env.DATABASE_URL);
});

afterAll(async () => {
  const deletePlatforms = prisma.platform.deleteMany();

  await prisma.$transaction([deletePlatforms]);
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

describe("When creating a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.platform.create({
        name: "platform3",
        coverImage: "platform3",
        description: "platform3",
      });

      //Assert
      await expect(result).rejects.toThrowError("UNAUTHORIZED");
    });
  });

  describe("and the user is authenticated", () => {
    it("should create a platform", async () => {
      //Arrange
      const platform: CreatePlatform = {
        name: "platform4",
        coverImage: "platform4",
        description: "platform4",
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
      const result = await caller.platform.create(platform);

      const expectedCreated = await prisma.platform.findUnique({
        where: {
          id: result.id,
        },
      });

      //Assert
      expect(expectedCreated).toMatchObject(platform);
    });
  });
});

describe("When retrieving a platform by Id", () => {
  describe("and the platform does not exist", () => {
    it("should throw an error", async () => {
      //Arrange

      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.platform.getById({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError("Platform not found");
    });
  });

  describe("and the platform exists", () => {
    it("should return the platform", async () => {
      //Arrange
      const platform: CreatePlatform = {
        coverImage: "platform5",
        name: "platform5",
        description: "platform5",
      };

      const data = await prisma.platform.create({
        data: platform,
      });

      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = await caller.platform.getById({ id: data.id });

      //Assert
      expect(result).toMatchObject(data);
    });
  });
});

describe("When retrieving all platforms", () => {
  describe("and there are no platforms", () => {
    it("should return an empty array", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      await prisma.platform.deleteMany();

      //Act
      const result = await caller.platform.getAll();

      //Assert
      expect(result).toMatchObject([]);
    });
  });

  describe("and there are platforms", () => {
    it("should return an array of platforms", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      await prisma.platform.deleteMany();

      await prisma.platform.createMany({
        data: initPlatforms,
      });

      //Act
      const result = await caller.platform.getAll();

      //Assert
      expect(result).toMatchObject(initPlatforms);
    });
  });
});

describe("When updating a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.platform.update({
        coverImage: "platform1",
        id: createId(),
        name: "platform1",
        description: "platform1",
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });
  describe("and the platform does not exist", () => {
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
      const result = caller.platform.update({
        id: createId(),
        name: "platform1",
        description: "platform1",
        coverImage: "platform1",
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the platform exists", () => {
    it("should update the platform", async () => {
      //Arrange
      const data = await prisma.platform.create({
        data: {
          description: "platform1",
          name: "platform1",
          coverImage: "platform1",
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
      const result = await caller.platform.update({
        id: data.id,
        coverImage: "platform4",
        name: "platform4",
        description: "platform4",
      });

      const expectedUpdated = await caller.platform.getById({ id: data.id });

      //Assert
      expect(expectedUpdated).toMatchObject(result);
    });
  });
});

describe("When deleting a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.platform.delete({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the platform does not exist", () => {
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
      const result = caller.platform.delete({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the platform exists", () => {
    describe("and the user is authenticated", () => {
      it("should delete the platform", async () => {
        //Arrange
        const data = await prisma.platform.create({
          data: {
            description: "platform1",
            name: "platform1",
            coverImage: "platform1",
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
        const result = await caller.platform.delete({ id: data.id });

        //Assert
        expect(result).toMatchObject(data);
      });
    });
  });
});

describe("When retrieving a platform's games", () => {
  describe("and the platform does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.platform.getGames({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the platform exists", () => {
    describe("and the platform has no games", () => {
      it("should return an empty array", async () => {
        //Arrange
        const data = await prisma.platform.create({
          data: {
            description: "platform1",
            coverImage: "platform1",
            name: "platform1",
          },
        });

        const caller = appRouter.createCaller({
          session: null,
          prisma: prisma,
        });

        //Act
        const result = await caller.platform.getGames({ id: data.id });

        //Assert
        expect(result).toMatchObject([]);
      });
    });

    describe("and the platform has games", () => {
      it("should return an array of games", async () => {
        //Arrange
        const platform = await prisma.platform.create({
          data: {
            description: "platform1",
            coverImage: "platform1",
            name: "platform1",
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
            description: "game1",
            name: "game1",
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
            coverImage: "game1",
            platforms: {
              create: [
                {
                  storeLink: "game1",
                  platform: {
                    connect: {
                      id: platform.id,
                    },
                  },
                },
              ],
            },
          },
        });

        const caller = appRouter.createCaller({
          session: null,
          prisma: prisma,
        });

        //Act
        const result = await caller.platform.getGames({ id: platform.id });

        //Assert
        expect(result).toMatchObject([game]);
      });
    });
  });
});

describe("When adding games to a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.platform.addGames({
        id: createId(),
        games: [],
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the platform does not exist", () => {
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
      const result = caller.platform.addGames({
        id: createId(),
        games: [],
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the platform exists", () => {
    describe("and the games do not exist", () => {
      it("should throw an error", async () => {
        //Arrange
        const platform = await prisma.platform.create({
          data: {
            coverImage: "platform1",
            description: "platform1",
            name: "platform1",
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
        const result = caller.platform.addGames({
          id: platform.id,
          games: [
            {
              id: createId(),
              storeLink: "game1",
            },
            {
              id: createId(),
              storeLink: "game2",
            },
          ],
        });

        //Assert
        await expect(result).rejects.toThrowError("Game not found");
      });
    });

    describe("and the games exist", () => {
      describe("and the games are already connected to the platform", () => {
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

          const platform = await prisma.platform.create({
            data: {
              description: "platform1",
              coverImage: "platform1",
              name: "platform1",
            },
          });

          const game = await prisma.game.create({
            data: {
              name: "game2",
              platforms: {
                create: [
                  {
                    storeLink: "game1",
                    platform: {
                      connect: {
                        id: platform.id,
                      },
                    },
                  },
                ],
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
          const result = caller.platform.addGames({
            id: platform.id,
            games: [
              {
                id: game.id,
                storeLink: "game1",
              },
            ],
          });

          //Assert
          await expect(result).rejects.toThrowError(
            "Game already linked to Platform"
          );
        });
      });
      describe("and the games are not connected to the platform", () => {
        it("should add the games to the platform", async () => {
          //Arrange
          const platform = await prisma.platform.create({
            data: {
              coverImage: "platform1",
              description: "platform1",
              name: "platform1",
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
          await caller.platform.addGames({
            id: platform.id,
            games: games.map((g) => ({
              id: g.id,
              storeLink: "link",
            })),
          });

          const result = await caller.platform.getGames({ id: platform.id });
          const gamesResult = await prisma.game.findMany({
            where: {
              id: { in: games.map((g) => g.id) },
            },
            select: {
              platforms: {
                select: {
                  platform: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          });

          function createPlatformObjects(
            platformIds: string[]
          ): { platforms: { id: string }[] }[] {
            return platformIds.map((id) => ({ platforms: [{ id }] }));
          }

          const test: { platforms: { id: string }[] }[] = gamesResult.flatMap(
            (platform) =>
              createPlatformObjects(
                platform.platforms.map((p) => p.platform.id)
              )
          );

          const expectedGames: { platforms: { id: string }[] }[] = [];
          games.forEach(() => {
            expectedGames.push({ platforms: [{ id: platform.id }] });
          });

          //Assert
          expect(
            result.sort((a, b) => a.name.localeCompare(b.name))
          ).toMatchObject(games.sort((a, b) => a.name.localeCompare(b.name)));
          expect(test).toMatchObject(expectedGames);
        });
      });
    });
  });
});

describe("When removing games from a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.platform.removeGames({
        id: createId(),
        gameIds: [],
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the platform does not exist", () => {
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
      const result = caller.platform.removeGames({
        id: createId(),
        gameIds: [createId()],
      });

      //Assert
      await expect(result).rejects.toThrowError("Platform not found");
    });
  });

  describe("and the platform exists", () => {
    describe("and there are no games provided", () => {
      it("should throw an error", async () => {
        //Arrange
        const platform = await prisma.platform.create({
          data: {
            description: "platform1",
            name: "platform1",
            coverImage: "platform1",
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
        const result = caller.platform.removeGames({
          id: platform.id,
          gameIds: [],
        });

        //Assert
        await expect(result).rejects.toThrowError("No games to remove");
      });
    });
    describe("and the platform has no games", () => {
      it("should throw an error", async () => {
        //Arrange
        const platform = await prisma.platform.create({
          data: {
            coverImage: "platform6",
            description: "platform6",
            name: "platform6",
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
        const result = caller.platform.removeGames({
          id: platform.id,
          gameIds: [createId()],
        });

        //Assert
        await expect(result).rejects.toThrowError();
      });
    });
    describe("and the platform has games", () => {
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

          const platform = await prisma.platform.create({
            data: {
              coverImage: "platform1",
              description: "platform1",
              name: "platform1",
              games: {
                create: [
                  {
                    storeLink: "game1",
                    game: {
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
                ],
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
          const result = caller.platform.removeGames({
            id: platform.id,
            gameIds: [createId()],
          });

          //Assert
          await expect(result).rejects.toThrowError();
        });
      });
    });
    describe("and the games the user provides exist", () => {
      describe("and the games the user provides are not connected to the platform", () => {
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

          const platform = await prisma.platform.create({
            data: {
              coverImage: "platform1",
              description: "platform1",
              name: "platform1",
              games: {
                create: [
                  {
                    storeLink: "game1",
                    game: {
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
                ],
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
          const result = caller.platform.removeGames({
            id: platform.id,
            gameIds: [wrongGame.id],
          });

          //Assert
          await expect(result).rejects.toThrowError();
        });
      });
    });
    describe("and the games the user provides are connected to the platform", () => {
      it("should remove the games from the platform", async () => {
        //Arrange
        const platform = await prisma.platform.create({
          data: {
            coverImage: "platform1",
            description: "platform1",
            name: "platform1",
          },
        });

        const expectedUpdated: Platform = {
          coverImage: platform.coverImage,
          id: platform.id,
          description: platform.description,
          name: platform.name,
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
              platforms: {
                create: [
                  {
                    storeLink: "game1",
                    platform: {
                      connect: {
                        id: platform.id,
                      },
                    },
                  },
                ],
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
        await caller.platform.removeGames({
          id: platform.id,
          gameIds: games.map((g) => g.id),
        });

        const gamesResult = await prisma.game.findMany({
          where: {
            id: { in: games.map((g) => g.id) },
          },
          select: {
            platforms: true,
          },
        });
        const platformResult = await prisma.platform.findUnique({
          where: {
            id: platform.id,
          },
          include: {
            games: true,
          },
        });

        const expectedGames: { platforms: { id: string }[] }[] = [];
        games.forEach(() => {
          expectedGames.push({ platforms: [] });
        });
        //Assert
        expect(platformResult).toMatchObject(expectedUpdated);
        expect(gamesResult).toMatchObject(expectedGames);
      });
    });
  });
});
