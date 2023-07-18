import { appRouter } from "~/server/api/root";
import { createMockContext, type MockContext } from "../../context";
import type { Session } from "next-auth";

let mockCtx: MockContext;

beforeEach(() => {
  mockCtx = createMockContext();
});
afterEach(() => {
  jest.clearAllMocks();
});

const user = {
  id: "1",
  name: "test",
};

const mockSession: Session = {
  expires: new Date().toISOString(),
  user: user,
};

describe("When creating a franchise", () => {
  describe("when the user is not authenticated", () => {
    it("should throw an UnauthorizedError", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.franchise.create({
          name: "Test Franchise 1",
          description: "This is a test franchise 1",
          background_image: "test1.jpg",
        })
      ).rejects.toThrow();
    });
  });
  describe("when the user is authenticated", () => {
    it("should create the franchise", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      const expectedCreated = {
        id: "test",
        name: "Test Franchise 1",
        description: "This is a test franchise 1",
        background_image: "test1.jpg",
      };
      mockCtx.prisma.franchise.create.mockResolvedValue(expectedCreated);

      // Act
      const result = await caller.franchise.create(expectedCreated);

      // Assert
      expect(result).toMatchObject(expectedCreated);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockCtx.prisma.franchise.create).toHaveBeenCalledWith({
        data: {
          name: expectedCreated.name,
          description: expectedCreated.description,
          background_image: expectedCreated.background_image,
        },
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
      expect(result).toMatchObject([]);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockCtx.prisma.franchise.findMany).toHaveBeenCalledWith();
    });
  });
  describe("and there are franchises", () => {
    it("should return the franchises", async () => {
      // Arrange

      const franchises = [
        {
          id: "1",
          name: "Test Franchise 1",
          description: "This is a test franchise 1",
          background_image: "test1.jpg",
        },
        {
          id: "2",
          name: "Test Franchise 2",
          description: "This is a test franchise 2",
          background_image: "test2.jpg",
          games: [
            {
              id: "1",
              name: "Test Game 1",
              description: "This is a test game 1",
              background_image: "game1.jpg",
              franchiseId: "2",
              publisherId: "1",
              cover_image: "game1.jpg",
              release_date: new Date(),
            },
          ],
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
      expect(result).toMatchObject(franchises);
    });
  });
});

describe("When retrieving a franchise by Id", () => {
  describe("and the franchise is not found", () => {
    it("should throw an error", async () => {
      // Arrange
      mockCtx.prisma.franchise.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.franchise.getById({ id: "notfound" })
      ).rejects.toThrow();
    });
  });
  describe("and the franchise is found", () => {
    it("should return the franchise", async () => {
      // Arrange
      const franchise = {
        id: "test",
        name: "Test Franchise 1",
        description: "This is a test franchise 1",
        background_image: "test1.jpg",
      };
      mockCtx.prisma.franchise.findUnique.mockResolvedValue(franchise);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.franchise.getById({ id: franchise.id });

      // Assert
      expect(result).toMatchObject(franchise);
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
  describe("when the user is not authenticated", () => {
    it("should throw an UnauthorizedError", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.franchise.update({
          id: "test",
          name: "Test Franchise 1",
          description: "This is a test franchise 1",
          background_image: "test1.jpg",
        })
      ).rejects.toThrow();
    });
  });
  describe("when the franchise is not found", () => {
    it("should throw an error", async () => {
      // Arrange
      mockCtx.prisma.franchise.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Expect
      await expect(() =>
        caller.franchise.update({
          id: "notfound",
          name: "Test Franchise 1",
          description: "This is a test franchise 1",
          background_image: "test1.jpg",
        })
      ).rejects.toThrow();
    });
  });

  describe("when the franchise is found", () => {
    it("should update the franchise", async () => {
      // Arrange
      const franchise = {
        id: "test",
        name: "Test Franchise 1",
        description: "This is a test franchise 1",
        background_image: "test1.jpg",
      };
      mockCtx.prisma.franchise.findUnique.mockResolvedValue(franchise);
      const expectedUpdated = {
        id: "test",
        name: "UPDATED",
        description: "UPDATED",
        background_image: "test1.jpg",
      };
      mockCtx.prisma.franchise.update.mockResolvedValue(expectedUpdated);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act
      const result = await caller.franchise.update(expectedUpdated);

      // Assert
      expect(result).toMatchObject(expectedUpdated);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockCtx.prisma.franchise.update).toHaveBeenCalledWith({
        data: {
          name: expectedUpdated.name,
          description: expectedUpdated.description,
          background_image: expectedUpdated.background_image,
        },
        where: {
          id: franchise.id,
        },
      });
    });
  });
});

describe("When deleting a franchise", () => {
  describe("when the user is not authenticated", () => {
    it("should throw an UnauthorizedError", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.franchise.delete({
          id: "test",
        })
      ).rejects.toThrow();
    });
  });
  describe("when the franchise is not found", () => {
    it("should throw an error", async () => {
      // Arrange
      mockCtx.prisma.franchise.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Expect
      await expect(() =>
        caller.franchise.delete({
          id: "notfound",
        })
      ).rejects.toThrow();
    });
  });

  describe("when the franchise is found", () => {
    it("should delete the franchise", async () => {
      // Arrange
      const franchise = {
        id: "test",
        name: "Test Franchise 1",
        description: "This is a test franchise 1",
        background_image: "test1.jpg",
      };
      mockCtx.prisma.franchise.findUnique.mockResolvedValue(franchise);
      const expectedDeleted = {
        id: "test",
        name: "Test Franchise 1",
        description: "This is a test franchise 1",
        background_image: "test1.jpg",
      };
      mockCtx.prisma.franchise.delete.mockResolvedValue(expectedDeleted);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act
      const result = await caller.franchise.delete({
        id: franchise.id,
      });

      // Assert
      expect(result).toMatchObject(expectedDeleted);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockCtx.prisma.franchise.delete).toHaveBeenCalledWith({
        where: {
          id: franchise.id,
        },
      });
    });
  });
});
