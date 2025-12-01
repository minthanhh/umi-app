import { PrismaLibSql } from '@prisma/adapter-libsql';
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaLibSql({
  url: 'file:./dev.db',
});
const prisma = new PrismaClient({
  adapter,
});

export { prisma };
