/* eslint-disable testing-library/no-await-sync-query */
import type { inferRouterOutputs } from "@trpc/server";
import type { User } from "@prisma/client";
import type { Session } from "next-auth";
import { type AppRouter, appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import type { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import type { createGameSchema, gameSchema } from "~/lib/validations/game";
import type { developerSchema } from "~/lib/validations/developer";
import type { featureSchema } from "~/lib/validations/feature";
import type { genreSchema } from "~/lib/validations/genre";
import type { platformSchema } from "~/lib/validations/platform";
import type { reviewSchema } from "~/lib/validations/review";

type RouterOutput = inferRouterOutputs<AppRouter>;

type GameDetailsOutput = RouterOutput["game"]["getDetails"];

type Platform = z.infer<typeof platformSchema>;
type Game = z.infer<typeof gameSchema>;
type CreateGame = z.infer<typeof createGameSchema>;
type Developer = z.infer<typeof developerSchema>;
type Feature = z.infer<typeof featureSchema>;
type Genre = z.infer<typeof genreSchema>;
type Review = z.infer<typeof reviewSchema>;

beforeAll(async () => {
  const publisher = await prisma.publisher.create({
    data: {
      coverImage: "https://via.placeholder.com/150",
      description: "A publisher",
      name: "A publisher",
    },
  });

  const franchise = await prisma.franchise.create({
    data: {
      name: "A franchise",
      description: "A franchise",
      backgroundImage: "https://via.placeholder.com/150",
    },
  });

  await prisma.game.createMany({
    data: [
      {
        name: "A game",
        description: "A game",
        releaseDate: new Date(),
        coverImage: "https://via.placeholder.com/150",
        backgroundImage: "https://via.placeholder.com/150",
        publisherId: publisher.id,
        franchiseId: franchise.id,
      },
      {
        name: "A game 2",
        description: "A game 2",
        releaseDate: new Date(),
        coverImage: "https://via.placeholder.com/150",
        backgroundImage: "https://via.placeholder.com/150",
        publisherId: publisher.id,
        franchiseId: franchise.id,
      },
    ],
  });

  console.log("✨ 2 games created");
  console.log("On: ", process.env.DATABASE_URL);
});

afterAll(async () => {
  const deleteGames = prisma.game.deleteMany();
  const deletePublishers = prisma.publisher.deleteMany();
  const deleteFranchises = prisma.franchise.deleteMany();
  const deletePlatforms = prisma.platform.deleteMany();
  const deleteGenres = prisma.genre.deleteMany();
  const deleteDevelopers = prisma.developer.deleteMany();
  const deleteFeatures = prisma.feature.deleteMany();
  const deleteReviews = prisma.review.deleteMany();
  const deleteFollows = prisma.follows.deleteMany();
  const deleteUsers = prisma.user.deleteMany();

  await prisma.$transaction([
    deleteGames,
    deletePublishers,
    deleteFranchises,
    deletePlatforms,
    deleteGenres,
    deleteDevelopers,
    deleteFeatures,
    deleteReviews,
    deleteFollows,
    deleteUsers,
  ]);
  console.log("Everything deleted on: ", process.env.DATABASE_URL);
  await prisma.$disconnect();
});

const mockUser: User = {
  id: createId(),
  name: "Test User",
  email: "email",
  image: "image",
  emailVerified: null,
};

const unauthorizedCaller = appRouter.createCaller({
  session: null,
  prisma: prisma,
});

const mockSession: Session = {
  expires: new Date().toISOString(),
  user: mockUser,
};
const authorizedCaller = appRouter.createCaller({
  session: mockSession,
  prisma: prisma,
});

describe("When creating a Game", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Act
      const result = unauthorizedCaller.game.create({
        backgroundImage: "https://via.placeholder.com/150",
        coverImage: "https://via.placeholder.com/150",
        description: "A game",
        franchiseId: createId(),
        name: "A game",
        publisherId: createId(),
        releaseDate: new Date(),
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the franchise doesn't exist", () => {
      it("should throw an error", async () => {
        //Arrange
        const publisher = await prisma.publisher.create({
          data: {
            coverImage: "https://via.placeholder.com/150",
            description: "A publisher",
            name: "A publisher",
          },
        });

        //Act
        const result = authorizedCaller.game.create({
          backgroundImage: "https://via.placeholder.com/150",
          coverImage: "https://via.placeholder.com/150",
          description: "A game",
          franchiseId: createId(),
          name: "A game",
          publisherId: publisher.id,
          releaseDate: new Date(),
        });

        //Assert
        await expect(result).rejects.toThrowError();
      });
    });
    describe("and the publisher doesn't exist", () => {
      it("should throw an error", async () => {
        //Arrange
        const franchise = await prisma.franchise.create({
          data: {
            name: "A franchise",
            description: "A franchise",
            backgroundImage: "https://via.placeholder.com/150",
          },
        });

        //Act
        const result = authorizedCaller.game.create({
          backgroundImage: "https://via.placeholder.com/150",
          coverImage: "https://via.placeholder.com/150",
          description: "A game",
          franchiseId: franchise.id,
          name: "A game",
          publisherId: createId(),
          releaseDate: new Date(),
        });

        //Assert
        await expect(result).rejects.toThrowError();
      });
    });
    describe("and the input is valid", () => {
      it("should create the game", async () => {
        //Arrange
        const publisher = await prisma.publisher.create({
          data: {
            coverImage: "https://via.placeholder.com/150",
            description: "A publisher",
            name: "A publisher",
          },
        });

        const franchise = await prisma.franchise.create({
          data: {
            name: "A franchise",
            description: "A franchise",
            backgroundImage: "https://via.placeholder.com/150",
          },
        });

        const game: CreateGame = {
          backgroundImage: "https://via.placeholder.com/150",
          coverImage: "https://via.placeholder.com/150",
          description: "A game",
          franchiseId: franchise.id,
          name: "A game",
          publisherId: publisher.id,
          releaseDate: new Date(),
        };
        //Act
        const result = await authorizedCaller.game.create(game);

        //Assert
        expect(result).toMatchObject(game);
      });
    });
  });
});

