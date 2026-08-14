import { Prisma } from '@prisma/client';

export const isPrismaKnownRequestError = (
  error: unknown,
  code?: string,
): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  (code === undefined || error.code === code);
