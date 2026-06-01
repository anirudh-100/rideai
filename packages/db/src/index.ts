/**
 * @rideai/db — the generated Prisma client as a process-wide singleton, plus a
 * re-export of all Prisma model types and enums.
 *
 * Run `npm run db:generate` after install / schema changes so `@prisma/client`
 * exists before this module is imported.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export Prisma's generated types, enums and the `Prisma` namespace so
// consumers can `import { Prisma, Platform, User } from '@rideai/db'`.
export * from '@prisma/client';

export default prisma;
