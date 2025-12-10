import '@umijs/max/typings';
import { PrismaClient } from 'generated/prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}
