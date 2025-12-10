import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { env } from 'prisma/config';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: env('DATABASE_URL'),
});

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'development') {
  if (!global.prisma) {
    global.prisma = new PrismaClient({ adapter, log: ['error', 'warn'] });
  }
  prisma = global.prisma;
} else {
  prisma = new PrismaClient({ adapter });
}

export default prisma;