describe("When retrieving a Game by Id", () => {
  describe("and the game doesn't exist", () => {
    it("should throw an error", async () => {
      //Act
      const result = authorizedCaller.game.getById({
        id: createId(),
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });
  describe("and the game exists", () => {
    it("should return the game", async () => {
      //Arrange
      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
      });

      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
      });

      const game = await prisma.game.create({
        data: {
          name: "A game",
          description: "A game",
          releaseDate: new Date(),
          coverImage: "https://via.placeholder.com/150",
          backgroundImage: "https://via.placeholder.com/150",
          publisherId: publisher.id,
          franchiseId: franchise.id,
        },
      });

      //Act
      const result = await authorizedCaller.game.getById({
        id: game.id,
      });

      //Assert
      expect(result).toMatchObject(game);
    });
  });
});

describe("When retrieving all games", () => {
  describe("and there are no games", () => {
    it("should return an empty array", async () => {
      //Act
      await prisma.game.deleteMany();
      const result = await authorizedCaller.game.getAll();

      //Assert
      expect(result).toMatchObject([]);
    });
  });
  describe("and there are games", () => {
    it("should return an array of games", async () => {
      //Arrange

      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
      });

      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
      });

      const game = await prisma.game.create({
        data: {
          name: "A game",
          description: "A game",
          releaseDate: new Date(),
          coverImage: "https://via.placeholder.com/150",
          backgroundImage: "https://via.placeholder.com/150",
          publisherId: publisher.id,
          franchiseId: franchise.id,
        },
      });

      //Act
      const result = await authorizedCaller.game.getAll();

      //Assert
      expect(result).toMatchObject([game]);
    });
  });
});

