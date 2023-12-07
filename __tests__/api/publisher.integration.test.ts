// BEGIN_COPILOT_CODE
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable testing-library/no-await-sync-query */
import type { Session } from "next-auth";
import type { User } from "next-auth";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { type Publisher } from "@prisma/client";
import { type z } from "zod";
import { type createPublisherSchema } from "~/lib/validations/publisher";

afterAll(async () => {
  const publishers = prisma.publisher.deleteMany();
  await prisma.$transaction([publishers]);
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
// END_COPILOT_CODE
describe("When creating a publisher", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.publisher.create({
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
        const result = authenticatedCaller.publisher.create({
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          image: faker.image.url(),
        });

        // Assert
        await expect(result).rejects.toThrow();
      });
    });
  });

  describe("and the user is an admin", () => {
    it("should create a publisher", async () => {
      // Arrange
      const publisher: z.infer<typeof createPublisherSchema> = {
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        image: faker.image.url(),
      };

      // Act
      const result = await adminCaller.publisher.create(publisher);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(publisher);
    });
  });
});

describe("When retrieving a publisher by Id", () => {
  describe("and the publisher does not exist", () => {
    it("should return an error", async () => {
      // Act
      const result = await unauthenticatedCaller.publisher.getById({
        id: createId(),
      });

      // Assert
      expect(result.ok).toBe(false);
    });
  });

  describe("and the publisher exists", () => {
    it("should return a publisher", async () => {
      // Arrange
      const data = await prisma.publisher.create({
        data: {
          image: faker.image.url(),
          description: faker.company.catchPhrase(),
          name: faker.company.name(),
        },
      });

      // Act
      const result = await authenticatedCaller.publisher.getById({
        id: data.id,
      });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(data);
    });
  });
});

describe("When retrieving all publishers", () => {
  describe("and there are no publishers", () => {
    it("should return an empty array", async () => {
      // Arrange
      await prisma.publisher.deleteMany();

      // Act
      const result = await authenticatedCaller.publisher.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
    });
  });
  describe("and there are publishers", () => {
    it("should return an array of publishers", async () => {
      // Arrange
      const publishers = [
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

      await prisma.publisher.createMany({
        data: publishers,
      });

      // Act
      const result = await authenticatedCaller.publisher.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toHaveLength(2);
    });
  });
});

describe("When updating a publisher", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.publisher.update({
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
        const result = authenticatedCaller.publisher.update({
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
      describe("and the publisher does not exist", () => {
        it("should return an error", async () => {
          // Act
          const result = await adminCaller.publisher.update({
            id: createId(),
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });
      describe("and the publisher exists", () => {
        it("should update the publisher", async () => {
          // Arrange
          const data = await prisma.publisher.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              image: faker.image.url(),
            },
          });

          const expected = {
            id: data.id,
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            image: faker.image.url(),
          };

          // Act
          const result = await adminCaller.publisher.update(expected);

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(expected);
        });
      });
    });
  });
});

describe("When deleting a publisher", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Act
      const result = unauthenticatedCaller.publisher.delete({ id: createId() });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });
  describe("and the user is authenticated", () => {
    describe("and the user is not an admin", () => {
      it("should throw an error", async () => {
        // Act
        const result = authenticatedCaller.publisher.delete({
          id: createId(),
        });

        // Assert
        await expect(result).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the publisher does not exist", () => {
        it("should return an error", async () => {
          // Act
          const result = await adminCaller.publisher.delete({
            id: createId(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the publisher exists", () => {
        it("should delete the publisher", async () => {
          // Arrange
          const data = await prisma.publisher.create({
            data: {
              name: faker.company.name(),
              description: faker.company.catchPhrase(),
              image: faker.image.url(),
            },
          });

          // Act
          const result = await adminCaller.publisher.delete({
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
// END_COPILOT_CODE
