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

describe("When creating a feature", () => {
  describe("and the user is not authenticated", () => {
    it("should return a 401 error", async () => {
      const res = await appRouter.query(
        "createFeature",
        {
          name: "new feature",
          description: "new feature",
        },
        { session: {} as Session }
      );
      expect(res.error?.code).toEqual("UNAUTHORIZED");
    });
  });

  describe("and the user is authenticated", () => {
    it("should create a new feature", async () => {
      const res = await appRouter.query(
        "createFeature",
        {
          name: "new feature",
          description: "new feature",
        },
        { session: { user } }
      );
      expect(res.error).toBeUndefined();
      expect(res.data?.name).toEqual("new feature");
      expect(res.data?.description).toEqual("new feature");
    });
  });
});

describe("When getting all features", () => {
  describe("and the user is not authenticated", () => {
    it("should return a list of features", async () => {
      const res = await appRouter.query(
        "getAllFeatures",
        {},
        { session: {} as Session }
      );
      expect(res.error).toBeUndefined();
      expect(res.data?.length).toEqual(2);
    });
  });

  describe("and the user is authenticated", () => {
    it("should return a list of features", async () => {
      const res = await appRouter.query(
        "getAllFeatures",
        {},
        { session: { user } }
      );
      expect(res.error).toBeUndefined();
      expect(res.data?.length).toEqual(2);
    });
  });
});

describe("When getting a feature by ID", () => {
  describe("and the feature exists", () => {
    it("should return the feature", async () => {
      const features = await prisma.feature.findMany();
      const feature = features[0];

      const res = await appRouter.query(
        "getFeatureById",
        { id: feature.id },
        { session: {} as Session }
      );
      expect(res.error).toBeUndefined();
      expect(res.data?.id).toEqual(feature.id);
      expect(res.data?.name).toEqual(feature.name);
      expect(res.data?.description).toEqual(feature.description);
    });
  });

  describe("and the feature does not exist", () => {
    it("should return a 404 error", async () => {
      const res = await appRouter.query(
        "getFeatureById",
        { id: "invalid-id" },
        { session: {} as Session }
      );
      expect(res.error?.code).toEqual("NOT_FOUND");
    });
  });
});

describe("When updating a feature", () => {
  describe("and the feature exists", () => {
    it("should update the feature", async () => {
      const features = await prisma.feature.findMany();
      const feature = features[0];

      const res = await appRouter.query(
        "updateFeature",
        {
          id: feature.id,
          name: "updated feature",
          description: "updated feature",
        },
        { session: { user } }
      );
      expect(res.error).toBeUndefined();
      expect(res.data?.id).toEqual(feature.id);
      expect(res.data?.name).toEqual("updated feature");
      expect(res.data?.description).toEqual("updated feature");
    });
  });

  describe("and the feature does not exist", () => {
    it("should return a 404 error", async () => {
      const res = await appRouter.query(
        "updateFeature",
        {
          id: "invalid-id",
          name: "updated feature",
          description: "updated feature",
        },
        { session: { user } }
      );
      expect(res.error?.code).toEqual("NOT_FOUND");
    });
  });
});

describe("When deleting a feature", () => {
  describe("and the feature exists", () => {
    it("should delete the feature", async () => {
      const features = await prisma.feature.findMany();
      const feature = features[0];

      const res = await appRouter.query(
        "deleteFeature",
        { id: feature.id },
        { session: { user } }
      );
      expect(res.error).toBeUndefined();

      const deletedFeature = await prisma.feature.findUnique({
        where: {
          id: feature.id,
        },
      });
      expect(deletedFeature).toBeNull();
    });
  });

  describe("and the feature does not exist", () => {
    it("should return a 404 error", async () => {
      const res = await appRouter.query(
        "deleteFeature",
        { id: "invalid-id" },
        { session: { user } }
      );
      expect(res.error?.code).toEqual("NOT_FOUND");
    });
  });
});

describe("When getting games for a feature", () => {
  describe("and the feature exists", () => {
    it("should return the games for the feature", async () => {
      const features = await prisma.feature.findMany();
      const feature = features[0];

      const res = await appRouter.query(
        "getGamesForFeature",
        { id: feature.id },
        { session: {} as Session }
      );
      expect(res.error).toBeUndefined();
      expect(res.data?.games).toBeDefined();
    });
  });

  describe("and the feature does not exist", () => {
    it("should return a 404 error", async () => {
      const res = await appRouter.query(
        "getGamesForFeature",
        { id: "invalid-id" },
        { session: {} as Session }
      );
      expect(res.error?.code).toEqual("NOT_FOUND");
    });
  });
});

