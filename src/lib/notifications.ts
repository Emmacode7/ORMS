import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function notify(
  db: DbClient,
  params: { userId: string; message: string; requestId?: string }
) {
  await db.notification.create({
    data: {
      userId: params.userId,
      message: params.message,
      requestId: params.requestId,
    },
  });
}

export async function notifyMany(
  db: DbClient,
  userIds: string[],
  message: string,
  requestId?: string
) {
  if (userIds.length === 0) return;
  await db.notification.createMany({
    data: userIds.map((userId) => ({ userId, message, requestId })),
  });
}
