/* eslint-disable testing-library/no-await-sync-query */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
// BEGIN_COPILOT_CODE
// REVISION_1: import and create mocks
// Import necessary modules and types
import { appRouter } from "~/server/api/root";
import { createMockContext, type MockContext } from "~/server/api/context";
import type { Session, User } from "next-auth";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { type z } from "zod";
import { type createFeatureSchema } from "~/lib/validations/feature";
import { Prisma, type Feature, type Game } from "@prisma/client";

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
// END_REVISION_1
describe("When creating a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.feature.create({
          description: faker.lorem.words(),
          // REWRITE_1: remove deprecated image field
          //   image: faker.image.url(),
          image: faker.image.url(),
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
          caller.feature.create({
            name: faker.company.name(),
            // REWRITE_1: remove deprecated image field
            //   image: faker.image.url(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      it("should create a feature", async () => {
        // Arrange
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockAdminSession,
        });

        const expectedCreated: z.infer<typeof createFeatureSchema> & {
          id: string;
        } = {
          name: faker.company.name(),
          id: createId(),
          // REWRITE_1: remove deprecated image field
          //   image: faker.image.imageUrl(),
          image: faker.image.url(),
          description: faker.lorem.words(),
        };

        mockCtx.prisma.feature.create.mockResolvedValue(expectedCreated);

        // Act
        const result = await caller.feature.create(expectedCreated);

        // Assert
        expect(result.ok).toBe(true);
        expect(mockCtx.prisma.feature.create).toHaveBeenCalledWith({
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

describe("When retrieving all features", () => {
  describe("and there are no features", () => {
    it("should return an empty array", async () => {
      // Arrange
      mockCtx.prisma.feature.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.feature.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
      expect(mockCtx.prisma.feature.findMany).toHaveBeenCalledWith();
    });
  });

  describe("and there are features", () => {
    it("should return the features", async () => {
      // Arrange
      const features: Array<Feature> = [
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
          // REWRITE_1: remove deprecated image field
          //   image: faker.image.imageUrl(),
          image: faker.image.url(),
        },
      ];

      mockCtx.prisma.feature.findMany.mockResolvedValue(features);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.feature.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(features);
    });
  });
});

describe("When retrieving a single feature by Id", () => {
  describe("and the feature does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const featureId = createId();
      mockCtx.prisma.feature.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act

      // REWRITE_2: use getById instead of get
      //   const result = await caller.feature.get({ id: feature.id });

      // REWRITE_4: use the featureId variable instead of createId()
      //   const result = await caller.feature.getById({ id: createId() });

      const result = await caller.feature.getById({ id: featureId });

      // Assert
      expect(result.ok).toBe(false);
      expect(mockCtx.prisma.feature.findUnique).toHaveBeenCalledWith({
        where: { id: featureId },
      });
    });
  });

  describe("and the feature exists", () => {
    it("should return the feature", async () => {
      // Arrange
      const feature: Feature = {
        id: createId(),
        name: faker.company.name(),
        description: faker.lorem.words(),
        image: faker.image.url(),
      };

      mockCtx.prisma.feature.findUnique.mockResolvedValue(feature);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      // REWRITE_2: use getById instead of get
      //   const result = await caller.feature.get({ id: feature.id });
      const result = await caller.feature.getById({ id: feature.id });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(feature);
    });
  });
});

