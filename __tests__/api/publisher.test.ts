// NOTE: Written by Copilot Chat
import { appRouter } from "~/server/api/root";
import type { z } from "zod";
import { createMockContext, type MockContext } from "~/server/api/context";
import type { Session } from "next-auth";
import type {
  createPublisherSchema,
  publisherSchema,
} from "~/lib/validations/publisher";
let mockCtx: MockContext;

type CreatePublisherSchema = z.infer<typeof createPublisherSchema>;
type PublisherSchema = z.infer<typeof publisherSchema>;
type TRPCInput = {
  data: CreatePublisherSchema;
};

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

describe("When creating a publisher", () => {
  describe("when the user is not authenticated", () => {
    it("should throw an UnauthorizedError", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      const publisherInput: CreatePublisherSchema = {
        name: "Test Publisher 1",
        description: "This is a test publisher 1",
        coverImage: "test1.jpg",
        // logo: "test1.jpg", //ERROR: logo does not exist on the type, copilot error
      };

      // Act + Expect
      await expect(() =>
        caller.publisher.create(publisherInput)
      ).rejects.toThrow();
    });
  });
  describe("when the user is authenticated", () => {
    it("should create the publisher", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      const expectedCreated: PublisherSchema = {
        id: "test",
        name: "Test Publisher 1",
        description: "This is a test publisher 1",
        coverImage: "test1.jpg",
        // logo: "test1.jpg", //ERROR: Same as line 40
      };
      mockCtx.prisma.publisher.create.mockResolvedValue(expectedCreated);

      // Act
      const result = await caller.publisher.create(expectedCreated);

      // Assert
      expect(result).toMatchObject(expectedCreated);

      const publisherInput: TRPCInput = {
        data: {
          name: expectedCreated.name,
          description: expectedCreated.description,
          coverImage: expectedCreated.coverImage,
          // logo: expectedCreated.logo, //ERROR: Same as line 40
        },
      };

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockCtx.prisma.publisher.create).toHaveBeenCalledWith(
        publisherInput
      );
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
      expect(result).toMatchObject([]);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockCtx.prisma.publisher.findMany).toHaveBeenCalledWith();
    });
  });
  describe("and there are publishers", () => {
    it("should return the publishers", async () => {
      // Arrange

      const publishers: PublisherSchema[] = [
        {
          id: "1",
          name: "Test Publisher 1",
          description: "This is a test publisher 1",
          coverImage: "test1.jpg",
          // logo: "test1.jpg", //ERROR: Same as line 40
        },
        {
          id: "2",
          name: "Test Publisher 2",
          description: "This is a test publisher 2",
          coverImage: "test2.jpg",
          // logo: "test2.jpg", //ERROR: Same as line 40
          games: [
            {
              id: "1",
              name: "Test Game 1",
              description: "This is a test game 1",
              backgroundImage: "game1.jpg",
              franchiseId: "1",
              publisherId: "2",
              coverImage: "game1.jpg",
              releaseDate: new Date(),
            },
          ],
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
      expect(result).toMatchObject(publishers);
    });
  });
});

describe("When retrieving a publisher by Id", () => {
  describe("and the publisher is not found", () => {
    it("should throw an error", async () => {
      // Arrange
      mockCtx.prisma.publisher.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.publisher.getById({ id: "notfound" })
      ).rejects.toThrow();
    });
  });
  describe("and the publisher is found", () => {
    it("should return the publisher", async () => {
      // Arrange
      const publisher: PublisherSchema = {
        id: "test",
        name: "Test Publisher 1",
        description: "This is a test publisher 1",
        // logo: "test1.jpg", //ERROR: Same as line 40
        coverImage: "test1.jpg",
      };
      mockCtx.prisma.publisher.findUnique.mockResolvedValue(publisher);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act
      const result = await caller.publisher.getById({ id: publisher.id });

      // Assert
      expect(result).toMatchObject(publisher);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockCtx.prisma.publisher.findUnique).toHaveBeenCalledWith({
        where: {
          id: publisher.id,
        },
      });
    });
  });
});

