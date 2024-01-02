/* eslint-disable testing-library/no-await-sync-query */
/* eslint-disable @typescript-eslint/unbound-method */
//__BEGIN_COPILOT_CODE
// Import necessary modules and types
import { appRouter } from "~/server/api/root";
import { createMockContext, type MockContext } from "~/server/api/context";
import type { Session, User } from "next-auth";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { type z } from "zod";
import { type createPublisherSchema } from "~/lib/validations/publisher";
import { Prisma, type Publisher } from "@prisma/client";

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
describe("When creating a publisher", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.publisher.create({
          name: faker.company.name(),
          // __REWRITE_1: image: imageUrl() is deprecated, use url() instead
          //   image: faker.image.imageUrl(),
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
          caller.publisher.create({
            name: faker.company.name(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      it("should create a publisher", async () => {
        // Arrange
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockAdminSession,
        });

        const expectedCreated: z.infer<typeof createPublisherSchema> & {
          id: string;
        } = {
          name: faker.company.name(),
          id: createId(),
          image: faker.image.url(),
          description: faker.lorem.words(),
        };

        mockCtx.prisma.publisher.create.mockResolvedValue(expectedCreated);

        // Act
        const result = await caller.publisher.create(expectedCreated);

        // Assert
        expect(result.ok).toBe(true);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockCtx.prisma.publisher.create).toHaveBeenCalledWith({
          data: {
            name: expectedCreated.name,
            description: expectedCreated.description,
            image: expectedCreated.image,
          },
        });
        //__REWRITE_3: use createPublisherSchema instead of Publisher
        // Arrange
        // const newPublisher: Publisher = {
        //   name: faker.company.name(),
        //   image: faker.image.url(),
        //   description: faker.lorem.words(),
        // };
      });
    });
  });
});

describe("When retrieving all publishers", () => {
  describe("and there are no publishers", () => {
    it("should return an empty array", async () => {
      // Arrange
      mockCtx.prisma.publisher.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.publisher.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
      expect(mockCtx.prisma.publisher.findMany).toHaveBeenCalledWith();
    });
  });

  describe("and there are publishers", () => {
    it("should return the publishers", async () => {
      // Arrange
      const publishers: Array<Publisher> = [
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

      mockCtx.prisma.publisher.findMany.mockResolvedValue(publishers);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.publisher.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(publishers);
    });
  });
});

describe("When retrieving a publisher by Id", () => {
  describe("and the publisher does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      mockCtx.prisma.publisher.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      const result = await caller.publisher.getById({
        id: createId(),
      });

      // Act + Expect
      expect(result.ok).toBe(false);
    });
  });

  describe("and the publisher exists", () => {
    it("should return the publisher", async () => {
      // Arrange
      const publisher: Publisher = {
        name: faker.company.name(),
        id: createId(),
        image: faker.image.url(),
        description: faker.lorem.words(),
      };

      mockCtx.prisma.publisher.findUnique.mockResolvedValue(publisher);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.publisher.getById({ id: publisher.id });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(publisher);
      expect(mockCtx.prisma.publisher.findUnique).toHaveBeenCalledWith({
        where: {
          id: publisher.id,
        },
      });
    });
  });
});

describe("When updating a publisher", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.publisher.update({
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
          caller.publisher.update({
            name: faker.company.name(),
            id: createId(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          })
        ).rejects.toThrow();
      });
    });

    describe("and the user is an admin", () => {
      describe("and the publisher does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.publisher.update.mockRejectedValue(
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
          const result = await caller.publisher.update({
            name: faker.company.name(),
            id: createId(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          });

          //Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the publisher exists", () => {
        it("should update the publisher", async () => {
          // Arrange
          const publisher: Publisher = {
            name: faker.company.name(),
            id: createId(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.publisher.findUnique.mockResolvedValue(publisher);

          const expectedUpdated: Publisher = {
            id: publisher.id,
            name: faker.company.name(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.publisher.update.mockResolvedValue(expectedUpdated);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.publisher.update(expectedUpdated);

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(expectedUpdated);
          expect(mockCtx.prisma.publisher.update).toHaveBeenCalledWith({
            data: {
              name: expectedUpdated.name,
              description: expectedUpdated.description,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              image: expectedUpdated.image,
            },
            where: {
              id: publisher.id,
            },
          });
        });
      });
    });
  });
});

//__BEGIN_COPILOT_CODE
describe("When deleting a publisher", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.publisher.delete({
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
          caller.publisher.delete({
            id: createId(),
          })
        ).rejects.toThrow();
      });
    });
    describe("and the user is an admin", () => {
      describe("and the publisher does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.publisher.delete.mockRejectedValue(
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
          const result = await caller.publisher.delete({
            id: createId(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the publisher exists", () => {
        it("should delete the publisher", async () => {
          // Arrange
          const publisher: Publisher = {
            id: createId(),
            name: faker.company.name(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.publisher.findUnique.mockResolvedValue(publisher);

          const expectedDeleted: Publisher = {
            id: createId(),
            name: faker.company.name(),
            image: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.publisher.delete.mockResolvedValue(expectedDeleted);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.publisher.delete({
            id: publisher.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(expectedDeleted);
          expect(mockCtx.prisma.publisher.delete).toHaveBeenCalledWith({
            where: {
              id: publisher.id,
            },
          });
        });
      });
    });
  });
});
//__END_COPILOT_CODE
