/* eslint-disable testing-library/no-await-sync-query */
/* eslint-disable @typescript-eslint/unbound-method */
// BEGIN_COPILOT_CODE
import { appRouter } from "~/server/api/root";
import { createMockContext, type MockContext } from "~/server/api/context";
import type { Session, User } from "next-auth";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { type z } from "zod";
import { type createPlatformSchema } from "~/lib/validations/platform";
import {
  Prisma,
  type Platform,
  type GameToPlatform,
  type Game,
} from "@prisma/client";

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

describe("When creating a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.platform.create({
          //REWRITE_1: Add all required fields
          //   name: faker.company.name(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          image: faker.image.url(),
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
          caller.platform.create({
            //REWRITE_1: Add all required fields
            //   name: faker.company.name(),
            name: faker.company.name(),
            description: faker.lorem.words(),
            image: faker.image.url(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      it("should create a platform", async () => {
        // Arrange
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockAdminSession,
        });

        const expectedCreated: z.infer<typeof createPlatformSchema> & {
          id: string;
        } = {
          //REWRITE_1: Add all required fields
          name: faker.company.name(),
          description: faker.lorem.words(),
          image: faker.image.url(),
          id: createId(),
        };

        mockCtx.prisma.platform.create.mockResolvedValue(expectedCreated);

        // Act
        const result = await caller.platform.create(expectedCreated);

        // Assert
        expect(result.ok).toBe(true);
        expect(mockCtx.prisma.platform.create).toHaveBeenCalledWith({
          data: {
            name: expectedCreated.name,
            description: expectedCreated.description,
            image: expectedCreated.image,
          },
        });
      });
    });
  });
});

describe("When retrieving all platforms", () => {
  describe("and there are no platforms", () => {
    it("should return an empty array", async () => {
      // Arrange
      mockCtx.prisma.platform.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.platform.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
      expect(mockCtx.prisma.platform.findMany).toHaveBeenCalledWith();
    });
  });

  describe("and there are platforms", () => {
    it("should return the platforms", async () => {
      // Arrange
      const platforms: Array<Platform> = [
        {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          // REWRITE_2: use faker.image.url() instead of faker.image.imageUrl()
          //   image: faker.image.imageUrl(),
          image: faker.image.url(),
        },
        {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          // REWRITE_2: use faker.image.url() instead of faker.image.imageUrl()
          //   image: faker.image.imageUrl(),
          image: faker.image.url(),
        },
      ];

      mockCtx.prisma.platform.findMany.mockResolvedValue(platforms);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.platform.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(platforms);
    });
  });
});

describe("When retrieving a single platform by Id", () => {
  describe("and the platform does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const platformId = createId();
      mockCtx.prisma.platform.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.platform.getById({ id: platformId });

      // Assert
      expect(result.ok).toBe(false);
      expect(mockCtx.prisma.platform.findUnique).toHaveBeenCalledWith({
        where: { id: platformId },
      });
    });
  });

  describe("and the platform exists", () => {
    it("should return the platform", async () => {
      // Arrange
      const platform: Platform = {
        id: createId(),
        name: faker.company.name(),
        description: faker.lorem.paragraph(),
        image: faker.image.url(),
      };

      mockCtx.prisma.platform.findUnique.mockResolvedValue(platform);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.platform.getById({ id: platform.id });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(platform);
    });
  });
});

