import "server-only";
import { prisma } from "./db";
import { nextReferenceNumber } from "./reference-number";
import { logAudit } from "./audit";
import { notify, notifyMany } from "./notifications";
import {
  canActOnRequest,
  canCloseRequest,
  canManageRequest,
  canUpdateStatus,
  canViewRequest,
} from "./authorization";
import type { SessionUser } from "./session";
import type { Priority, RequestStatus, Prisma } from "@prisma/client";

export const requestDetailInclude = {
  requester: true,
  requestingDepartment: true,
  receivingDepartment: true,
  assignedOfficer: true,
  comments: { include: { author: true }, orderBy: { createdAt: "asc" as const } },
  attachments: { include: { uploadedBy: true }, orderBy: { createdAt: "asc" as const } },
  statusHistory: { include: { changedBy: true }, orderBy: { createdAt: "asc" as const } },
  transfers: {
    include: { fromDepartment: true, toDepartment: true, transferredBy: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function activeDepartmentHeads(
  departmentId: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  return tx.user.findMany({
    where: { departmentId, role: "DEPARTMENT_HEAD", isActive: true },
  });
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createRequest(
  user: SessionUser,
  input: {
    receivingDepartmentId: string;
    subject: string;
    details: string;
    priority: Priority;
  }
): Promise<ActionResult<{ id: string; referenceNumber: string }>> {
  if (!user.departmentId) {
    return {
      ok: false,
      error: "Your account has no department on file. Contact an administrator.",
    };
  }

  const receivingDepartment = await prisma.department.findUnique({
    where: { id: input.receivingDepartmentId },
  });
  if (!receivingDepartment || !receivingDepartment.isActive) {
    return { ok: false, error: "Select a valid, active receiving department." };
  }

  const result = await prisma.$transaction(async (tx) => {
    const referenceNumber = await nextReferenceNumber(tx);

    const request = await tx.request.create({
      data: {
        referenceNumber,
        subject: input.subject,
        details: input.details,
        priority: input.priority,
        status: "RECEIVED",
        requesterId: user.id,
        requestingDepartmentId: user.departmentId!,
        receivingDepartmentId: input.receivingDepartmentId,
      },
    });

    await tx.requestStatusHistory.createMany({
      data: [
        {
          requestId: request.id,
          status: "SUBMITTED",
          changedById: user.id,
        },
        {
          requestId: request.id,
          status: "RECEIVED",
          note: `Received by ${receivingDepartment.name}`,
          changedById: user.id,
        },
      ],
    });

    await logAudit(tx, {
      actorId: user.id,
      action: "REQUEST_CREATED",
      entityType: "Request",
      entityId: request.id,
      metadata: { referenceNumber, receivingDepartment: receivingDepartment.name },
    });

    await notify(tx, {
      userId: user.id,
      requestId: request.id,
      message: `Your request ${referenceNumber} has been submitted successfully.`,
    });

    const heads = await activeDepartmentHeads(input.receivingDepartmentId, tx);
    await notifyMany(
      tx,
      heads.map((h) => h.id),
      `${receivingDepartment.name} has received request ${referenceNumber}.`,
      request.id
    );

    return request;
  });

  return { ok: true, data: { id: result.id, referenceNumber: result.referenceNumber } };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export type RequestFilters = {
  status?: RequestStatus;
  priority?: Priority;
  departmentId?: string; // requesting-department filter (management/admin)
  assignedOfficerId?: string;
  search?: string;
};

export async function getVisibleRequests(
  user: SessionUser,
  filters: RequestFilters = {}
) {
  const where: Record<string, unknown> = {};

  switch (user.role) {
    case "STAFF":
      where.requesterId = user.id;
      break;
    case "DEPARTMENT_OFFICER":
      where.assignedOfficerId = user.id;
      break;
    case "DEPARTMENT_HEAD":
      where.receivingDepartmentId = user.departmentId ?? "__none__";
      break;
    case "MANAGEMENT":
    case "SYSTEM_ADMIN":
      break;
  }

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assignedOfficerId) where.assignedOfficerId = filters.assignedOfficerId;
  // Department filter targets the *receiving* department (who currently
  // holds the request) — most useful for management/admin oversight of
  // departmental workload. Department Heads are already scoped above.
  if (filters.departmentId) where.receivingDepartmentId = filters.departmentId;
  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      // Reference number, subject, requester name, and department name —
      // per spec section 22. Results still respect the role scoping above.
      where.OR = [
        { referenceNumber: { contains: term } },
        { subject: { contains: term } },
        { requester: { fullName: { contains: term } } },
        { requestingDepartment: { name: { contains: term } } },
        { receivingDepartment: { name: { contains: term } } },
      ];
    }
  }

  return prisma.request.findMany({
    where,
    include: {
      requester: true,
      requestingDepartment: true,
      receivingDepartment: true,
      assignedOfficer: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/** Fetch a request for viewing. Returns null if it doesn't exist OR the user
 * isn't allowed to see it — callers should render a generic "not found" in
 * both cases, so unauthorized access never confirms a record's existence. */
export async function getRequestForViewing(user: SessionUser, requestId: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: requestDetailInclude,
  });
  if (!request) return null;
  if (!canViewRequest(user, request)) return null;
  return request;
}

// ---------------------------------------------------------------------------
// Assign / reassign
// ---------------------------------------------------------------------------

export async function assignRequest(
  user: SessionUser,
  input: { requestId: string; assignedToId: string; note?: string }
): Promise<ActionResult> {
  const request = await prisma.request.findUnique({ where: { id: input.requestId } });
  if (!request) return { ok: false, error: "Request not found." };
  if (!canManageRequest(user, request)) {
    return { ok: false, error: "You do not have permission to perform this action." };
  }
  if (["RESOLVED", "CLOSED"].includes(request.status)) {
    return { ok: false, error: "This request is already resolved or closed." };
  }

  const officer = await prisma.user.findUnique({ where: { id: input.assignedToId } });
  if (
    !officer ||
    !officer.isActive ||
    officer.departmentId !== request.receivingDepartmentId ||
    !["DEPARTMENT_OFFICER", "DEPARTMENT_HEAD"].includes(officer.role)
  ) {
    return { ok: false, error: "Select a valid officer from this department." };
  }

  const isReassignment = !!request.assignedOfficerId;

  await prisma.$transaction(async (tx) => {
    await tx.request.update({
      where: { id: request.id },
      data: { assignedOfficerId: officer.id, status: "ASSIGNED" },
    });

    await tx.requestAssignment.create({
      data: {
        requestId: request.id,
        assignedToId: officer.id,
        assignedById: user.id,
        note: input.note,
      },
    });

    await tx.requestStatusHistory.create({
      data: {
        requestId: request.id,
        status: "ASSIGNED",
        note: `Assigned to ${officer.fullName}${input.note ? ` — ${input.note}` : ""}`,
        changedById: user.id,
      },
    });

    await logAudit(tx, {
      actorId: user.id,
      action: isReassignment ? "REQUEST_REASSIGNED" : "REQUEST_ASSIGNED",
      entityType: "Request",
      entityId: request.id,
      metadata: { assignedTo: officer.fullName },
    });

    await notify(tx, {
      userId: officer.id,
      requestId: request.id,
      message: `Request ${request.referenceNumber} has been assigned to you.`,
    });

    await notify(tx, {
      userId: request.requesterId,
      requestId: request.id,
      message: `Your request ${request.referenceNumber} has been assigned to an officer.`,
    });
  });

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Transfer
// ---------------------------------------------------------------------------

export async function transferRequest(
  user: SessionUser,
  input: { requestId: string; toDepartmentId: string; reason: string }
): Promise<ActionResult> {
  const request = await prisma.request.findUnique({
    where: { id: input.requestId },
    include: { receivingDepartment: true },
  });
  if (!request) return { ok: false, error: "Request not found." };
  if (!canManageRequest(user, request)) {
    return { ok: false, error: "You do not have permission to perform this action." };
  }
  if (["RESOLVED", "CLOSED"].includes(request.status)) {
    return { ok: false, error: "This request is already resolved or closed." };
  }
  if (input.toDepartmentId === request.receivingDepartmentId) {
    return { ok: false, error: "Select a different department to transfer to." };
  }

  const toDepartment = await prisma.department.findUnique({
    where: { id: input.toDepartmentId },
  });
  if (!toDepartment || !toDepartment.isActive) {
    return { ok: false, error: "Select a valid, active department." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.requestTransfer.create({
      data: {
        requestId: request.id,
        fromDepartmentId: request.receivingDepartmentId,
        toDepartmentId: toDepartment.id,
        reason: input.reason,
        transferredById: user.id,
      },
    });

    await tx.request.update({
      where: { id: request.id },
      data: {
        receivingDepartmentId: toDepartment.id,
        assignedOfficerId: null,
        status: "RECEIVED",
      },
    });

    await tx.requestStatusHistory.createMany({
      data: [
        {
          requestId: request.id,
          status: "TRANSFERRED",
          note: `Transferred from ${request.receivingDepartment.name} to ${toDepartment.name} — ${input.reason}`,
          changedById: user.id,
        },
        {
          requestId: request.id,
          status: "RECEIVED",
          note: `Received by ${toDepartment.name}`,
          changedById: user.id,
        },
      ],
    });

    await logAudit(tx, {
      actorId: user.id,
      action: "REQUEST_TRANSFERRED",
      entityType: "Request",
      entityId: request.id,
      metadata: {
        from: request.receivingDepartment.name,
        to: toDepartment.name,
        reason: input.reason,
      },
    });

    await notify(tx, {
      userId: request.requesterId,
      requestId: request.id,
      message: `Your request ${request.referenceNumber} has been transferred from ${request.receivingDepartment.name} to ${toDepartment.name}.`,
    });

    const heads = await activeDepartmentHeads(toDepartment.id, tx);
    await notifyMany(
      tx,
      heads.map((h) => h.id),
      `${toDepartment.name} has received transferred request ${request.referenceNumber}.`,
      request.id
    );
  });

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Status updates
// ---------------------------------------------------------------------------

const OFFICER_TRANSITIONS: Record<string, RequestStatus[]> = {
  ASSIGNED: ["IN_PROGRESS", "RESOLVED"],
  IN_PROGRESS: ["AWAITING_INFORMATION", "RESOLVED"],
  AWAITING_INFORMATION: ["IN_PROGRESS", "RESOLVED"],
};

export async function updateRequestStatus(
  user: SessionUser,
  input: { requestId: string; status: RequestStatus; note?: string }
): Promise<ActionResult> {
  const request = await prisma.request.findUnique({ where: { id: input.requestId } });
  if (!request) return { ok: false, error: "Request not found." };
  if (!canUpdateStatus(user, request)) {
    return { ok: false, error: "You do not have permission to perform this action." };
  }

  const allowed = OFFICER_TRANSITIONS[request.status] ?? [];
  if (!allowed.includes(input.status)) {
    return {
      ok: false,
      error: `Cannot move a request from ${request.status} to ${input.status}.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.request.update({
      where: { id: request.id },
      data: {
        status: input.status,
        resolvedAt: input.status === "RESOLVED" ? new Date() : request.resolvedAt,
      },
    });

    await tx.requestStatusHistory.create({
      data: {
        requestId: request.id,
        status: input.status,
        note: input.note,
        changedById: user.id,
      },
    });

    await logAudit(tx, {
      actorId: user.id,
      action: input.status === "RESOLVED" ? "REQUEST_RESOLVED" : "REQUEST_STATUS_CHANGED",
      entityType: "Request",
      entityId: request.id,
      metadata: { status: input.status },
    });

    if (input.status === "RESOLVED") {
      await notify(tx, {
        userId: request.requesterId,
        requestId: request.id,
        message: `Request ${request.referenceNumber} has been resolved. Please confirm to close it.`,
      });
    } else {
      await notify(tx, {
        userId: request.requesterId,
        requestId: request.id,
        message: `Request ${request.referenceNumber} status changed to ${input.status.replace("_", " ").toLowerCase()}.`,
      });
    }
  });

  return { ok: true, data: undefined };
}

export async function closeRequest(
  user: SessionUser,
  requestId: string
): Promise<ActionResult> {
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) return { ok: false, error: "Request not found." };
  if (!canCloseRequest(user, request)) {
    return { ok: false, error: "You do not have permission to perform this action." };
  }
  if (request.status !== "RESOLVED") {
    return { ok: false, error: "Only a resolved request can be closed." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.request.update({
      where: { id: request.id },
      data: { status: "CLOSED", closedAt: new Date() },
    });

    await tx.requestStatusHistory.create({
      data: { requestId: request.id, status: "CLOSED", changedById: user.id },
    });

    await logAudit(tx, {
      actorId: user.id,
      action: "REQUEST_CLOSED",
      entityType: "Request",
      entityId: request.id,
    });

    if (request.assignedOfficerId) {
      await notify(tx, {
        userId: request.assignedOfficerId,
        requestId: request.id,
        message: `Request ${request.referenceNumber} was confirmed and closed by the requester.`,
      });
    }
  });

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Comments & attachments
// ---------------------------------------------------------------------------

export async function addComment(
  user: SessionUser,
  input: { requestId: string; body: string }
): Promise<ActionResult> {
  const request = await prisma.request.findUnique({ where: { id: input.requestId } });
  if (!request) return { ok: false, error: "Request not found." };
  if (!canActOnRequest(user, request)) {
    return { ok: false, error: "You do not have permission to perform this action." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.comment.create({
      data: { requestId: request.id, authorId: user.id, body: input.body },
    });

    await logAudit(tx, {
      actorId: user.id,
      action: "REQUEST_COMMENTED",
      entityType: "Request",
      entityId: request.id,
    });

    const notifyTargets = new Set<string>();
    if (request.requesterId !== user.id) notifyTargets.add(request.requesterId);
    if (request.assignedOfficerId && request.assignedOfficerId !== user.id) {
      notifyTargets.add(request.assignedOfficerId);
    }

    await notifyMany(
      tx,
      Array.from(notifyTargets),
      `New comment on request ${request.referenceNumber}.`,
      request.id
    );
  });

  return { ok: true, data: undefined };
}

export async function addAttachment(
  user: SessionUser,
  input: {
    requestId: string;
    fileName: string;
    storedName: string;
    mimeType: string;
    size: number;
  }
): Promise<ActionResult> {
  const request = await prisma.request.findUnique({ where: { id: input.requestId } });
  if (!request) return { ok: false, error: "Request not found." };
  if (!canActOnRequest(user, request)) {
    return { ok: false, error: "You do not have permission to perform this action." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.attachment.create({
      data: {
        requestId: request.id,
        fileName: input.fileName,
        storedName: input.storedName,
        mimeType: input.mimeType,
        size: input.size,
        uploadedById: user.id,
      },
    });

    await logAudit(tx, {
      actorId: user.id,
      action: "REQUEST_ATTACHMENT_ADDED",
      entityType: "Request",
      entityId: request.id,
      metadata: { fileName: input.fileName },
    });
  });

  return { ok: true, data: undefined };
}