describe("When updating a game", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Act
      const result = unauthorizedCaller.game.update({
        id: createId(),
        backgroundImage: "https://via.placeholder.com/150",
        coverImage: "https://via.placeholder.com/150",
        description: "A game",
        franchiseId: createId(),
        name: "A game",
        publisherId: createId(),
        releaseDate: new Date(),
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the game doesn't exist", () => {
      it("should throw an error", async () => {
        //Act
        const result = authorizedCaller.game.update({
          id: createId(),
          backgroundImage: "https://via.placeholder.com/150",
          coverImage: "https://via.placeholder.com/150",
          description: "A game",
          franchiseId: createId(),
          name: "A game",
          publisherId: createId(),
          releaseDate: new Date(),
        });

        //Assert
        await expect(result).rejects.toThrowError();
      });
    });
    describe("and the game exists", () => {
      it("should update the game", async () => {
        //Arrange
        const publisher = await prisma.publisher.create({
          data: {
            coverImage: "https://via.placeholder.com/150",
            description: "A publisher",
            name: "A publisher",
          },
        });

        const franchise = await prisma.franchise.create({
          data: {
            name: "A franchise",
            description: "A franchise",
            backgroundImage: "https://via.placeholder.com/150",
          },
        });

        const game = await prisma.game.create({
          data: {
            name: "A game",
            description: "A game",
            releaseDate: new Date(),
            coverImage: "https://via.placeholder.com/150",
            backgroundImage: "https://via.placeholder.com/150",
            publisherId: publisher.id,
            franchiseId: franchise.id,
          },
        });

        const updatedGame: Game = {
          id: game.id,
          backgroundImage: "https://via.placeholder.com/150",
          coverImage: "https://via.placeholder.com/150",
          description: "A game22",
          franchiseId: franchise.id,
          name: "A game",
          publisherId: publisher.id,
          releaseDate: new Date(),
        };

        //Act
        const result = await authorizedCaller.game.update(updatedGame);

        //Assert
        expect(result).toMatchObject(updatedGame);
      });
    });
  });
});

describe("when deleting a game", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      //Act
      const result = unauthorizedCaller.game.delete({
        id: createId(),
      });

      //Assert
      await expect(result).rejects.toThrowError();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the game doesn't exist", () => {
      it("should throw an error", async () => {
        //Act
        const result = authorizedCaller.game.delete({
          id: createId(),
        });

        //Assert
        await expect(result).rejects.toThrowError();
      });
    });
    describe("and the game exists", () => {
      it("should delete the game", async () => {
        //Arrange
        const publisher = await prisma.publisher.create({
          data: {
            coverImage: "https://via.placeholder.com/150",
            description: "A publisher",
            name: "A publisher",
          },
        });

        const franchise = await prisma.franchise.create({
          data: {
            name: "A franchise",
            description: "A franchise",
            backgroundImage: "https://via.placeholder.com/150",
          },
        });

        const game = await prisma.game.create({
          data: {
            name: "A game",
            description: "A game",
            releaseDate: new Date(),
            coverImage: "https://via.placeholder.com/150",
            backgroundImage: "https://via.placeholder.com/150",
            publisherId: publisher.id,
            franchiseId: franchise.id,
          },
        });

        //Act
        const result = await authorizedCaller.game.delete({
          id: game.id,
        });

        const publisherResponse = await prisma.publisher.findUnique({
          where: {
            id: publisher.id,
          },
          select: {
            games: true,
          },
        });

        const franchiseResponse = await prisma.franchise.findUnique({
          where: {
            id: franchise.id,
          },
          select: {
            games: true,
          },
        });

        const expectedResponse = { games: [] };

        //Assert
        expect(result).toMatchObject(game);
        expect(publisherResponse).toMatchObject(expectedResponse);
        expect(franchiseResponse).toMatchObject(expectedResponse);
      });
    });
  });
});