describe("When updating a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.platform.update({
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.paragraph(),
          image: faker.image.url(),
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
          caller.platform.update({
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.paragraph(),
            image: faker.image.url(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the platform does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.platform.update.mockRejectedValue(
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
          const result = await caller.platform.update({
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.paragraph(),
            image: faker.image.url(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the platform exists", () => {
        it("should update the platform", async () => {
          // Arrange
          const platform: Platform = {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.words(),
            image: faker.image.url(),
          };

          const updateData = {
            name: faker.company.name(),
            description: faker.lorem.words(),
            image: faker.image.url(),
          };

          const updatedPlatform = { ...platform, ...updateData };

          mockCtx.prisma.platform.update.mockResolvedValue(updatedPlatform);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.platform.update({
            id: platform.id,
            ...updateData,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(updatedPlatform);
          expect(mockCtx.prisma.platform.update).toHaveBeenCalledWith({
            where: { id: platform.id },
            data: updateData,
          });
        });
      });
    });
  });
});

describe("When deleting a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.platform.delete({
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
          caller.platform.delete({
            id: createId(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the platform does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.platform.delete.mockRejectedValue(
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
          const result = await caller.platform.delete({
            id: createId(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the platform exists", () => {
        it("should delete the platform", async () => {
          // Arrange
          const platform: Platform = {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.paragraph(),
            image: faker.image.url(),
          };

          mockCtx.prisma.platform.findUnique.mockResolvedValue(platform);

          const expectedDeleted: Platform = {
            id: platform.id,
            name: faker.company.name(),
            description: faker.lorem.paragraph(),
            image: faker.image.url(),
          };

          mockCtx.prisma.platform.delete.mockResolvedValue(expectedDeleted);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.platform.delete({
            id: platform.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(expectedDeleted);
          expect(mockCtx.prisma.platform.delete).toHaveBeenCalledWith({
            where: {
              id: platform.id,
            },
          });
        });
      });
    });
  });
});

describe("When retrieving games of a platform", () => {
  describe("and the platform does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      mockCtx.prisma.platform.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.platform.getGames({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the platform exists", () => {
    describe("and the platform has no games", () => {
      it("should return an empty array", async () => {
        // Arrange
        const platform: Platform & { games: Array<Game> } = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.paragraph(),
          image: faker.image.url(),
          games: [],
        };

        mockCtx.prisma.platform.findUnique.mockResolvedValue(platform);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.platform.getGames({ id: platform.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap().length).toBe(0);
      });
    });

    describe("and the platform has games", () => {
      it("should return the games of the platform", async () => {
        // Arrange

        // REVISION_1: Correct the return type of getGames
        //  const games: Array<Game> = [
        //           {
        //             id: createId(),
        //             name: faker.company.name(),
        //             description: faker.lorem.paragraph(),
        //             backgroundImage: faker.image.url(),
        //             coverImage: faker.image.url(),
        //             releaseDate: faker.date.past(),
        //             publisherId: createId(),
        //             franchiseId: createId(),
        //           },
        //           {
        //             id: createId(),
        //             name: faker.company.name(),
        //             description: faker.lorem.paragraph(),
        //             backgroundImage: faker.image.url(),
        //             coverImage: faker.image.url(),
        //             releaseDate: faker.date.past(),
        //             publisherId: createId(),
        //             franchiseId: createId(),
        //           },
        //         ];

        //         const platform: Platform & { games: Array<Game> } = {
        //           id: createId(),
        //           name: faker.company.name(),
        //           description: faker.lorem.paragraph(),
        //           image: faker.image.url(),
        //           games: games,
        //         };

        //         mockCtx.prisma.platform.findUnique.mockResolvedValue(platform);

        //         const caller = appRouter.createCaller({
        //           prisma: mockCtx.prisma,
        //           session: null,
        //         });
        const games: Array<Game> = [
          {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.paragraph(),
            backgroundImage: faker.image.url(),
            coverImage: faker.image.url(),
            releaseDate: faker.date.past(),
            publisherId: createId(),
            franchiseId: createId(),
          },
          {
            id: createId(),
            name: faker.company.name(),
            description: faker.lorem.paragraph(),
            backgroundImage: faker.image.url(),
            coverImage: faker.image.url(),
            releaseDate: faker.date.past(),
            publisherId: createId(),
            franchiseId: createId(),
          },
        ];

        const gameToPlatforms: Array<GameToPlatform & { game: Game }> =
          games.map((game) => ({
            gameId: game.id,
            platformId: createId(),
            game: game,
            // REWRITE_4: add storeLink and id to GameToPlatform
            storeLink: faker.internet.url(),
            id: faker.number.int(),
          }));

        const platform: Platform & {
          games: Array<GameToPlatform & { game: Game }>;
        } = {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.paragraph(),
          image: faker.image.url(),
          games: gameToPlatforms,
        };
        // END_REVISION_1

        mockCtx.prisma.platform.findUnique.mockResolvedValue(platform);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.platform.getGames({ id: platform.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap()).toMatchObject(gameToPlatforms);
      });
    });
  });
});

describe("When adding games to a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.platform.addGames({
          platformId: createId(),
          games: [{ id: createId(), storeLink: faker.internet.url() }],
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
          caller.platform.addGames({
            platformId: createId(),
            games: [{ id: createId(), storeLink: faker.internet.url() }],
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the platform does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.platform.update.mockRejectedValue(
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
          const result = await caller.platform.addGames({
            platformId: createId(),
            games: [{ id: createId(), storeLink: faker.internet.url() }],
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the platform exists", () => {
        describe("and the games do not exist", () => {
          it("should return an error", async () => {
            // Arrange
            const nonExistentGameId = createId();

            mockCtx.prisma.platform.update.mockRejectedValue(
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
            const result = await caller.platform.addGames({
              platformId: createId(),
              games: [
                { id: nonExistentGameId, storeLink: faker.internet.url() },
              ],
            });

            // Assert
            expect(result.ok).toBe(false);
          });
        });

        describe("and the games exist", () => {
          it("should add the games to the platform", async () => {
            // Arrange
            const game: Game = {
              id: createId(),
              name: faker.company.name(),
              description: faker.lorem.paragraph(),
              backgroundImage: faker.image.url(),
              coverImage: faker.image.url(),
              releaseDate: faker.date.past(),
              publisherId: createId(),
              franchiseId: createId(),
            };

            const platform: Platform & {
              games: Array<GameToPlatform & { game: Game }>;
            } = {
              id: createId(),
              name: faker.company.name(),
              description: faker.lorem.paragraph(),
              image: faker.image.url(),
              games: [
                {
                  gameId: game.id,
                  // REWRITE_5: add id GameToPlatform
                  id: faker.number.int(),
                  platformId: createId(),
                  storeLink: faker.internet.url(),
                  game: game,
                },
              ],
            };

            mockCtx.prisma.platform.update.mockResolvedValue(platform);

            const caller = appRouter.createCaller({
              prisma: mockCtx.prisma,
              session: mockAdminSession,
            });

            // Act
            const result = await caller.platform.addGames({
              platformId: platform.id,
              games: [{ id: game.id, storeLink: faker.internet.url() }],
            });

            // Assert
            expect(result.ok).toBe(true);
            // REWRITE_6: check for length
            // expect(result.unwrap()).toMatchObject(platform);
            expect(result.unwrap().games).toHaveLength(platform.games.length);
          });
        });
      });
    });
  });
});

describe("When removing games from a platform", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.platform.removeGames({
          platformId: createId(),
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
          caller.platform.removeGames({
            platformId: createId(),
            gameIds: [createId()],
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the platform does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.platform.update.mockRejectedValue(
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
          const result = await caller.platform.removeGames({
            platformId: createId(),
            gameIds: [createId()],
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the platform exists", () => {
        describe("and the games do not exist", () => {
          it("should return an error", async () => {
            // Arrange
            const nonExistentGameId = createId();

            mockCtx.prisma.platform.update.mockRejectedValue(
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
            const result = await caller.platform.removeGames({
              platformId: createId(),
              gameIds: [nonExistentGameId],
            });

            // Assert
            expect(result.ok).toBe(false);
          });
        });
        describe("and the games exist", () => {
          it("should remove the games from the platform", async () => {
            // Arrange
            const game: Game = {
              id: createId(),
              name: faker.company.name(),
              description: faker.lorem.paragraph(),
              backgroundImage: faker.image.url(),
              coverImage: faker.image.url(),
              releaseDate: faker.date.past(),
              publisherId: createId(),
              franchiseId: createId(),
            };

            const platform: Platform & {
              games: Array<GameToPlatform & { game: Game }>;
            } = {
              id: createId(),
              name: faker.company.name(),
              description: faker.lorem.paragraph(),
              image: faker.image.url(),
              games: [],
            };

            mockCtx.prisma.platform.update.mockResolvedValue(platform);

            const caller = appRouter.createCaller({
              prisma: mockCtx.prisma,
              session: mockAdminSession,
            });

            // Act
            const result = await caller.platform.removeGames({
              platformId: platform.id,
              gameIds: [game.id],
            });

            // Assert
            expect(result.ok).toBe(true);
            expect(result.unwrap().games).toHaveLength(0);
            // BEGIN_COPILOT_SUGGESTION
            expect(mockCtx.prisma.platform.update).toHaveBeenCalledWith({
              where: {
                id: platform.id,
              },
              data: {
                games: {
                  // REWRITE_7: use array instead of object
                  //   deleteMany: {
                  //       gameId: game.id,
                  //     },
                  //
                  deleteMany: [
                    {
                      gameId: game.id,
                    },
                  ],
                },
              },
              include: {
                games: {
                  include: {
                    game: true,
                  },
                },
              },
            });
            // END_COPILOT_SUGGESTION
          });
        });
      });
    });
  });
});
// END_COPILOT_CODE
