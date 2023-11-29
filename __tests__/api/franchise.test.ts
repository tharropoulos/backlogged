/* eslint-disable testing-library/no-await-sync-query */
import { appRouter } from "~/server/api/root";
import { createMockContext, type MockContext } from "~/server/api/context";
import type { Session, User } from "next-auth";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { type z } from "zod";
import { type createFranchiseSchema } from "~/lib/validations/franchise";
import { Prisma, type Franchise } from "@prisma/client";

let mockCtx: MockContext;

beforeEach(() => {
  mockCtx = createMockContext();
});
afterEach(() => {
  jest.clearAllMocks();
});

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

const mockUserSession: Session = {
  expires: new Date().toISOString(),
  user: mockUser,
};

const mockAdminSession: Session = {
  expires: new Date().toISOString(),
  user: mockAdmin,
};

describe("When creating a franchise", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.franchise.create({
          name: faker.company.name(),
          backgroundImage: faker.image.url(),
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
          caller.franchise.create({
            name: faker.company.name(),
            backgroundImage: faker.image.url(),
            description: faker.lorem.words(),
          })
        ).rejects.toThrow();
      });
    });
    describe("and the user is an admin", () => {
      it("should create the franchise", async () => {
        // Arrange
        const caller = appRouter.createCaller({
          prisma: mockCtx.prisma,
          session: mockAdminSession,
        });

        const expectedCreated: z.infer<typeof createFranchiseSchema> & {
          id: string;
        } = {
          name: faker.company.name(),
          id: createId(),
          backgroundImage: faker.image.url(),
          description: faker.lorem.words(),
        };
        mockCtx.prisma.franchise.create.mockResolvedValue(expectedCreated);

        // Act
        const result = await caller.franchise.create(expectedCreated);

        // Assert
        expect(result.ok).toBe(true);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockCtx.prisma.franchise.create).toHaveBeenCalledWith({
          data: {
            name: expectedCreated.name,
            description: expectedCreated.description,
            backgroundImage: expectedCreated.backgroundImage,
          },
        });
      });
    });
  });
});

describe("When retrieving all franchises", () => {
  describe("and there are no franchises", () => {
    it("should return an empty array", async () => {
      // Arrange
      mockCtx.prisma.franchise.findMany.mockResolvedValue([]);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.franchise.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject([]);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockCtx.prisma.franchise.findMany).toHaveBeenCalledWith();
    });
  });
  describe("and there are franchises", () => {
    it("should return the franchises", async () => {
      // Arrange
      const franchises: Array<Franchise> = [
        {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          backgroundImage: faker.image.url(),
        },
        {
          id: createId(),
          name: faker.company.name(),
          description: faker.lorem.words(),
          backgroundImage: faker.image.url(),
        },
      ];

      mockCtx.prisma.franchise.findMany.mockResolvedValue(franchises);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.franchise.getAll();

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(franchises);
    });
  });
});

describe("When retrieving a franchise by Id", () => {
  describe("and the franchise does not exist", () => {
    it("should return an error", async () => {
      // Arrange
      mockCtx.prisma.franchise.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      const result = await caller.franchise.getById({
        id: createId(),
      });

      // Act + Expect
      expect(result.ok).toBe(false);
    });
  });
  describe("and the franchise exists", () => {
    it("should return the franchise", async () => {
      // Arrange
      const franchise: Franchise = {
        name: faker.company.name(),
        id: createId(),
        backgroundImage: faker.image.url(),
        description: faker.lorem.words(),
      };

      mockCtx.prisma.franchise.findUnique.mockResolvedValue(franchise);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.franchise.getById({ id: franchise.id });

      // Assert
      expect(result.ok).toBe(true);
      expect(result.val).toMatchObject(franchise);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockCtx.prisma.franchise.findUnique).toHaveBeenCalledWith({
        where: {
          id: franchise.id,
        },
      });
    });
  });
});

describe("When updating a franchise", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.franchise.update({
          name: faker.company.name(),
          id: createId(),
          backgroundImage: faker.image.url(),
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
          caller.franchise.update({
            name: faker.company.name(),
            id: createId(),
            backgroundImage: faker.image.url(),
            description: faker.lorem.words(),
          })
        ).rejects.toThrow();
      });
    });
    describe("and the user is an admin", () => {
      describe("and the franchise does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          mockCtx.prisma.franchise.update.mockRejectedValue(
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
          const result = await caller.franchise.update({
            name: faker.company.name(),
            id: createId(),
            backgroundImage: faker.image.url(),
            description: faker.lorem.words(),
          });

          //Assert
          expect(result.ok).toBe(false);
        });
      });
      describe("and the franchise exists", () => {
        it("should update the franchise", async () => {
          // Arrange
          const franchise: Franchise = {
            name: faker.company.name(),
            id: createId(),
            backgroundImage: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.franchise.findUnique.mockResolvedValue(franchise);

          const expectedUpdated: Franchise = {
            id: franchise.id,
            name: faker.company.name(),
            backgroundImage: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.franchise.update.mockResolvedValue(expectedUpdated);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.franchise.update(expectedUpdated);

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(expectedUpdated);
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(mockCtx.prisma.franchise.update).toHaveBeenCalledWith({
            data: {
              name: expectedUpdated.name,
              description: expectedUpdated.description,
              backgroundImage: expectedUpdated.backgroundImage,
            },
            where: {
              id: franchise.id,
            },
          });
        });
      });
    });
  });
});

describe("When deleting a franchise", () => {
  describe("and the user is not authenticated", () => {
    it("should throw an error", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.franchise.delete({
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
          caller.franchise.delete({
            id: createId(),
          })
        ).rejects.toThrow();
      });
    });
    describe("and the user is an admin", () => {
      describe("and the franchise does not exist", () => {
        it("should return an error", async () => {
          // Arrange
          // mockCtx.prisma.franchise.findUnique.mockResolvedValue(null);

          mockCtx.prisma.franchise.delete.mockRejectedValue(
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
          const result = await caller.franchise.delete({
            id: createId(),
          });

          // Assert
          expect(result.ok).toBe(false);
        });
      });

      describe("and the franchise exists", () => {
        it("should delete the franchise", async () => {
          // Arrange
          const franchise: Franchise = {
            id: createId(),
            name: faker.company.name(),
            backgroundImage: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.franchise.findUnique.mockResolvedValue(franchise);

          const expectedDeleted: Franchise = {
            id: createId(),
            name: faker.company.name(),
            backgroundImage: faker.image.url(),
            description: faker.lorem.words(),
          };

          mockCtx.prisma.franchise.delete.mockResolvedValue(expectedDeleted);

          const caller = appRouter.createCaller({
            prisma: mockCtx.prisma,
            session: mockAdminSession,
          });

          // Act
          const result = await caller.franchise.delete({
            id: franchise.id,
          });

          // Assert
          expect(result.ok).toBe(true);
          expect(result.val).toMatchObject(expectedDeleted);
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(mockCtx.prisma.franchise.delete).toHaveBeenCalledWith({
            where: {
              id: franchise.id,
            },
          });
        });
      });
    });
  });
});