describe("When retrieving a Game's Developers", () => {
  describe("and the game doesn't exist", () => {
    it("should throw an error", async () => {
      //Act
      const result = authorizedCaller.game.getDevelopers({
        id: createId(),
      });

      //Assert
      await expect(result).rejects.toThrowError("Game not found");
    });
  });
  describe("and the game has no developers", () => {
    it("should return an empty array", async () => {
      //Arrange
      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
      });

      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
      });

      const game = await prisma.game.create({
        data: {
          name: "A game",
          description: "A game",
          releaseDate: new Date(),
          coverImage: "https://via.placeholder.com/150",
          backgroundImage: "https://via.placeholder.com/150",
          publisherId: publisher.id,
          franchiseId: franchise.id,
        },
      });

      //Act
      const result = await authorizedCaller.game.getDevelopers({
        id: game.id,
      });

      //Assert
      expect(result).toMatchObject({ developers: [] });
    });
  });
  describe("and the game has developers", () => {
    it("should return an array of developers", async () => {
      //Arrange
      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
      });

      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
      });

      const developers: Developer[] = [];

      for (let i = 0; i < 2; i++) {
        const developer = await prisma.developer.create({
          data: {
            name: `A developer ${i}`,
            description: `A developer ${i}`,
            coverImage: "https://via.placeholder.com/150",
          },
        });
        developers.push(developer);
      }

      const game = await prisma.game.create({
        data: {
          name: "A game",
          description: "A game",
          releaseDate: new Date(),
          coverImage: "https://via.placeholder.com/150",
          backgroundImage: "https://via.placeholder.com/150",
          publisherId: publisher.id,
          franchiseId: franchise.id,
          developers: {
            connect: developers.map((developer) => ({
              id: developer.id,
            })),
          },
        },
      });

      //Act
      const result = await authorizedCaller.game.getDevelopers({
        id: game.id,
      });

      //Ensure response type
      const expectedDevelopers: { developers: Developer[] } = {
        developers: developers,
      };

      //Assert
      expect(result).toMatchObject(expectedDevelopers);
    });
  });
});

describe("When retrieving a Game's Features", () => {
  describe("and the game doesn't exist", () => {
    it("should throw an error", async () => {
      //Act
      const result = authorizedCaller.game.getFeatures({
        id: createId(),
      });

      //Assert
      await expect(result).rejects.toThrowError("Game not found");
    });
  });
  describe("and the game has no features", () => {
    it("should return an empty array", async () => {
      //Arrange
      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
      });

      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
      });

      const game = await prisma.game.create({
        data: {
          name: "A game",
          description: "A game",
          releaseDate: new Date(),
          coverImage: "https://via.placeholder.com/150",
          backgroundImage: "https://via.placeholder.com/150",
          publisherId: publisher.id,
          franchiseId: franchise.id,
        },
      });

      //Act
      const result = await authorizedCaller.game.getFeatures({
        id: game.id,
      });

      //Assert
      expect(result).toMatchObject({ features: [] });
    });
  });
  describe("and the game has features", () => {
    it("should return an array of features", async () => {
      //Arrange
      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
      });

      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
      });

      const features: Feature[] = [];

      for (let i = 0; i < 2; i++) {
        const feature = await prisma.feature.create({
          data: {
            name: `A feature ${i}`,
            description: `A feature ${i}`,
          },
        });
        features.push(feature);
      }

      const game = await prisma.game.create({
        data: {
          name: "A game",
          description: "A game",
          releaseDate: new Date(),
          coverImage: "https://via.placeholder.com/150",
          backgroundImage: "https://via.placeholder.com/150",
          publisherId: publisher.id,
          franchiseId: franchise.id,
          features: {
            connect: features.map((feature) => ({
              id: feature.id,
            })),
          },
        },
      });

      //Act
      const result = await authorizedCaller.game.getFeatures({
        id: game.id,
      });

      //Ensure response type
      const expectedFeatures: { features: Feature[] } = {
        features: features,
      };

      //Assert
      expect(result).toMatchObject(expectedFeatures);
    });
  });
});

