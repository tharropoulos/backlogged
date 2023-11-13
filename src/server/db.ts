import { env } from "~/env.mjs";
import { extendedPrismaClient } from "~/services/prisma-service";

/**
 * Use the extended Prisma Client instead of the default one
 * @see https://github.com/prisma/prisma/discussions/20321
 */
const getExtendedClient = () => {
  return extendedPrismaClient;
};

type ExtendedPrismaClient = ReturnType<typeof getExtendedClient>;
const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? getExtendedClient();
// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
