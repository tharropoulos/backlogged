/* eslint-disable testing-library/no-await-sync-query */
// BEGIN_COPILOT_CODE
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import type { Session } from "next-auth";
import type { User } from "next-auth";
import type { Feature } from "@prisma/client";
import type { z } from "zod";
import type { createFeatureSchema } from "~/lib/validations/feature";

afterAll(async () => {
  const features = prisma.feature.deleteMany();
  const franchises = prisma.franchise.deleteMany();
  const publishers = prisma.publisher.deleteMany();
  const games = prisma.game.deleteMany();
  await prisma.$transaction([features, franchises, publishers, games]);
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

describe("When creating a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.feature.create({
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        image: faker.image.url(),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.feature.create({
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        });

        // Assert
        await expect(result).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      it("should create a feature", async () => {
        // Arrange
        const feature: z.infer<typeof createFeatureSchema> = {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        };

        // Act
        const result = await adminCaller.feature.create(feature);

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject(feature);
      });
    });
  });
});

describe("When retrieving a feature by Id", () => {
  describe("and the feature does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await unauthenticatedCaller.feature.getById({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the feature exists", () => {
    it("should return a feature", async () => {
      // Arrange
      const data = await prisma.feature.create({
        data: {
          image: faker.image.url(),
          description: faker.company.catchPhrase(),
          name: faker.company.name(),
        },
      });

      // Act
      const result = await authenticatedCaller.feature.getById({
        id: data.id,
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(data);
    });
  });
});

describe("When retrieving all features", () => {
  describe("and there are no features", () => {
    it("should return an empty array", async () => {
      // Arrange
      await prisma.feature.deleteMany();

      // Act
      const result = await authenticatedCaller.feature.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
    });
  });

  describe("and there are features", () => {
    it("should return an array of features", async () => {
      // Arrange
      const features = [
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

      await prisma.feature.createMany({
        data: features,
      });

      // Act
      const result = await authenticatedCaller.feature.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toHaveLength(2);
    });
  });
});

describe("When updating a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.feature.update({
        id: createId(),
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        image: faker.image.url(),
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.feature.update({
          id: createId(),
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        });

        // Assert
        await expect(result).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the feature does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          const nonExistentFeatureId = createId();

          // Act
          const result = await adminCaller.feature.update({
            id: nonExistentFeatureId,
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          });

          // Assert
          expect(result.ok).toBe(false);
          expect(result.err).toBeTruthy();
        });
      });

      describe("and the feature exists", () => {
        it("should update a feature", async () => {
          // Arrange
          const existingFeature: Feature = {
            id: createId(),
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          };

          await prisma.feature.create({ data: existingFeature });

          const updatedFeature = {
            ...existingFeature,
            name: faker.company.name(),
          };

          // Act
          const result = await adminCaller.feature.update(updatedFeature);

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(updatedFeature);
        });
      });
    });
  });
});

describe("When deleting a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.feature.delete({ id: createId() });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.feature.delete({
          id: createId(),
        });

        // Assert
        await expect(result).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the feature does not exist", () => {
        it("should return an error", async () => {
          // Act
          const result = await adminCaller.feature.delete({
            id: createId(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the feature exists", () => {
        it("should delete the feature", async () => {
          // Arrange
          const data = await prisma.feature.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              image: faker.image.url(),
            },
          });

          // Act
          const result = await adminCaller.feature.delete({
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

describe("When retrieving games of a feature", () => {
  describe("and the feature does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await unauthenticatedCaller.feature.getGames({
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
        const feature = await prisma.feature.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          },
        });

        // Act
        const result = await authenticatedCaller.feature.getGames({
          id: feature.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toMatchObject([]);
      });
    });

    describe("and the feature has games", () => {
      it("should return an array of games", async () => {
        // REVISION_1: create games on the feature transaction.

        // Arrange
        // const feature = await prisma.feature.create({
        //   data: {
        //     name: faker.company.name(),
        //     description: faker.company.catchPhrase(),
        //     image: faker.image.url(),
        //   },
        // });

        // const games = [
        //   {
        //     name: faker.company.name(),
        //     description: faker.company.catchPhrase(),
        //     image: faker.image.url(),
        //     featureId: feature.id,
        //   },
        //   {
        //     name: faker.company.name(),
        //     description: faker.company.catchPhrase(),
        //     image: faker.image.url(),
        //     featureId: feature.id,
        //   },
        // ];

        // await prisma.game.createMany({
        //   data: games,
        // });

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

        // REVISION_3: connect games to franchises and publishers correctly.
        const game1 = await prisma.game.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            coverImage: faker.image.url(),
            backgroundImage: faker.image.url(),
            releaseDate: faker.date.past(),
            publisher: {
              connect: {
                id: publisher.id,
              },
            },
            franchise: {
              connect: {
                id: franchise.id,
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
            releaseDate: faker.date.past(),
            publisher: {
              connect: {
                id: publisher.id,
              },
            },
            franchise: {
              connect: {
                id: franchise.id,
              },
            },
          },
        });

        const feature = await prisma.feature.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
            games: {
              connect: [
                {
                  id: game1.id,
                },
                {
                  id: game2.id,
                },
              ],
            },
          },
          include: {
            games: true,
          },
        });

        // END_REVISION_3

        // Act
        const result = await authenticatedCaller.feature.getGames({
          id: feature.id,
        });

        // Assert
        expect(result.ok).toBe(true);
        expect(result.val).toHaveLength(2);
      });
    });
  });
});

