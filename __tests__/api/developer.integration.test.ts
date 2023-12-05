/* eslint-disable testing-library/no-await-sync-query */
// BEGIN_COPILOT_CODE
import type { Session } from "next-auth";
import type { User } from "next-auth";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { Game, type Developer } from "@prisma/client";
import { type z } from "zod";
import { type createDeveloperSchema } from "~/lib/validations/developer";

afterAll(async () => {
  const developers = prisma.developer.deleteMany();
  const franchises = prisma.franchise.deleteMany();
  const publishers = prisma.publisher.deleteMany();
  const games = prisma.game.deleteMany();
  await prisma.$transaction([developers, franchises, publishers, games]);
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

describe("When creating a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.developer.create({
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        image: faker.image.url(),
      });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.developer.create({
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });

    describe("and the user is an admin", () => {
      it("should create a developer", async () => {
        // Arrange
        const developer: z.infer<typeof createDeveloperSchema> = {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        };

        // Act
        const result = await adminCaller.developer.create(developer);

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject(developer);
      });
    });
  });
});

describe("When retrieving a developer by Id", () => {
  describe("and the developer does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await unauthenticatedCaller.developer.getById({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the developer exists", () => {
    it("should return a developer", async () => {
      // Arrange
      const data = await prisma.developer.create({
        data: {
          image: faker.image.url(),
          description: faker.company.catchPhrase(),
          name: faker.company.name(),
        },
      });

      // Act
      const result = await authenticatedCaller.developer.getById({
        id: data.id,
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(data);
    });
  });
});

describe("When retrieving all developers", () => {
  describe("and there are no developers", () => {
    it("should return an empty array", async () => {
      // Arrange
      await prisma.developer.deleteMany();

      // Act
      const result = await authenticatedCaller.developer.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
    });
  });

  describe("and there are developers", () => {
    it("should return an array of developers", async () => {
      // Arrange
      const developers = [
        {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        },
        {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        },
      ];

      await prisma.developer.createMany({
        data: developers,
      });

      // Act
      const result = await authenticatedCaller.developer.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toHaveLength(2);
    });
  });
});

describe("When updating a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.developer.update({
        id: createId(),
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        image: faker.image.url(),
      });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.developer.update({
          id: createId(),
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });

    describe("and the user is an admin", () => {
      // REVISION_1: add test for non-existent developer
      describe("and the developer does not exist", () => {
        it("should throw an error", async () => {
          // Arrange
          const nonExistentDeveloperId = createId();

          // Act
          const result = await adminCaller.developer.update({
            id: nonExistentDeveloperId,
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          });

          // Assert
          // REWRITE_3: use result.ok instead of throwErr
          //   await expect(result).rejects.toThrowError();
          expect(result.ok).toBe(false);
          expect(result.err).toBeTruthy();
        });
      });
      // END_REVISION_1

      describe("and the developer exists", () => {
        it("should update a developer", async () => {
          // Arrange
          const existingDeveloper: Developer = {
            id: createId(),
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          };

          await prisma.developer.create({ data: existingDeveloper });

          const updatedDeveloper = {
            ...existingDeveloper,
            name: faker.company.name(),
          };

          // Act
          const result = await adminCaller.developer.update(updatedDeveloper);

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(updatedDeveloper);
        });
      });
    });
  });
});

describe("When deleting a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.developer.delete({ id: createId() });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.developer.delete({
          id: createId(),
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the developer does not exist", () => {
        it("should return an error", async () => {
          // Act
          const result = await adminCaller.developer.delete({
            id: createId(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the developer exists", () => {
        it("should delete the developer", async () => {
          // Arrange
          const data = await prisma.developer.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              image: faker.image.url(),
            },
          });

          // Act
          const result = await adminCaller.developer.delete({
            id: data.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(data);
        });
      });
    });
  });
});

describe("When retrieving games of a developer", () => {
  describe("and the developer does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await authenticatedCaller.developer.getGames({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the developer exists", () => {
    describe("and the developer has no games", () => {
      it("should return an empty array", async () => {
        // Arrange
        const developer = await prisma.developer.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          },
        });

        // Act
        const result = await authenticatedCaller.developer.getGames({
          id: developer.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject([]);
      });
    });

    describe("and the developer has games", () => {
      it("should return an array of games", async () => {
        // Arrange
        // REWRITE_1: create franchise and publisher instead of just developer
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
        // REVISION_5: create games before connecting them with developer
        const game1: Game = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            // franchiseId: createId(),
            // publisherId: createId(),
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
          },
        });

        const game2: Game = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            // franchiseId: createId(),
            // publisherId: createId(),
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
          },
        });
        const games: Array<Game> = [game1, game2];
        // END_REVISION_5

        // REVISION_4: correctly connect games to franchises and publishers
        const developer = await prisma.developer.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
            games: {
              connect: games.map((game) => ({
                id: game.id,
              })),
            },
          },
          include: {
            games: true,
          },
        });
        // END_REVISION_4

        // Act
        // REWRITE_2: use unauthenticated caller
        // const result = await caller.developer.getGames({
        const result = await unauthenticatedCaller.developer.getGames({
          id: developer.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toHaveLength(2);
      });
    });
  });
});