describe("When updating a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.feature.update({
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
          caller.feature.update({
            name: faker.company.name(),
            id: createId(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the feature does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.feature.update.mockRejectedValue(
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
          const result = await caller.feature.update({
            name: faker.company.name(),
            id: createId(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the feature exists", () => {
        it("should update the feature", async () => {
          // Arrange
          const feature: Feature = {
            name: faker.company.name(),
            id: createId(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.feature.findUnique.mockResolvedValue(feature);

          const expectedUpdated: Feature = {
            id: feature.id,
            name: faker.company.name(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.feature.update.mockResolvedValue(expectedUpdated);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.feature.update(expectedUpdated);

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(expectedUpdated);
          expect(mockCtx.prisma.feature.update).toHaveBeenCalledWith({
            data: {
              name: expectedUpdated.name,
              description: expectedUpdated.description,
              image: expectedUpdated.image,
            },
            where: {
              id: feature.id,
            },
          });
        });
      });
    });
  });
});

describe("When deleting a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.feature.delete({
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
          caller.feature.delete({
            id: createId(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the feature does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.feature.delete.mockRejectedValue(
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
          const result = await caller.feature.delete({
            id: createId(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the feature exists", () => {
        it("should delete the feature", async () => {
          // Arrange
          const feature: Feature = {
            id: createId(),
            name: faker.company.name(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.feature.findUnique.mockResolvedValue(feature);

          const expectedDeleted: Feature = {
            id: createId(),
            name: faker.company.name(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.feature.delete.mockResolvedValue(expectedDeleted);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.feature.delete({
            id: feature.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(expectedDeleted);
          expect(mockCtx.prisma.feature.delete).toHaveBeenCalledWith({
            where: {
              id: feature.id,
            },
          });
        });
      });
    });
  });
});

describe("When retrieving games of a feature", () => {
  describe("and the feature does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      mockCtx.prisma.feature.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.feature.getGames({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the feature exists", () => {
    describe("and the feature has no games", () => {
      it("should return an empty array", async () => {
        // Arrange
        const feature: Feature & { games: Array<Game> } = {
          id: createId(),
          name: faker.company.name(),
          image: faker.image.url(),
          description: faker.lorem.words(),
          games: [],
        };

        mockCtx.prisma.feature.findUnique.mockResolvedValue(feature);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.feature.getGames({ id: feature.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap().length).toBe(0);
      });
    });

    describe("and the feature has games", () => {
      it("should return the games of the feature", async () => {
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

        const feature: Feature & { games: Array<Game> } = {
          id: createId(),
          name: faker.company.name(),
          image: faker.image.url(),
          description: faker.lorem.words(),
          games: games,
        };

        mockCtx.prisma.feature.findUnique.mockResolvedValue(feature);

        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: null,
        });

        // Act
        const result = await caller.feature.getGames({ id: feature.id });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap().length).toBe(games.length);
      });
    });
  });
});

describe("When adding games to a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Assert
      await expect(() =>
        caller.feature.addGames({
          featureId: createId(),
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
          caller.feature.addGames({
            featureId: createId(),
            gameIds: [createId()],
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the feature does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.feature.update.mockRejectedValue(
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
          const result = await caller.feature.addGames({
            featureId: createId(),
            gameIds: [createId()],
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the feature exists", () => {
        describe("and the games do not exist", () => {
          it("should return an error", async () => {
            // Arrange
            const nonExistentGameId = createId();

            mockCtx.prisma.feature.update.mockRejectedValue(
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
            const result = await caller.feature.addGames({
              featureId: createId(),
              gameIds: [nonExistentGameId],
            });

            // Assert
            expect(result.ok).toBe(false);
          });
        });

        describe("and the games exist", () => {
          it("should add the games to the feature", async () => {
            // Arrange
            const feature: Feature = {
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

            // REWRITE_3: use a const updatedFeature instead of updating feature directly
            // mockCtx.prisma.feature.update.mockResolvedValue({
            //   ...feature,
            //   games: games,
            // });
            const updatedFeature = {
              ...feature,
              games: games,
            };
            mockCtx.prisma.feature.update.mockResolvedValue(updatedFeature);

            const caller = appRouter.createCaller({
              prisma: mockCtx.prisma,
              session: mockAdminSession,
            });

            // Act
            const result = await caller.feature.addGames({
              featureId: feature.id,
              gameIds: games.map((game) => game.id),
            });

            // Assert
            expect(result.ok).toBe(true);
            expect(result.val).toMatchObject({
              ...feature,
              games: games,
            });
            expect(mockCtx.prisma.feature.update).toHaveBeenCalledWith({
              where: {
                id: feature.id,
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

describe("When removing games from a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act+Assert
      await expect(() =>
        caller.feature.removeGames({
          featureId: createId(),
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
          caller.feature.removeGames({
            featureId: createId(),
            gameIds: [createId()],
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the feature does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.feature.update.mockRejectedValue(
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
          const result = await caller.feature.removeGames({
            featureId: createId(),
            gameIds: [createId()],
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the feature exists", () => {
        describe("and the games do not exist", () => {
          it("should return an error", async () => {
            // Arrange
            const nonExistentGameId = createId();
            const mockFeatureId = createId();
            mockCtx.prisma.feature.update.mockRejectedValue(
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
            const result = await caller.feature.removeGames({
              featureId: mockFeatureId,
              gameIds: [nonExistentGameId],
            });

            // Assert
            expect(result.ok).toBe(false);
          });
        });

        describe("and the games exist", () => {
          it("should disconnect the games from the feature", async () => {
            // Arrange
            const feature: Feature = {
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

            const updatedFeature = {
              ...feature,
              games: [],
            };

            mockCtx.prisma.feature.update.mockResolvedValue(updatedFeature);

            const caller = appRouter.createCaller({
              prisma: mockCtx.prisma,
              session: mockAdminSession,
            });

            // Act
            const result = await caller.feature.removeGames({
              featureId: feature.id,
              gameIds: games.map((game) => game.id),
            });

            // Assert
            expect(result.ok).toBe(true);
            expect(result.val).toMatchObject(updatedFeature);
            expect(mockCtx.prisma.feature.update).toHaveBeenCalledWith({
              where: {
                id: feature.id,
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
