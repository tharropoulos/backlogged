import { mockDeep } from "jest-mock-extended";
import type { DeepMockProxy } from "jest-mock-extended";
import { type extendedPrismaClient } from "~/services/prisma-service";

export type Context = {
  prisma: typeof extendedPrismaClient;
};

export type MockContext = {
  prisma: DeepMockProxy<typeof extendedPrismaClient>;
};
export const createMockContext = (): MockContext => {
  return {
    prisma: mockDeep<typeof extendedPrismaClient>(),
  };
};
