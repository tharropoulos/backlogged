/* eslint-disable testing-library/no-await-sync-query */
import type { User } from "@prisma/client";
import type { Session } from "next-auth";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import type { z } from "zod";
import type {
  createFeatureSchema,
  featureSchema,
} from "~/lib/validations/feature";
import { createId } from "@paralleldrive/cuid2";
import type { gameSchema } from "~/lib/validations/game";

type CreateFeature = z.infer<typeof createFeatureSchema>;
type Feature = z.infer<typeof featureSchema>;
type Game = z.infer<typeof gameSchema>;
const initFeatures: CreateFeature[] = [
  {
    name: "feature1",
    description: "feature1",
  },
  {
    name: "feature2",
    description: "feature2",
  },
];

beforeAll(async () => {
  await prisma.feature.createMany({
    data: initFeatures,
  });
  console.log("✨ 2 features created");
  console.log("On: ", process.env.DATABASE_URL);
});

afterAll(async () => {
  const deleteFeatures = prisma.feature.deleteMany();

  await prisma.$transaction([deleteFeatures]);
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

//NOTE: Written by me, Copilot failed to generate it
describe("When creating a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.feature.create({
        name: "feature1",
        description: "feature1",
      });

      //Assert
      await expect(result).rejects.toThrowError("UNAUTHORIZED");
    });
  });

  describe("and the user is authenticated", () => {
    it("should create a feature", async () => {
      //Arrange
      const feature: CreateFeature = {
        //Copilot didn't use typecasting
        name: "feature1",
        description: "feature1",
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
      const result = await caller.feature.create(feature);

      const expectedCreated = await prisma.feature.findUnique({
        where: {
          id: result.id,
        },
      });

      //Assert
      expect(expectedCreated).toMatchObject(feature);
    });
  });
});

//NOTE: Written by Copilot, after being given just a snippet of the developer test file

describe("When retrieving a feature by Id", () => {
  describe("and the feature does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.feature.getById({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError("Feature not found");
    });
  });

  describe("and the feature exists", () => {
    it("should return the feature", async () => {
      //Arrange
      const feature: CreateFeature = {
        name: "feature1",
        description: "feature1",
      };

      const createdFeature = await prisma.feature.create({
        data: feature,
      });

      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = await caller.feature.getById({ id: createdFeature.id });

      //Assert
      expect(result).toMatchObject(createdFeature);
    });
  });
});

describe("When retrieving all features", () => {
  describe("and there are no features", () => {
    it("should return an empty array", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      await prisma.feature.deleteMany();

      //Act
      const result = await caller.feature.getAll();

      //Assert
      expect(result).toMatchObject([]);
    });
  });

  describe("and there are features", () => {
    it("should return an array of features", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      await prisma.feature.deleteMany();

      await prisma.feature.createMany({
        data: initFeatures,
      });

      //Act
      const result = await caller.feature.getAll();

      //Assert
      expect(result).toMatchObject(initFeatures);
    });
  });
});