describe("When retrieving a Game's Genres", () => {
  describe("and the game doesn't exist", () => {
    it("should throw an error", async () => {
      //Act
      const result = authorizedCaller.game.getGenres({
        id: createId(),
      });

      //Assert
      await expect(result).rejects.toThrowError("Game not found");
    });
  });
  describe("and the game has no genres", () => {
    it("should return an empty array", async () => {
      //Arrange
      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
      });

      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
      });

      const game = await prisma.game.create({
        data: {
          name: "A game",
          description: "A game",
          releaseDate: new Date(),
          coverImage: "https://via.placeholder.com/150",
          backgroundImage: "https://via.placeholder.com/150",
          publisherId: publisher.id,
          franchiseId: franchise.id,
        },
      });

      //Act
      const result = await authorizedCaller.game.getGenres({
        id: game.id,
      });

      //Assert
      expect(result).toMatchObject({ genres: [] });
    });
  });
  describe("and the game has genres", () => {
    it("should return an array of genres", async () => {
      //Arrange
      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
      });

      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
      });

      const genres: Genre[] = [];

      for (let i = 0; i < 2; i++) {
        const genre = await prisma.genre.create({
          data: {
            name: `A genre ${i}`,
            description: `A genre ${i}`,
          },
        });
        genres.push(genre);
      }

      const game = await prisma.game.create({
        data: {
          name: "A game",
          description: "A game",
          releaseDate: new Date(),
          coverImage: "https://via.placeholder.com/150",
          backgroundImage: "https://via.placeholder.com/150",
          publisherId: publisher.id,
          franchiseId: franchise.id,
          genres: {
            connect: genres.map((genre) => ({
              id: genre.id,
            })),
          },
        },
      });

      //Act
      const result = await authorizedCaller.game.getGenres({
        id: game.id,
      });

      //Ensure response type
      const expectedGenres: { genres: Genre[] } = {
        genres: genres,
      };

      //Assert
      expect(result).toMatchObject(expectedGenres);
    });
  });
});

describe("When retrieving a Game's Publisher", () => {
  describe("and the game doesn't exist", () => {
    it("should throw an error", async () => {
      //Act
      const result = authorizedCaller.game.getPublisher({
        id: createId(),
      });

      //Assert
      await expect(result).rejects.toThrowError("Game not found");
    });
  });
  describe("and the game exists", () => {
    it("should return the game's publisher", async () => {
      //Arrange
      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
      });
      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
      });
      const game = await prisma.game.create({
        data: {
          name: "A game",
          description: "A game",
          releaseDate: new Date(),
          coverImage: "https://via.placeholder.com/150",
          backgroundImage: "https://via.placeholder.com/150",
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

      //Act
      const result = await authorizedCaller.game.getPublisher({
        id: game.id,
      });

      //Assert
      expect(result).toMatchObject({ publisher: publisher });
    });
  });
});

describe("When retrieving a Game's Franchise", () => {
  describe("and the game doesn't exist", () => {
    it("should throw an error", async () => {
      //Act
      const result = authorizedCaller.game.getFranchise({
        id: createId(),
      });

      //Assert
      await expect(result).rejects.toThrowError("Game not found");
    });
  });
  describe("and the game exists", () => {
    it("should return the game's publisher", async () => {
      //Arrange
      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
      });
      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
      });
      const game = await prisma.game.create({
        data: {
          name: "A game",
          description: "A game",
          releaseDate: new Date(),
          coverImage: "https://via.placeholder.com/150",
          backgroundImage: "https://via.placeholder.com/150",
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

      //Act
      const result = await authorizedCaller.game.getFranchise({
        id: game.id,
      });

      //Assert
      expect(result).toMatchObject({ franchise: franchise });
    });
  });
});