describe("When adding games to a feature", () => {
  describe("and the feature exists", () => {
    it("should add the games to the feature", async () => {
      const features = await prisma.feature.findMany();
      const feature = features[0];

      const games: Game[] = [
        {
          name: "game1",
          description: "game1",
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          coverImage: "game1",
          backgroundImage: "game1",
        },
        {
          name: "game2",
          description: "game2",
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          coverImage: "game2",
          backgroundImage: "game2",
        },
      ];

      const createGames = games.map((game) =>
        prisma.game.create({
          data: game,
        })
      );
      const createdGames = await prisma.$transaction(createGames);

      const res = await appRouter.query(
        "addGamesToFeature",
        {
          id: feature.id,
          gameIds: createdGames.map((game) => game.id),
        },
        { session: { user } }
      );
      expect(res.error).toBeUndefined();

      const updatedFeature = await prisma.feature.findUnique({
        where: {
          id: feature.id,
        },
        include: {
          games: true,
        },
      });
      expect(updatedFeature?.games?.length).toEqual(2);
    });
  });

  describe("and the feature does not exist", () => {
    it("should return a 404 error", async () => {
      const res = await appRouter.query(
        "addGamesToFeature",
        {
          id: "invalid-id",
          gameIds: [],
        },
        { session: { user } }
      );
      expect(res.error?.code).toEqual("NOT_FOUND");
    });
  });

  describe("and a game does not exist", () => {
    it("should return a 404 error", async () => {
      const features = await prisma.feature.findMany();
      const feature = features[0];

      const res = await appRouter.query(
        "addGamesToFeature",
        {
          id: feature.id,
          gameIds: ["invalid-id"],
        },
        { session: { user } }
      );
      expect(res.error?.code).toEqual("NOT_FOUND");
    });
  });

  describe("and a game is already linked to the feature", () => {
    it("should return a 400 error", async () => {
      const features = await prisma.feature.findMany();
      const feature = features[0];

      const games: Game[] = [
        {
          name: "game1",
          description: "game1",
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          coverImage: "game1",
          backgroundImage: "game1",
        },
        {
          name: "game2",
          description: "game2",
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          coverImage: "game2",
          backgroundImage: "game2",
        },
      ];

      const createGames = games.map((game) =>
        prisma.game.create({
          data: game,
        })
      );
      const createdGames = await prisma.$transaction(createGames);

      await prisma.feature.update({
        where: {
          id: feature.id,
        },
        data: {
          games: {
            connect: createdGames.map((game) => ({
              id: game.id,
            })),
          },
        },
      });

      const res = await appRouter.query(
        "addGamesToFeature",
        {
          id: feature.id,
          gameIds: createdGames.map((game) => game.id),
        },
        { session: { user } }
      );
      expect(res.error?.code).toEqual("BAD_REQUEST");
    });
  });
});

describe("When removing games from a feature", () => {
  describe("and the feature exists", () => {
    it("should remove the games from the feature", async () => {
      const features = await prisma.feature.findMany();
      const feature = features[0];

      const games: Game[] = [
        {
          name: "game1",
          description: "game1",
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          coverImage: "game1",
          backgroundImage: "game1",
        },
        {
          name: "game2",
          description: "game2",
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          coverImage: "game2",
          backgroundImage: "game2",
        },
      ];

      const createGames = games.map((game) =>
        prisma.game.create({
          data: game,
        })
      );
      const createdGames = await prisma.$transaction(createGames);

      await prisma.feature.update({
        where: {
          id: feature.id,
        },
        data: {
          games: {
            connect: createdGames.map((game) => ({
              id: game.id,
            })),
          },
        },
      });

      const res = await appRouter.query(
        "removeGamesFromFeature",
        {
          id: feature.id,
          gameIds: createdGames.map((game) => game.id),
        },
        { session: { user } }
      );
      expect(res.error).toBeUndefined();

      const updatedFeature = await prisma.feature.findUnique({
        where: {
          id: feature.id,
        },
        include: {
          games: true,
        },
      });
      expect(updatedFeature?.games?.length).toEqual(0);
    });
  });

  describe("and the feature does not exist", () => {
    it("should return a 404 error", async () => {
      const res = await appRouter.query(
        "removeGamesFromFeature",
        {
          id: "invalid-id",
          gameIds: [],
        },
        { session: { user } }
      );
      expect(res.error?.code).toEqual("NOT_FOUND");
    });
  });

  describe("and a game does not exist", () => {
    it("should return a 404 error", async () => {
      const features = await prisma.feature.findMany();
      const feature = features[0];

      const res = await appRouter.query(
        "removeGamesFromFeature",
        {
          id: feature.id,
          gameIds: ["invalid-id"],
        },
        { session: { user } }
      );
      expect(res.error?.code).toEqual("NOT_FOUND");
    });
  });

  describe("and a game is not linked to the feature", () => {
    it("should return a 400 error", async () => {
      const features = await prisma.feature.findMany();
      const feature = features[0];

      const games: Game[] = [
        {
          name: "game1",
          description: "game1",
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          coverImage: "game1",
          backgroundImage: "game1",
        },
        {
          name: "game2",
          description: "game2",
          releaseDate: new Date(),
          franchiseId: createId(),
          publisherId: createId(),
          coverImage: "game2",
          backgroundImage: "game2",
        },
      ];

      const createGames = games.map((game) =>
        prisma.game.create({
          data: game,
        })
      );
      const createdGames = await prisma.$transaction(createGames);

      const res = await appRouter.query(
        "removeGamesFromFeature",
        {
          id: feature.id,
          gameIds: createdGames.map((game) => game.id),
        },
        { session: { user } }
      );
      expect(res.error?.code).toEqual("BAD_REQUEST");
    });
  });

  describe("and no games are provided", () => {
    it("should return a 400 error", async () => {
      const features = await prisma.feature.findMany();
      const feature = features[0];

      const res = await appRouter.query(
        "removeGamesFromFeature",
        {
          id: feature.id,
          gameIds: [],
        },
        { session: { user } }
      );
      expect(res.error?.code).toEqual("BAD_REQUEST");
    });
  });
});
