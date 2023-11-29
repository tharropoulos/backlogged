/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable testing-library/no-await-sync-query */
import type { Session } from "next-auth";
import type { User } from "next-auth";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { type Franchise } from "@prisma/client";
import { type z } from "zod";
import { type createFranchiseSchema } from "~/lib/validations/franchise";

afterAll(async () => {
  const deleteFranchises = prisma.franchise.deleteMany();
  await prisma.$transaction([deleteFranchises]);
  await prisma.$disconnect();
});

const mockUser: User = {
  id: createId(),
  email: faker.internet.email(),
  image: faker.image.url(),
  name: faker.person.firstName(),
};
const mockSession: Session = {
  expires: new Date().toISOString(),
  user: mockUser,
};

const authenticatedCaller = appRouter.createCaller({
  session: mockSession,
  prisma: prisma,
});

const unauthenticatedCaller = appRouter.createCaller({
  session: null,
  prisma: prisma,
});

describe("When creating a franchise", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.franchise.create({
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        backgroundImage: faker.image.url(),
      });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });
  describe("and the user is authenticated", () => {
    it("should create a franchise", async () => {
      // Arrange
      const franchise: z.infer<typeof createFranchiseSchema> = {
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        backgroundImage: faker.image.url(),
      };

      // Act
      const result = await authenticatedCaller.franchise.create(franchise);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(franchise);
    });
  });
});

describe("When retrieving a franchise by Id", () => {
  describe("and the franchise does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await unauthenticatedCaller.franchise.getById({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the franchise exists", () => {
    it("should return a franchise", async () => {
      // Arrange
      const data = await prisma.franchise.create({
        data: {
          backgroundImage: faker.image.url(),
          description: faker.company.catchPhrase(),
          name: faker.company.name(),
        },
      });

      // Act
      const result = await authenticatedCaller.franchise.getById({
        id: data.id,
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(data);
    });
  });
});

describe("When retrieving all franchises", () => {
  describe("and there are no franchises", () => {
    it("should return an empty array", async () => {
      // Arrange
      await prisma.franchise.deleteMany();

      // Act
      const result = await authenticatedCaller.franchise.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
    });
  });

  describe("and there are franchises", () => {
    it("should return an array of franchises", async () => {
      // Arrange
      const franchises = [
        {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          backgroundImage: faker.image.url(),
        },
        {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          backgroundImage: faker.image.url(),
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
      expect(result.ok).toBe(true);
      expect(result.val).toHaveLength(2);
    });
  });
});

describe("When updating a franchise", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.franchise.update({
        id: createId(),
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        backgroundImage: faker.image.url(),
      });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });

  describe("and the franchise does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await authenticatedCaller.franchise.update({
        id: createId(),
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        backgroundImage: faker.image.url(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the franchise exists", () => {
    it("should update the franchise", async () => {
      // Arrange
      const data = await prisma.franchise.create({
        data: {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          backgroundImage: faker.image.url(),
        },
      });

      const expected: Franchise = {
        id: data.id,
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        backgroundImage: faker.image.url(),
      };

      // Act
      const result = await authenticatedCaller.franchise.update(expected);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(expected);
    });
  });
});

describe("When deleting a franchise", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.franchise.delete({ id: createId() });

      // Assert
      await expect(result).rejects.toThrowError();
    });
  });
  describe("and the franchise does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await authenticatedCaller.franchise.delete({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });
  describe("and the franchise exists", () => {
    it("should delete the franchise", async () => {
      // Arrange
      const data = await prisma.franchise.create({
        data: {
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          backgroundImage: faker.image.url(),
        },
      });

      // Act
      const result = await authenticatedCaller.franchise.delete({
        id: data.id,
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(data);
    });
  });
});