describe("When adding games to a feature", () => {
  describe("and the feature does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      const nonExistentFeatureId = createId();
      const gameIds = [createId(), createId()];

      // Act
      const result = await adminCaller.feature.addGames({
        featureId: nonExistentFeatureId,
        gameIds: gameIds,
      });

      // Assert
      expect(result.ok).toBe(false);
      expect(result.err).toBeTruthy();
    });
  });

  describe("and the feature exists", () => {
    describe("When adding games to a feature", () => {
      describe("and the user is not authenticated", () => {
        // REVISION_2: add tests for authenticated users
        it("should return an error", async () => {
          // Arrange
          const nonExistentFeatureId = createId();
          const gameIds = [createId(), createId()];

          // Act
          const result = unauthenticatedCaller.feature.addGames({
            featureId: nonExistentFeatureId,
            gameIds: gameIds,
          });

          // Assert
          await expect(result).rejects.toThrow();
        });
      });

      describe("and the user is authenticated", () => {
        describe("and the user is not an admin", () => {
          it("should return an error", async () => {
            // Arrange
            const nonExistentFeatureId = createId();
            const gameIds = [createId(), createId()];

            // Act
            const result = authenticatedCaller.feature.addGames({
              featureId: nonExistentFeatureId,
              gameIds: gameIds,
            });

            // Assert
            await expect(result).rejects.toThrow();
          });
        });
        describe("and the user is an admin", () => {
          // END_REVISION_2
          describe("and a game does not exist", () => {
            it("should return an error", async () => {
              // Arrange
              const feature = await prisma.feature.create({
                data: {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                  image: faker.image.url(),
                },
              });

              const nonExistentGameId = createId();

              // Act
              const result = await adminCaller.feature.addGames({
                featureId: feature.id,
                gameIds: [nonExistentGameId],
              });

              // Assert
              expect(result.ok).toBe(false);
              expect(result.err).toBeTruthy();
            });
          });

          describe("and the games exist", () => {
            it("should add the games to the feature", async () => {
              // Arrange
              // REVISION_4: create franchises and publishers before creating games
              const publisher = await prisma.publisher.create({
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
              // END_REVISION_4

              const feature = await prisma.feature.create({
                data: {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                  image: faker.image.url(),
                },
              });

              // REVISION_3: connect games to franchises and publishers correctly.
              const game1 = await prisma.game.create({
                data: {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                  coverImage: faker.image.url(),
                  backgroundImage: faker.image.url(),
                  releaseDate: new Date(),
                  publisher: {
                    connect: {
                      id: publisher.id,
                    },
                  },
                  franchise: {
                    connect: {
                      id: franchise.id,
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
                  publisher: {
                    connect: {
                      id: publisher.id,
                    },
                  },
                  franchise: {
                    connect: {
                      id: franchise.id,
                    },
                  },
                },
              });

              // END_REVISION_3

              // Act
              const result = await adminCaller.feature.addGames({
                featureId: feature.id,
                gameIds: [game1.id, game2.id],
              });

              // Assert
              expect(result.ok).toBe(true);
              expect(result.unwrap().games).toHaveLength(2);
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
      // END_COPILOT_CODE
      // BEGIN_NON_COPILOT_CODE
      // failed to make the correct tests
      // Arrange
      const nonExistentFeatureId = createId();
      const gameIds = [createId(), createId()];

      // Act
      const result = unauthenticatedCaller.feature.removeGames({
        featureId: nonExistentFeatureId,
        gameIds: gameIds,
      });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });

  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should return an error", async () => {
        // Arrange
        const nonExistentFeatureId = createId();
        const gameIds = [createId(), createId()];

        // Act
        // REWRITE_5: use authenticatedCaller instead of nonAdminCaller
        // const result = await nonAdminCaller.feature.removeGames({
        const result = authenticatedCaller.feature.removeGames({
          featureId: nonExistentFeatureId,
          gameIds: gameIds,
        });

        // Assert
        await expect(result).rejects.toThrow();
        // END_NON_COPILOT_CODE
        // BEGIN_COPILOT_CODE
      });
    });

    describe("and the user is an admin", () => {
      describe("and the feature does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          const nonExistentFeatureId = createId();
          const gameIds = [createId(), createId()];

          // Act
          const result = await adminCaller.feature.removeGames({
            featureId: nonExistentFeatureId,
            gameIds: gameIds,
          });

          // Assert
          expect(result.ok).toBe(false);
          expect(result.err).toBeTruthy();
        });
      });

      describe("and the feature exists", () => {
        describe("and the games do not exist", () => {
          it("shouldn't do anything", async () => {
            // Arrange
            const feature = await prisma.feature.create({
              data: {
                name: faker.company.name(),
                description: faker.company.catchPhrase(),
                image: faker.image.url(),
              },
            });

            const nonExistentGameIds = [createId(), createId()];

            // Act
            const result = await adminCaller.feature.removeGames({
              featureId: feature.id,
              gameIds: nonExistentGameIds,
            });

            // Assert
            expect(result.ok).toBe(true);
          });
        });

        describe("and the games exist", () => {
          describe("and the games do not belong to the feature", () => {
            it("shouldn't do anything", async () => {
              // Arrange
              // REVISION_4: create franchises and publishers before creating games
              const publisher = await prisma.publisher.create({
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

              // END_REVISION_4
              const feature = await prisma.feature.create({
                data: {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                  image: faker.image.url(),
                },
              });

              // REVISON_3: connect games to franchises and publishers correctly.
              const game = await prisma.game.create({
                data: {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                  coverImage: faker.image.url(),
                  backgroundImage: faker.image.url(),
                  releaseDate: faker.date.past(),
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
              // END_REVISION_3

              // Act
              const result = await adminCaller.feature.removeGames({
                featureId: feature.id,
                gameIds: [game.id],
              });

              // Assert
              expect(result.ok).toBe(true);
            });
          });

          describe("and the games belong to the feature", () => {
            it("should remove the games successfully", async () => {
              // Arrange
              // REVISION_4: create franchises and publishers before creating games
              const publisher = await prisma.publisher.create({
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

              // END_REVISION_4
              const feature = await prisma.feature.create({
                data: {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                  image: faker.image.url(),
                },
              });

              // REVISION_3: connect games to franchises and publishers correctly.
              const game = await prisma.game.create({
                data: {
                  name: faker.company.name(),
                  description: faker.company.catchPhrase(),
                  coverImage: faker.image.url(),
                  backgroundImage: faker.image.url(),
                  releaseDate: faker.date.past(),
                  publisher: {
                    connect: {
                      id: publisher.id,
                    },
                  },
                  franchise: {
                    connect: {
                      id: franchise.id,
                    },
                  },
                  features: {
                    connect: {
                      id: feature.id,
                    },
                  },
                },
              });

              // END_REVISION_3

              // Act
              const result = await adminCaller.feature.removeGames({
                featureId: feature.id,
                gameIds: [game.id],
              });

              // Assert
              expect(result.ok).toBe(true);
            });
          });
        });
      });
    });
  });
});

// END_COPILOT_CODE