describe("When retrieving a Game's Reviews", () => {
  describe("and the game doesn't exist", () => {
    it("should throw an error", async () => {
      //Act
      const result = authorizedCaller.game.getReviews({
        id: createId(),
      });

      //Assert
      await expect(result).rejects.toThrowError("Game not found");
    });
  });
  describe("and the game has no reviews", () => {
    describe("and the game exists", () => {
      it("should return an empty array", async () => {
        //Arrange
        const publisher = await prisma.publisher.create({
          data: {
            coverImage: "https://via.placeholder.com/150",
            description: "A publisher",
            name: "A publisher",
          },
        });

        const franchise = await prisma.franchise.create({
          data: {
            name: "A franchise",
            description: "A franchise",
            backgroundImage: "https://via.placeholder.com/150",
          },
        });

        const game = await prisma.game.create({
          data: {
            name: "A game",
            description: "A game",
            releaseDate: new Date(),
            coverImage: "https://via.placeholder.com/150",
            backgroundImage: "https://via.placeholder.com/150",
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

        //Act
        const result = await authorizedCaller.game.getReviews({
          id: game.id,
        });

        //Assert
        expect(result).toMatchObject({ reviews: [] });
      });
    });
  });
  describe("and the game has reviews", () => {
    it("should return the reviews", async () => {
      //Arrange
      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
      });

      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
      });

      const game = await prisma.game.create({
        data: {
          name: "A game",
          description: "A game",
          releaseDate: new Date(),
          coverImage: "https://via.placeholder.com/150",
          backgroundImage: "https://via.placeholder.com/150",
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

      const user = await prisma.user.create({
        data: {
          name: "A user",
          email: "email",
          image: "image",
        },
      });

      const reviews: Promise<Review>[] = Array.from({ length: 2 }, (_, i) =>
        prisma.review.create({
          data: {
            content: `A review ${i}`,
            user: {
              connect: {
                id: user.id,
              },
            },
            game: {
              connect: {
                id: game.id,
              },
            },
            rating: 5,
          },
        })
      );

      const results = await Promise.all(reviews);

      //Act
      const result = await authorizedCaller.game.getReviews({
        id: game.id,
      });

      //Assert
      expect(result.reviews).toHaveLength(reviews.length);
    });
  });
});

describe("When retrieving a Game's Platforms", () => {
  describe("and the game doesn't exist", () => {
    it("should throw an error", async () => {
      //Act
      const result = authorizedCaller.game.getPlatforms({
        id: createId(),
      });

      //Assert
      await expect(result).rejects.toThrowError("Game not found");
    });
  });
  describe("and the game has no platforms", () => {
    it("should return an empty array", async () => {
      //Arrange
      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
      });

      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
      });

      const game = await prisma.game.create({
        data: {
          name: "A game",
          description: "A game",
          releaseDate: new Date(),
          coverImage: "https://via.placeholder.com/150",
          backgroundImage: "https://via.placeholder.com/150",
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

      //Act
      const result = await authorizedCaller.game.getPlatforms({
        id: game.id,
      });

      //Assert
      expect(result).toMatchObject([]);
    });
  });
  describe("and the game has platforms", () => {
    it("should return an array of platforms", async () => {
      //Arrange
      const _platforms: Promise<Platform>[] = Array.from(
        { length: 2 },
        (_, i) =>
          prisma.platform.create({
            data: {
              coverImage: "https://via.placeholder.com/150",
              description: `A platform ${i}`,
              name: `A platform ${i}`,
            },
          })
      );

      const platforms = await Promise.all(_platforms);
      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
      });

      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
      });

      const game = await prisma.game.create({
        data: {
          name: "A game",
          description: "A game",
          releaseDate: new Date(),
          coverImage: "https://via.placeholder.com/150",
          backgroundImage: "https://via.placeholder.com/150",
          platforms: {
            create: platforms.map((platform) => ({
              platform: {
                connect: {
                  id: platform.id,
                },
              },
              storeLink: "https://via.placeholder.com/150",
            })),
          },
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
      //Act
      const result = await authorizedCaller.game.getPlatforms({
        id: game.id,
      });

      //Assert
      expect(result.sort((a, b) => a.name.localeCompare(b.name))).toMatchObject(
        platforms.sort((a, b) => a.name.localeCompare(b.name))
      );
    });
  });
});