describe("When adding games to a developer", () => {
  describe("and the developer does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const nonExistentDeveloperId = createId();
      const gameIds = [createId(), createId()];

      // Act
      const result = await adminCaller.developer.addGames({
        developerId: nonExistentDeveloperId,
        gameIds: gameIds,
      });

      // Assert
      expect(result.ok).toBe(false);
      expect(result.err).toBeTruthy();
    });
  });

  describe("and the developer exists", () => {
    // REVISION_2: add test for non-existent game
    describe("and a game does not exist", () => {
      it("should return an error", async () => {
        // Arrange
        const developer = await prisma.developer.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          },
        });

        const nonExistentGameId = createId();

        // Act
        const result = await adminCaller.developer.addGames({
          developerId: developer.id,
          gameIds: [nonExistentGameId],
        });

        // Assert
        expect(result.ok).toBe(false);
        expect(result.err).toBeTruthy();
      });
    });
    // END_REVISION_2

    describe("and the games exist", () => {
      it("should add the games to the developer", async () => {
        // Arrange
        // REVISION_3: create franchises and publishers
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
        // END_REVISION_3

        const developer = await prisma.developer.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          },
        });

        // REVISION_4: correctly connect games to franchises and publishers
        const game1 = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            // franchiseId: createId(),
            // publisherId: createId(),
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
          },
        });

        const game2 = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: new Date(),
            // franchiseId: createId(),
            // publisherId: createId(),
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
          },
        });
        // END_REVISION_4

        // Act
        const result = await adminCaller.developer.addGames({
          developerId: developer.id,
          gameIds: [game1.id, game2.id],
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.unwrap().games).toHaveLength(2);
      });
    });
  });
});

describe("When removing games from a developer", () => {
  describe("and the user is not authenticated", () => {
    it("should return an error", async () => {
      // Arrange
      const developerId = createId();
      const gameIds = [createId(), createId()];

      // Act
      const result = unauthenticatedCaller.developer.removeGames({
        developerId: developerId,
        gameIds: gameIds,
      });

      // REWRITE_5: use throwErr instead of result.ok
      await expect(result).rejects.toThrow();
      //   expect(result.ok).toBe(false);
      //   expect(result.err).toBeTruthy();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Arrange
        const developer = await prisma.developer.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          },
        });

        const gameIds = [createId(), createId()];
        //Act
        // REWRITE_4: use authenticatedCaller instead of nonAdminCaller
        //   const result = await nonAdminCaller.developer.removeGames({
        const result = authenticatedCaller.developer.removeGames({
          developerId: developer.id,
          gameIds: gameIds,
        });

        // Assert
        await expect(result).rejects.toThrowError();
      });
    });
    describe("and the user is an admin", () => {
      describe("and the developer does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          const nonExistentDeveloperId = createId();
          const gameIds = [createId(), createId()];

          // Act
          const result = await adminCaller.developer.removeGames({
            developerId: nonExistentDeveloperId,
            gameIds: gameIds,
          });

          // Assert
          expect(result.ok).toBe(false);
          expect(result.err).toBeTruthy();
        });
      });
      describe("and the developer exists", () => {
        describe("and the games do not exist", () => {
          it("shouldn't do anything", async () => {
            // Arrange
            const developer = await prisma.developer.create({
              data: {
                name: faker.company.name(),
                description: faker.company.catchPhrase(),
                image: faker.image.url(),
              },
            });

            const nonExistentGameIds = [createId(), createId()];

            // Act
            const result = await adminCaller.developer.removeGames({
              developerId: developer.id,
              gameIds: nonExistentGameIds,
            });

            // Assert
            // END_COPILOT_CODE

            // BEGIN_NON_COPILOT_CODE
            // The  prisma disconnect function is idempotent, so it should return ok
            expect(result.ok).toBe(true);
            expect(result.unwrap().games).toHaveLength(0);
            // END_NON_COPILOT_CODE

            // BEGIN_COPILOT_CODE
          });
        });
        describe("and the games exist", () => {
          describe("and the games do not belong to the developer", () => {
            it("shouldn't do anything", async () => {
              // Arrange
              const developer = await prisma.developer.create({
                data: {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                  image: faker.image.url(),
                },
              });
              // END_COPILOT_CODE

              // BEGIN_NON_COPILOT_CODE
              // copilot couldn't get this right, never created a franchise or publisher
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

              // REVISION_4: correctly connect games to franchises and publishers
              const game = await prisma.game.create({
                data: {
                  name: faker.lorem.words(),
                  backgroundImage: faker.image.url(),
                  coverImage: faker.image.url(),
                  description: faker.lorem.paragraph(),
                  releaseDate: faker.date.past(),
                  // publisherId: publisher.id,
                  // franchiseId: franchise.id,
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
                },
                include: {
                  developers: true,
                },
              });
              // END_REVISION_4

              // Act
              const result = await adminCaller.developer.removeGames({
                developerId: developer.id,
                gameIds: [game.id],
              });

              // Assert
              expect(result.ok).toBe(true);
              expect(game.developers).toHaveLength(0);
              // END_NON_COPILOT_CODE

              // BEGIN_COPILOT_CODE
            });
          });

          describe("and the games belong to the developer", () => {
            it("should remove the games successfully", async () => {
              // Arrange
              const developer = await prisma.developer.create({
                data: {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                  image: faker.image.url(),
                },
              });

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

              // REVISION_4: correctly connect games to franchises and publishers
              const game = await prisma.game.create({
                data: {
                  name: faker.lorem.words(),
                  // franchiseId: franchise.id,
                  // publisherId: publisher.id,
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
                  backgroundImage: faker.image.url(),
                  coverImage: faker.image.url(),
                  description: faker.lorem.words(),
                  releaseDate: faker.date.past(),
                  developers: {
                    connect: {
                      id: developer.id,
                    },
                  },
                },
              });

              // Act
              const result = await adminCaller.developer.removeGames({
                developerId: developer.id,
                gameIds: [game.id],
              });

              // Assert
              expect(result.ok).toBe(true);
              //   expect(result.data).toBeUndefined();
              // END_COPILOT_CODE

              // BEGIN_NON_COPILOT_CODE
              expect(result.unwrap().games).toHaveLength(0);
            });
          });
        });
      });
    });
  });
});

// END_NON_COPILOT_CODE