describe("When updating a publisher", () => {
  describe("when the user is not authenticated", () => {
    it("should throw an UnauthorizedError", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.publisher.update({
          id: "test",
          name: "Test Publisher 1",
          description: "This is a test publisher 1",
          coverImage: "test1.jpg",
          // logo: "test1.jpg", // ERROR: Same as line 40
        })
      ).rejects.toThrow();
    });
  });
  describe("when the publisher is not found", () => {
    it("should throw an error", async () => {
      // Arrange
      mockCtx.prisma.publisher.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Expect
      await expect(() =>
        caller.publisher.update({
          id: "notfound",
          name: "Test Publisher 1",
          description: "This is a test publisher 1",
          coverImage: "test1.jpg",
        })
      ).rejects.toThrow();
    });
  });

  describe("when the publisher is found", () => {
    it("should update the publisher", async () => {
      // Arrange
      const publisher: PublisherSchema = {
        id: "test",
        name: "Test Publisher 1",
        description: "This is a test publisher 1",
        // logo: "test1.jpg", //ERROR: Same as line 40
        coverImage: "test1.jpg",
      };
      mockCtx.prisma.publisher.findUnique.mockResolvedValue(publisher);
      const expectedUpdated: PublisherSchema = {
        id: "test",
        name: "Test Publisher 1",
        description: "This is a test publisher 1",
        // logo: "test1.jpg", //ERROR: Same as line 40
        coverImage: "test1.jpg",
      };
      mockCtx.prisma.publisher.update.mockResolvedValue(expectedUpdated);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act
      const result = await caller.publisher.update(expectedUpdated);

      const publisherInput: TRPCInput = {
        data: {
          name: expectedUpdated.name,
          description: expectedUpdated.description,
          coverImage: expectedUpdated.coverImage,
          // logo: expectedUpdated.logo, //ERROR: Same as line 40
        },
      };

      // Assert
      expect(result).toMatchObject(expectedUpdated);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockCtx.prisma.publisher.update).toHaveBeenCalledWith({
        data: publisherInput.data,
        where: {
          id: publisher.id,
        },
      });
    });
  });
});

describe("When deleting a publisher", () => {
  describe("when the user is not authenticated", () => {
    it("should throw an UnauthorizedError", async () => {
      // Arrange
      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: null,
      });

      // Act + Expect
      await expect(() =>
        caller.publisher.delete({
          id: "test",
        })
      ).rejects.toThrow();
    });
  });
  describe("when the publisher is not found", () => {
    it("should throw an error", async () => {
      // Arrange
      mockCtx.prisma.publisher.findUnique.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act + Expect
      await expect(() =>
        caller.publisher.delete({
          id: "notfound",
        })
      ).rejects.toThrow();
    });
  });

  describe("when the publisher is found", () => {
    it("should delete the publisher", async () => {
      // Arrange
      const publisher: PublisherSchema = {
        id: "test",
        name: "Test Publisher 1",
        description: "This is a test publisher 1",
        coverImage: "test1.jpg",
        // logo: "test1.jpg",
      };
      mockCtx.prisma.publisher.findUnique.mockResolvedValue(publisher);
      const expectedDeleted: PublisherSchema = {
        id: "test",
        name: "Test Publisher 1",
        description: "This is a test publisher 1",
        coverImage: "test1.jpg",
        // logo: "test1.jpg", //ERROR: Same as line 40
      };
      mockCtx.prisma.publisher.delete.mockResolvedValue(expectedDeleted);

      const caller = appRouter.createCaller({
        prisma: mockCtx.prisma,
        session: mockSession,
      });

      // Act
      const result = await caller.publisher.delete({
        id: publisher.id,
      });

      // Assert
      expect(result).toMatchObject(expectedDeleted);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockCtx.prisma.publisher.delete).toHaveBeenCalledWith({
        where: {
          id: publisher.id,
        },
      });
    });
  });
});