describe("When retrieving a Game's details", () => {
  describe("and the game doesn't exist", () => {
    it("should throw an error", async () => {
      //Act
      const result = authorizedCaller.game.getDetails({
        id: createId(),
      });

      //Assert
      await expect(result).rejects.toThrowError("Game not found");
    });
  });
  describe("and the game exists", () => {
    it("should return the game's details", async () => {
      //Arrange
      const _platforms: Promise<Platform>[] = Array.from(
        { length: 2 },
        (_, i) =>
          prisma.platform.create({
            data: {
              coverImage: "https://via.placeholder.com/150",
              description: `A platform ${i}`,
              name: `A platform ${i}`,
            },
          })
      );

      const platforms = (await Promise.all(_platforms)).map(
        ({ id, name, description }) => ({ id, name, description })
      );

      const _genres: Promise<Genre>[] = Array.from({ length: 2 }, (_, i) =>
        prisma.genre.create({
          data: {
            name: `A genre ${i}`,
            description: `A genre ${i}`,
          },
        })
      );

      const genres = (await Promise.all(_genres)).map(
        ({ id, name, description }) => ({ id, name, description })
      );

      const _features: Promise<Feature>[] = Array.from({ length: 2 }, (_, i) =>
        prisma.feature.create({
          data: {
            name: `A feature ${i}`,
            description: `A feature ${i}`,
          },
        })
      );

      const features = (await Promise.all(_features)).map(
        ({ id, name, description }) => ({ id, name, description })
      );

      const _developers: Promise<Developer>[] = Array.from(
        { length: 2 },
        (_, i) =>
          prisma.developer.create({
            data: {
              name: `A developer ${i}`,
              description: `A developer ${i}`,
              coverImage: "https://via.placeholder.com/150",
            },
          })
      );
      const developers = (await Promise.all(_developers)).map(
        ({ id, name, description }) => ({ id, name, description })
      );

      const publisher = await prisma.publisher.create({
        data: {
          coverImage: "https://via.placeholder.com/150",
          description: "A publisher",
          name: "A publisher",
        },
        select: {
          name: true,
          id: true,
          description: true,
        },
      });

      const franchise = await prisma.franchise.create({
        data: {
          name: "A franchise",
          description: "A franchise",
          backgroundImage: "https://via.placeholder.com/150",
        },
        select: {
          name: true,
          id: true,
          description: true,
        },
      });

      const game = await prisma.game.create({
        data: {
          backgroundImage: "https://via.placeholder.com/150",
          coverImage: "https://via.placeholder.com/150",
          description: "A game",
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
          developers: {
            connect: developers.map((developer) => ({
              id: developer.id,
            })),
          },
          name: "A game",
          features: {
            connect: features.map((feature) => ({
              id: feature.id,
            })),
          },
          genres: {
            connect: genres.map((genre) => ({
              id: genre.id,
            })),
          },
          platforms: {
            create: platforms.map((platform) => ({
              platform: {
                connect: {
                  id: platform.id,
                },
              },
              storeLink: "https://via.placeholder.com/150",
            })),
          },
        },
      });

      const user = await prisma.user.create({
        data: {
          name: "A user",
          email: "email",
          image: "image",
        },
      });

      const _reviews: Promise<Review>[] = Array.from({ length: 2 }, (_, i) =>
        prisma.review.create({
          data: {
            content: `A review ${i}`,
            user: {
              connect: {
                id: user.id,
              },
            },
            game: {
              connect: {
                id: game.id,
              },
            },
            rating: 5,
          },
        })
      );

      const reviews = await Promise.all(_reviews);

      //Act
      const result = await authorizedCaller.game.getDetails({
        id: game.id,
      });

      const expected: GameDetailsOutput = {
        publisherId: publisher.id,
        releaseDate: game.releaseDate,
        reviews: reviews.map((review) => ({
          content: review.content,
          rating: review.rating,
          user: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
          _count: {
            comments: review.comments?.length ?? 0,
            likes: review.likes?.length ?? 0,
          },
        })),
        _count: {
          reviews: reviews.length,
        },
        backgroundImage: game.backgroundImage,
        coverImage: game.coverImage,
        description: game.description,
        developers: developers,
        features: features,
        franchise: franchise,
        franchiseId: franchise.id,
        genres: genres,
        id: game.id,
        name: game.name,
        platforms: platforms.map((platform) => ({
          storeLink: "https://via.placeholder.com/150",
          platform: platform,
        })),
        publisher: publisher,
      };

      result.platforms.sort((a, b) =>
        a.platform.name.localeCompare(b.platform.name)
      );
      result.genres.sort((a, b) => a.name.localeCompare(b.name));
      result.developers.sort((a, b) => a.name.localeCompare(b.name));
      result.features.sort((a, b) => a.name.localeCompare(b.name));
      result.reviews.sort((a, b) => a.content.localeCompare(b.content));

      //Assert
      expect(result).toMatchObject(expected);
    });
  });
});
