/* eslint-disable testing-library/no-await-sync-query */
import type { User } from "@prisma/client";
import type { Session } from "next-auth";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";

beforeAll(async () => {
  // create franchises
  await prisma.franchise.createMany({
    data: [
      {
        name: "franchise1",
        description: "franchise1",
        backgroundImage: "franchise1",
      },
      {
        name: "franchise2",
        description: "franchise2",
        backgroundImage: "franchise2",
      },
    ],
  });
  console.log("✨ 2 franchises created");
  console.log("On: ", process.env.DATABASE_URL);
});

afterAll(async () => {
  const deleteFranchises = prisma.franchise.deleteMany();

  await prisma.$transaction([deleteFranchises]);
  console.log("Everything deleted on: ", process.env.DATABASE_URL);
  await prisma.$disconnect();
});

describe("When creating a franchise", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const franchise = {
        name: "franchise3",
        description: "franchise3",
        backgroundImage: "franchise3",
      };

      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });
      // Act
      const result = caller.franchise.create(franchise);

      // Assert
      await expect(result).rejects.toThrowError("UNAUTHORIZED");
    });
  });
  describe("and the user is authenticated", () => {
    it("should create a franchise", async () => {
      // Arrange
      const franchise = {
        name: "franchise3",
        description: "franchise3",
        backgroundImage: "franchise3",
      };
      const user: User = {
        id: "1",
        email: "email",
        emailVerified: null,
        image: "image",
        name: "test",
      };
      const mockSession: Session = {
        expires: new Date().toISOString(),
        user: user,
      };

      const caller = appRouter.createCaller({
        session: mockSession,
        prisma: prisma,
      });
      // Act
      const result = await caller.franchise.create(franchise);
      const newFranchise = await prisma.franchise.findUnique({
        where: {
          id: result.id,
        },
      });

      // Assert
      expect(newFranchise).toMatchObject(franchise);
    });
  });
});

describe("When getting a franchise by Id", () => {
  describe("and the franchise does not exist", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      // Act
      const result = caller.franchise.getById({ id: "1" });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the franchise exists", () => {
    it("should return a franchise", async () => {
      // Arrange
      const data = await prisma.franchise.create({
        data: {
          name: "franchise4",
          description: "franchise4",
          backgroundImage: "franchise4",
        },
      });

      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      // Act
      const result = await caller.franchise.getById({ id: data.id });

      // Assert
      expect(result).toMatchObject(data);
    });
  });
});

describe("When getting all franchises", () => {
  describe("and there are no franchises", () => {
    it("should return an empty array", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });
      await prisma.franchise.deleteMany();

      // Act
      const result = await caller.franchise.getAll();

      // Assert
      expect(result).toMatchObject([]);
    });
  });

  describe("and there are franchises", () => {
    it("should return an array of franchises", async () => {
      // Arrange
      const franchises = [
        {
          name: "franchise5",
          description: "franchise5",
          backgroundImage: "franchise5",
        },
        {
          name: "franchise6",
          description: "franchise6",
          backgroundImage: "franchise6",
        },
      ];

      await prisma.franchise.createMany({
        data: franchises,
      });

      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      // Act
      const result = await caller.franchise.getAll();

      // Assert
      expect(result).toMatchObject(franchises);
    });
  });
});

describe("When updating a franchise", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      // Act
      const result = caller.franchise.update({
        id: "1",
        name: "franchise7",
        description: "franchise7",
        backgroundImage: "franchise7",
      });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the franchise does not exist", () => {
    it("should throw an error", async () => {
      // Arrange
      const user: User = {
        id: "1",
        email: "email",
        emailVerified: null,
        image: "image",
        name: "test",
      };

      const mockSession: Session = {
        expires: new Date().toISOString(),
        user: user,
      };

      const caller = appRouter.createCaller({
        session: mockSession,
        prisma: prisma,
      });

      // Act
      const result = caller.franchise.update({
        id: "1",
        name: "franchise7",
        description: "franchise7",
        backgroundImage: "franchise7",
      });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the franchise exists", () => {
    it("should update the franchise", async () => {
      // Arrange
      const data = await prisma.franchise.create({
        data: {
          name: "franchise8",
          description: "franchise8",
          backgroundImage: "franchise8",
        },
      });

      const user: User = {
        id: "1",
        email: "email",
        emailVerified: null,
        image: "image",
        name: "test",
      };

      const mockSession: Session = {
        expires: new Date().toISOString(),
        user: user,
      };

      const caller = appRouter.createCaller({
        session: mockSession,
        prisma: prisma,
      });

      // Act
      const result = await caller.franchise.update({
        id: data.id,
        name: "updated",
        description: "updated",
        backgroundImage: "updated",
      });

      // Assert
      expect(result).toMatchObject({
        id: data.id,
        name: "updated",
        description: "updated",
        backgroundImage: "updated",
      });
    });
  });
});

describe("When deleting a franchise", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an authentication error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        session: null,
        prisma: prisma,
      });

      // Act
      const result = caller.franchise.delete({ id: "1" });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });
  describe("and the franchise does not exist", () => {
    it("should throw an error", async () => {
      // Arrange
      const user: User = {
        id: "1",
        email: "email",
        emailVerified: null,
        image: "image",
        name: "test",
      };

      const mockSession: Session = {
        expires: new Date().toISOString(),
        user: user,
      };

      const caller = appRouter.createCaller({
        session: mockSession,
        prisma: prisma,
      });

      // Act
      const result = caller.franchise.delete({ id: "1" });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });
  describe("and the franchise exists", () => {
    it("should delete the franchise", async () => {
      // Arrange
      const data = await prisma.franchise.create({
        data: {
          name: "franchise9",
          description: "franchise9",
          backgroundImage: "franchise9",
        },
      });

      const user: User = {
        id: "1",
        email: "email",
        emailVerified: null,
        image: "image",
        name: "test",
      };

      const mockSession: Session = {
        expires: new Date().toISOString(),
        user: user,
      };

      const caller = appRouter.createCaller({
        session: mockSession,
        prisma: prisma,
      });

      // Act
      const result = await caller.franchise.delete({ id: data.id });

      // Assert
      expect(result).toMatchObject(data);
    });
  });
});