describe("When updating a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.feature.update({
        id: createId(),
        name: "feature1",
        description: "feature1",
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the feature does not exist", () => {
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
      const result = caller.feature.update({
        id: createId(),
        name: "feature1",
        description: "feature1",
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the feature exists", () => {
    it("should update the feature", async () => {
      //Arrange
      const data = await prisma.feature.create({
        data: {
          description: "feature1",
          name: "feature1",
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
      const result = await caller.feature.update({
        id: data.id,
        name: "feature2",
        description: "feature2",
      });

      const expectedUpdated = await caller.feature.getById({ id: data.id });

      //Assert
      expect(expectedUpdated).toMatchObject(result);
    });
  });
});

describe("When deleting a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.feature.delete({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the feature does not exist", () => {
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
      const result = caller.feature.delete({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the feature exists", () => {
    describe("and the user is authenticated", () => {
      it("should delete the feature", async () => {
        //Arrange
        const data = await prisma.feature.create({
          data: {
            description: "feature1",
            name: "feature1",
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
        const result = await caller.feature.delete({ id: data.id });

        //Assert
        expect(result).toMatchObject(data);
      });
    });
  });
});

describe("When retrieving a feature's games", () => {
  describe("and the feature does not exist", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.feature.getGames({ id: createId() });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the feature exists", () => {
    describe("and the feature has no games", () => {
      it("should return an empty array", async () => {
        //Arrange
        const data = await prisma.feature.create({
          data: {
            description: "feature1",
            name: "feature1",
          },
        });

        const caller = appRouter.createCaller({
          session: null,
          prisma: prisma,
        });

        //Act
        const result = await caller.feature.getGames({ id: data.id });

        //Assert
        expect(result).toMatchObject({ games: [] });
      });
    });

    describe("and the feature has games", () => {
      it("should return an array of games", async () => {
        //Arrange
        const feature = await prisma.feature.create({
          data: {
            description: "feature1",
            name: "feature1",
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
            features: {
              connect: {
                id: feature.id,
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
        const result = await caller.feature.getGames({ id: feature.id });

        //Assert
        expect(result).toMatchObject({ games: [game] });
      });
    });
  });
});

describe("When adding games to a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.feature.addGames({
        id: createId(),
        gameIds: [],
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the feature does not exist", () => {
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
      const result = caller.feature.addGames({
        id: createId(),
        gameIds: [],
      });

      //Assert
      await expect(result).rejects.toThrowError("Feature not found");
    });
  });

  describe("and the feature exists", () => {
    describe("and the games do not exist", () => {
      it("should throw an error", async () => {
        //Arrange
        const feature = await prisma.feature.create({
          data: {
            name: "feature1",
            description: "description1",
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
        const result = caller.feature.addGames({
          id: feature.id,
          gameIds: [createId()],
        });

        //Assert
        await expect(result).rejects.toThrowError("Game not found");
      });
    });

    describe("and the games exist", () => {
      describe("and the games are already connected to the feature", () => {
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

          const feature = await prisma.feature.create({
            data: {
              name: "feature1",
              description: "description1",
              //   games: {
              //     connect: {
              //       id: createId(), //NOTE: Copilot wrote this line
              //     },
            },
          });

          const game = await prisma.game.create({
            data: {
              name: "game1",
              //   developers: { //Copilot error
              //     connect: {
              //       id: createId(),
              //     },
              //   },
              features: {
                connect: {
                  id: feature.id,
                },
              },
              backgroundImage: "game1",
              coverImage: "game1",
              description: "game1",
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
          const result = caller.feature.addGames({
            id: feature.id,
            gameIds: [game.id],
          });

          //Assert
          await expect(result).rejects.toThrowError(
            "Game already linked to Feature"
          );
        });
      });

      describe("and the games are not connected to the feature", () => {
        it("should add the games to the feature", async () => {
          //Arrange
          const feature = await prisma.feature.create({
            data: {
              name: "feature1",
              description: "description1",
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
          await caller.feature.addGames({
            id: feature.id,
            gameIds: games.map((g) => g.id),
          });

          const result = await caller.feature.getGames({ id: feature.id });
          const gamesResult = await prisma.game.findMany({
            where: {
              id: { in: games.map((g) => g.id) },
            },
            select: {
              features: {
                select: {
                  id: true,
                },
              },
            },
          });

          const expectedGames: { features: { id: string }[] }[] = [];
          games.forEach(() => {
            expectedGames.push({ features: [{ id: feature.id }] });
          });

          //Assert
          expect(result).toMatchObject({ games: games });
          expect(gamesResult).toMatchObject(expectedGames);
        });
      });
    });
  });
});

// describe("When removing games from a feature", () => {
//   describe("and the user is not authenticated", () => {
//     it("should throw an error", async () => {
//       //Arrange
//       const caller = appRouter.createCaller({
//         session: null,
//         prisma: prisma,
//       });

//       //Act
//       const result = caller.feature.removeGames({
//         id: createId(),
//         gameIds: [],
//       });

//       //Assert
//       await expect(result).rejects.toThrowError();
//     });
//   });

//   describe("and the feature does not exist", () => {
//     it("should throw an error", async () => {
//       //Arrange
//       const mockSession: Session = {
//         expires: new Date().toISOString(),
//         user: user,
//       };

//       const caller = appRouter.createCaller({
//         session: mockSession,
//         prisma: prisma,
//       });

//       //Act
//       const result = caller.feature.removeGames({
//         id: createId(),
//         gameIds: [createId()],
//       });

//       //Assert
//       await expect(result).rejects.toThrowError("Feature not found");
//     });
//   });

//   describe("and the feature exists", () => {
//     describe("and there are no games provided", () => {
//       it("should throw an error", async () => {
//         //Arrange
//         const feature = await prisma.feature.create({
//           data: {
//             name: "feature1",
//             description: "description1",
//           },
//         });

//         const mockSession: Session = {
//           expires: new Date().toISOString(),
//           user: user,
//         };

//         const caller = appRouter.createCaller({
//           session: mockSession,
//           prisma: prisma,
//         });

//         //Act
//         const result = caller.feature.removeGames({
//           id: feature.id,
//           gameIds: [],
//         });

//         //Assert
//         await expect(result).rejects.toThrowError("No games to remove");
//       });
//     });
//     describe("and the feature has no games", () => {
//       it("should throw an error", async () => {
//         //Arrange
//         const feature = await prisma.feature.create({
//           data: {
//             name: "feature6",
//             description: "description6",
//           },
//         });

//         const mockSession: Session = {
//           expires: new Date().toISOString(),
//           user: user,
//         };

//         const caller = appRouter.createCaller({
//           session: mockSession,
//           prisma: prisma,
//         });

//         //Act
//         const result = caller.feature.removeGames({
//           id: feature.id,
//           gameIds: [createId()],
//         });

//         //Assert
//         await expect(result).rejects.toThrowError();
//       });
//     });
//     describe("and the feature has games", () => {
//       describe("and the games the user provides do not exist", () => {
//         it("should throw an error", async () => {
//           //Arrange

//           const developer = await prisma.developer.create({
//             data: {
//               coverImage: "developer1",
//               description: "developer1",
//               name: "developer1",
//             },
//           });

//           const feature = await prisma.feature.create({
//             data: {
//               name: "feature1",
//               description: "description1",
//               games: {
//                 create: {
//                   name: "game1",
//                   backgroundImage: "game1",
//                   coverImage: "game1",
//                   description: "game1",
//                 },
//               },
//             },
//           });

//           const mockSession: Session = {
//             expires: new Date().toISOString(),
//             user: user,
//           };

//           const caller = appRouter.createCaller({
//             session: mockSession,
//             prisma: prisma,
//           });

//           //Act
//           const result = caller.feature.removeGames({
//             id: feature.id,
//             gameIds: [createId()],
//           });

//           //Assert
//           await expect(result).rejects.toThrowError();
//         });
//       });
//     });
//     describe("and the games the user provides exist", () => {
//       describe("and the games the user provides are not connected to the feature", () => {
//         it("should throw an error", async () => {
//           //Arrange

//           const developer = await prisma.developer.create({
//             data: {
//               coverImage: "developer1",
//               description: "developer1",
//               name: "developer1",
//             },
//           });

//           const feature = await prisma.feature.create({
//             data: {
//               name: "feature1",
//               description: "description1",
//               games: {
//                 create: {
//                   name: "game1",
//                   backgroundImage: "game1",
//                   coverImage: "game1",
//                   description: "game1",
//                   developerId: developer.id,
//                 },
//               },
//             },
//           });

//           const wrongGame = await prisma.game.create({
//             data: {
//               name: "game2",
//               backgroundImage: "game2",
//               coverImage: "game2",
//               description: "game2",
//               developerId: developer.id,
//             },
//           });

//           const mockSession: Session = {
//             expires: new Date().toISOString(),
//             user: user,
//           };

//           const caller = appRouter.createCaller({
//             session: mockSession,
//             prisma: prisma,
//           });

//           //Act
//           const result = caller.feature.removeGames({
//             id: feature.id,
//             gameIds: [wrongGame.id],
//           });

//           //Assert
//           await expect(result).rejects.toThrowError();
//         });
//       });
//     });
//     describe("and the games the user provides are connected to the feature", () => {
//       it("should remove the games from the feature", async () => {
//         //Arrange
//         const developer = await prisma.developer.create({
//           data: {
//             coverImage: "developer1",
//             description: "developer1",
//             name: "developer1",
//           },
//         });

//         const feature = await prisma.feature.create({
//           data: {
//             name: "feature1",
//             description: "description1",
//           },
//         });

//         const expectedUpdated: Feature = {
//           id: feature.id,
//           name: feature.name,
//           description: feature.description,
//           games: [],
//         };

//         const games: Game[] = [];
//         for (let i = 0; i <= 1; i++) {
//           const game = await prisma.game.create({
//             data: {
//               backgroundImage: `game${i + 1}`,
//               coverImage: `game${i + 1}`,
//               description: `game${i + 1}`,
//               developerId: developer.id,
//               name: `game${i + 1}`,
//               features: {
//                 connect: {
//                   id: feature.id,
//                 },
//               },
//             },
//           });
//           games.push(game);
//         }

//         const mockSession: Session = {
//           expires: new Date().toISOString(),
//           user: user,
//         };

//         const caller = appRouter.createCaller({
//           session: mockSession,
//           prisma: prisma,
//         });

//         //Act
//         await caller.feature.removeGames({
//           id: feature.id,
//           gameIds: games.map((g) => g.id),
//         });

//         const gamesResult = await prisma.game.findMany({
//           where: {
//             id: { in: games.map((g) => g.id) },
//           },
//           select: {
//             features: true,
//           },
//         });
//         const featureResult = await prisma.feature.findUnique({
//           where: {
//             id: feature.id,
//           },
//           include: {
//             games: true,
//           },
//         });

//         const expectedGames: { features: { id: string }[] }[] = [];
//         games.forEach(() => {
//           expectedGames.push({ features: [] });
//         });
//         //Assert
//         expect(featureResult).toMatchObject(expectedUpdated);
//         expect(gamesResult).toMatchObject(expectedGames);
//       });
//     });
//   });
// });

describe("When removing games from a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      //Act
      const result = caller.feature.removeGames({
        id: createId(),
        gameIds: [],
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the feature does not exist", () => {
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
      const result = caller.feature.removeGames({
        id: createId(),
        gameIds: [createId()],
      });

      //Assert
      await expect(result).rejects.toThrowError("Feature not found");
    });
  });

  describe("and the feature exists", () => {
    describe("and there are no games provided", () => {
      it("should throw an error", async () => {
        //Arrange
        const feature = await prisma.feature.create({
          data: {
            description: "feature1",
            name: "feature1",
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
        const result = caller.feature.removeGames({
          id: feature.id,
          gameIds: [],
        });

        //Assert
        await expect(result).rejects.toThrowError("No games to remove");
      });
    });
    describe("and the feature has no games", () => {
      it("should throw an error", async () => {
        //Arrange
        const feature = await prisma.feature.create({
          data: {
            description: "feature6",
            name: "feature6",
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
        const result = caller.feature.removeGames({
          id: feature.id,
          gameIds: [createId()],
        });

        //Assert
        await expect(result).rejects.toThrowError();
      });
    });
    describe("and the feature has games", () => {
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

          const feature = await prisma.feature.create({
            data: {
              description: "feature1",
              name: "feature1",
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
          const result = caller.feature.removeGames({
            id: feature.id,
            gameIds: [createId()],
          });

          //Assert
          await expect(result).rejects.toThrowError();
        });
      });
    });
    describe("and the games the user provides exist", () => {
      describe("and the games the user provides are not connected to the feature", () => {
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

          const feature = await prisma.feature.create({
            data: {
              description: "feature1",
              name: "feature1",
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
          const result = caller.feature.removeGames({
            id: feature.id,
            gameIds: [wrongGame.id],
          });

          //Assert
          await expect(result).rejects.toThrowError();
        });
      });
    });
    describe("and the games the user provides are connected to the feature", () => {
      it("should remove the games from the feature", async () => {
        //Arrange
        const feature = await prisma.feature.create({
          data: {
            description: "feature1",
            name: "feature1",
          },
        });

        const expectedUpdated: Feature = {
          id: feature.id,
          description: feature.description,
          name: feature.name,
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
              features: {
                connect: {
                  id: feature.id,
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
        await caller.feature.removeGames({
          id: feature.id,
          gameIds: games.map((g) => g.id),
        });

        const gamesResult = await prisma.game.findMany({
          where: {
            id: { in: games.map((g) => g.id) },
          },
          select: {
            features: true,
          },
        });
        const featureResult = await prisma.feature.findUnique({
          where: {
            id: feature.id,
          },
          include: {
            games: true,
          },
        });

        const expectedGames: { features: { id: string }[] }[] = [];
        games.forEach(() => {
          expectedGames.push({ features: [] });
        });
        //Assert
        expect(featureResult).toMatchObject(expectedUpdated);
        expect(gamesResult).toMatchObject(expectedGames);
      });
    });
  });
});
