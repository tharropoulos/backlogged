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
import { type createDeveloperSchema } from "~/lib/validations/developer";
import { Prisma, type Developer, type Game } from "@prisma/client";

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

describe("When creating a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.developer.create({
          name: faker.company.name(),
          image: faker.image.url(),
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
          caller.developer.create({
            name: faker.company.name(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      it("should create a developer", async () => {
        // Arrange
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockAdminSession,
        });

        const expectedCreated: z.infer<typeof createDeveloperSchema> & {
          id: string;
        } = {
          name: faker.company.name(),
          id: createId(),
          image: faker.image.url(),
          description: faker.lorem.words(),
        };

        mockCtx.prisma.developer.create.mockResolvedValue(expectedCreated);

        // Act
        const result = await caller.developer.create(expectedCreated);

        // Assert
        expect(result.ok).toBe(true);
        expect(mockCtx.prisma.developer.create).toHaveBeenCalledWith({
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

describe("When retrieving all developers", () => {
  describe("and there are no developers", () => {
    it("should return an empty array", async () => {
      // Arrange
      mockCtx.prisma.developer.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.developer.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
      expect(mockCtx.prisma.developer.findMany).toHaveBeenCalledWith();
    });
  });

  describe("and there are developers", () => {
    it("should return the developers", async () => {
      // Arrange
      const developers: Array<Developer> = [
        {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          image: faker.image.url(),
        },
        {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          image: faker.image.url(),
        },
      ];

      mockCtx.prisma.developer.findMany.mockResolvedValue(developers);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.developer.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(developers);
    });
  });
});

describe("When retrieving a developer by Id", () => {
  describe("and the developer does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      mockCtx.prisma.developer.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      const result = await caller.developer.getById({
        id: createId(),
      });

      // Act + Expect
      expect(result.ok).toBe(false);
    });
  });
  describe("and the developer exists", () => {
    it("should return the developer", async () => {
      // Arrange
      const developer: Developer = {
        name: faker.company.name(),
        id: createId(),
        image: faker.image.url(),
        description: faker.lorem.words(),
      };

      mockCtx.prisma.developer.findUnique.mockResolvedValue(developer);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.developer.getById({ id: developer.id });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(developer);
      expect(mockCtx.prisma.developer.findUnique).toHaveBeenCalledWith({
        where: {
          id: developer.id,
        },
      });
    });
  });
});

describe("When updating a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.developer.update({
          name: faker.company.name(),
          id: createId(),
          image: faker.image.url(),
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
          caller.developer.update({
            name: faker.company.name(),
            id: createId(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the developer does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.developer.update.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError("Record Not Found", {
              code: "P2025",
              clientVersion: "2.30.0",
            })
          );

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          //Act
          const result = await caller.developer.update({
            name: faker.company.name(),
            id: createId(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          });

          //Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the developer exists", () => {
        it("should update the developer", async () => {
          // Arrange
          const developer: Developer = {
            name: faker.company.name(),
            id: createId(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.developer.findUnique.mockResolvedValue(developer);

          const expectedUpdated: Developer = {
            id: developer.id,
            name: faker.company.name(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.developer.update.mockResolvedValue(expectedUpdated);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.developer.update(expectedUpdated);

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(expectedUpdated);
          expect(mockCtx.prisma.developer.update).toHaveBeenCalledWith({
            data: {
              name: expectedUpdated.name,
              description: expectedUpdated.description,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              image: expectedUpdated.image,
            },
            where: {
              id: developer.id,
            },
          });
        });
      });
    });
  });
});

describe("When deleting a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.developer.delete({
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
          caller.developer.delete({
            id: createId(),
          })
        ).rejects.toThrow();
      });
    });
    describe("and the user is an admin", () => {
      describe("and the developer does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.developer.delete.mockRejectedValue(
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
          const result = await caller.developer.delete({
            id: createId(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the developer exists", () => {
        it("should delete the developer", async () => {
          // Arrange
          const developer: Developer = {
            id: createId(),
            name: faker.company.name(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.developer.findUnique.mockResolvedValue(developer);

          const expectedDeleted: Developer = {
            id: createId(),
            name: faker.company.name(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.developer.delete.mockResolvedValue(expectedDeleted);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.developer.delete({
            id: developer.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(expectedDeleted);
          expect(mockCtx.prisma.developer.delete).toHaveBeenCalledWith({
            where: {
              id: developer.id,
            },
          });
        });
      });
    });
  });
});

describe("When retrieving games of a developer", () => {
  describe("and the developer does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      mockCtx.prisma.developer.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.developer.getGames({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the developer exists", () => {
    // REVISION_1: add test for when the developer has no games
    describe("and the developer has no games", () => {
      it("should return an empty array", async () => {
        // Arrange
        const developer: Developer & { games: Array<Game> } = {
          id: createId(),
          name: faker.company.name(),
          image: faker.image.url(),
          description: faker.lorem.words(),
          games: [],
        };

        mockCtx.prisma.developer.findUnique.mockResolvedValue(developer);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.developer.getGames({ id: developer.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap().length).toBe(0);
        expect(mockCtx.prisma.developer.findUnique).toHaveBeenCalledWith({
          where: {
            id: developer.id,
          },
          select: {
            games: true,
          },
        });
      });
    });
    // END_REVISION_1
    describe("and the developer has games", () => {
      it("should return the games of the developer", async () => {
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

        const developer: Developer & { games: Array<Game> } = {
          id: createId(),
          name: faker.company.name(),
          image: faker.image.url(),
          description: faker.lorem.words(),
          games: games,
        };

        mockCtx.prisma.developer.findUnique.mockResolvedValue(developer);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.developer.getGames({ id: developer.id });

        // Assert
        expect(result.ok).toBe(true);
        // REWRITE_1: use toBe instead of toMatchObject
        expect(result.unwrap().length).toBe(games.length);
        // expect(result.unwrap.length).toMatchObject(games.length);
        expect(mockCtx.prisma.developer.findUnique).toHaveBeenCalledWith({
          where: {
            id: developer.id,
          },
          select: {
            games: true,
          },
        });
      });
    });
  });
});

describe("When adding games to a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      //Act+Assert
      // REWRITE_2: throw error instead of returning Err
      await expect(() =>
        caller.developer.addGames({
          developerId: createId(),
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

        // Act+Assert
        // REWRITE_2: throw error instead of returning Err
        await expect(() =>
          caller.developer.addGames({
            developerId: createId(),
            gameIds: [createId()],
          })
        ).rejects.toThrow();
        // const result = await caller.developer.addGames({
        //   developerId: createId(),
        //   gameIds: [createId()],
        // });

        // // Assert
        // expect(result.ok).toBe(false);
      });
    });

    describe("and the user is an admin", () => {
      describe("and the developer does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.developer.update.mockRejectedValue(
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
          const result = await caller.developer.addGames({
            developerId: createId(),
            gameIds: [createId()],
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the developer exists", () => {
        // REVISION_2: add test for when the games do not exist
        describe("and the games do not exist", () => {
          it("should return an error", async () => {
            // Arrange
            const nonExistentGameId = createId();
            // END_COPILOT_CODE

            // BEGIN_NON_COPILOT_CODE
            mockCtx.prisma.developer.update.mockRejectedValue(
              new Prisma.PrismaClientKnownRequestError("Record Not Found", {
                code: "P2025",
                clientVersion: "2.30.0",
              })
            );
            // END_NON_COPILOT_CODE

            // BEGIN_COPILOT_CODE
            const caller = appRouter.createCaller({
              prisma: mockCtx.prisma,
              session: mockAdminSession,
            });

            // Act
            const result = await caller.developer.addGames({
              developerId: createId(),
              gameIds: [nonExistentGameId],
            });

            // Assert
            expect(result.ok).toBe(false);
          });
        });
        // END_REVISION_2
        describe("and the games exist", () => {
          it("should add the games to the developer", async () => {
            // Arrange
            const developer: Developer = {
              id: createId(),
              name: faker.company.name(),
              image: faker.image.url(),
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

            const updatedDeveloper = {
              ...developer,
              games: games,
            };

            mockCtx.prisma.developer.update.mockResolvedValue(updatedDeveloper);

            const caller = appRouter.createCaller({
              prisma: mockCtx.prisma,
              session: mockAdminSession,
            });

            // Act
            const result = await caller.developer.addGames({
              developerId: developer.id,
              gameIds: games.map((game) => game.id),
            });

            // Assert
            expect(result.ok).toBe(true);
            expect(result.val).toMatchObject({
              ...developer,
              games,
            });
            expect(mockCtx.prisma.developer.update).toHaveBeenCalledWith({
              where: {
                id: developer.id,
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

describe("When removing games from a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act+Assert
      await expect(() =>
        caller.developer.removeGames({
          developerId: createId(),
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

        // Act+Assert
        await expect(() =>
          caller.developer.removeGames({
            developerId: createId(),
            gameIds: [createId()],
          })
        ).rejects.toThrow();
      });
    });
    describe("and the user is an admin", () => {
      describe("and the developer does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.developer.update.mockRejectedValue(
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
          const result = await caller.developer.removeGames({
            developerId: createId(),
            gameIds: [createId()],
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the developer exists", () => {
        describe("and the games do not exist", () => {
          it("should return an error", async () => {
            // Arrange
            const nonExistentGameId = createId();
            // REWRITE_3: create mockDeveloperId
            const mockDeveloperId = createId();
            mockCtx.prisma.developer.update.mockRejectedValue(
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
            const result = await caller.developer.removeGames({
              // REWRITE_3: create mockDeveloperId
              //   developerId: developer.id,
              developerId: mockDeveloperId,
              gameIds: [nonExistentGameId],
            });

            // Assert
            expect(result.ok).toBe(false);
          });
        });

        describe("and the games exist", () => {
          it("should disconnect the games from the developer", async () => {
            // END_COPILOT_CODE
            // BEGIN_NON_COPILOT_CODE
            // Arrange
            const developer: Developer = {
              id: createId(),
              name: faker.company.name(),
              image: faker.image.url(),
              description: faker.lorem.words(),
            };

            const gameIds = [createId(), createId()];
            const updatedDeveloper = {
              ...developer,
              games: [],
            };

            mockCtx.prisma.developer.update.mockResolvedValue(updatedDeveloper);
            // END_NON_COPILOT_CODE
            // BEGIN_COPILOT_CODE

            const caller = appRouter.createCaller({
              prisma: mockCtx.prisma,
              session: mockAdminSession,
            });

            // Act
            const result = await caller.developer.removeGames({
              developerId: developer.id,
              gameIds: gameIds,
            });

            // Assert
            expect(result.ok).toBe(true);
            // REWRITE_4: use toMatchObject instead of toEqual
            // REWRITE_5: use .val instead of .value
            // expect(result.value).toEqual(updatedDeveloper);
            expect(result.val).toMatchObject(updatedDeveloper);
          });
        });
      });
    });
  });
});
// END_COPILOT_CODE
