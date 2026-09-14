import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type AuditAction =
  | "USER_LOGIN"
  | "USER_LOGIN_FAILED"
  | "USER_LOGOUT"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_PASSWORD_RESET"
  | "DEPARTMENT_CREATED"
  | "DEPARTMENT_UPDATED"
  | "REQUEST_CREATED"
  | "REQUEST_ASSIGNED"
  | "REQUEST_REASSIGNED"
  | "REQUEST_STATUS_CHANGED"
  | "REQUEST_TRANSFERRED"
  | "REQUEST_RESOLVED"
  | "REQUEST_CLOSED"
  | "REQUEST_COMMENTED"
  | "REQUEST_ATTACHMENT_ADDED";

export async function logAudit(
  db: DbClient,
  entry: {
    actorId: string | null;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await db.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    },
  });
}
