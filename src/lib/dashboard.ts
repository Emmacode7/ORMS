import "server-only";
import { prisma } from "./db";
import type { SessionUser } from "./session";

const OPEN_STATUSES = [
  "SUBMITTED",
  "RECEIVED",
  "ASSIGNED",
  "IN_PROGRESS",
  "AWAITING_INFORMATION",
] as const;

export async function getStaffDashboardData(user: SessionUser) {
  const where = { requesterId: user.id };

  const [total, pending, inProgress, resolved, closed, recent] = await Promise.all([
    prisma.request.count({ where }),
    prisma.request.count({ where: { ...where, status: { in: ["SUBMITTED", "RECEIVED", "ASSIGNED"] } } }),
    prisma.request.count({ where: { ...where, status: { in: ["IN_PROGRESS", "AWAITING_INFORMATION"] } } }),
    prisma.request.count({ where: { ...where, status: "RESOLVED" } }),
    prisma.request.count({ where: { ...where, status: "CLOSED" } }),
    prisma.request.findMany({
      where,
      include: { receivingDepartment: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return { total, pending, inProgress, resolved, closed, recent };
}

export async function getOfficerDashboardData(user: SessionUser) {
  const where = { assignedOfficerId: user.id };

  const [assigned, inProgress, awaiting, resolved, recent] = await Promise.all([
    prisma.request.count({ where: { ...where, status: "ASSIGNED" } }),
    prisma.request.count({ where: { ...where, status: "IN_PROGRESS" } }),
    prisma.request.count({ where: { ...where, status: "AWAITING_INFORMATION" } }),
    prisma.request.count({ where: { ...where, status: "RESOLVED" } }),
    prisma.request.findMany({
      where,
      include: { requester: true, requestingDepartment: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return { assigned, inProgress, awaiting, resolved, recent };
}

export async function getHeadDashboardData(user: SessionUser) {
  const departmentId = user.departmentId ?? "__none__";
  const where = { receivingDepartmentId: departmentId };
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  // Overdue is a simple heuristic for this prototype (no SLA/due-date engine
  // yet — see README "Future work"): a high/urgent request still open after
  // 48 hours of its creation.
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [newCount, unassigned, assigned, inProgress, awaiting, resolved, overdue, recent] =
    await Promise.all([
      prisma.request.count({ where: { ...where, createdAt: { gte: oneDayAgo } } }),
      prisma.request.count({ where: { ...where, status: "RECEIVED" } }),
      prisma.request.count({ where: { ...where, status: "ASSIGNED" } }),
      prisma.request.count({ where: { ...where, status: "IN_PROGRESS" } }),
      prisma.request.count({ where: { ...where, status: "AWAITING_INFORMATION" } }),
      prisma.request.count({ where: { ...where, status: "RESOLVED" } }),
      prisma.request.count({
        where: {
          ...where,
          priority: { in: ["HIGH", "URGENT"] },
          status: { in: [...OPEN_STATUSES] },
          createdAt: { lt: twoDaysAgo },
        },
      }),
      prisma.request.findMany({
        where,
        include: { requester: true, assignedOfficer: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  return { newCount, unassigned, assigned, inProgress, awaiting, resolved, overdue, recent };
}

export async function getManagementDashboardData() {
  const [total, pending, inProgress, resolved, closed, transferredIds, departments, recent] =
    await Promise.all([
      prisma.request.count(),
      prisma.request.count({ where: { status: { in: ["SUBMITTED", "RECEIVED", "ASSIGNED"] } } }),
      prisma.request.count({ where: { status: { in: ["IN_PROGRESS", "AWAITING_INFORMATION"] } } }),
      prisma.request.count({ where: { status: "RESOLVED" } }),
      prisma.request.count({ where: { status: "CLOSED" } }),
      prisma.requestTransfer.findMany({ select: { requestId: true }, distinct: ["requestId"] }),
      prisma.department.findMany({ where: { isActive: true } }),
      prisma.request.findMany({
        include: { requester: true, requestingDepartment: true, receivingDepartment: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  const byDepartment = await Promise.all(
    departments.map(async (dept) => {
      const [received, resolvedReqs, pendingCount] = await Promise.all([
        prisma.request.count({ where: { receivingDepartmentId: dept.id } }),
        prisma.request.findMany({
          where: { receivingDepartmentId: dept.id, status: "RESOLVED", resolvedAt: { not: null } },
          select: { createdAt: true, resolvedAt: true },
        }),
        prisma.request.count({
          where: { receivingDepartmentId: dept.id, status: { in: [...OPEN_STATUSES] } },
        }),
      ]);

      const avgResolutionHours =
        resolvedReqs.length > 0
          ? resolvedReqs.reduce((sum, r) => {
              const hours =
                (r.resolvedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
              return sum + hours;
            }, 0) / resolvedReqs.length
          : null;

      return {
        id: dept.id,
        name: dept.name,
        received,
        resolved: resolvedReqs.length,
        pending: pendingCount,
        avgResolutionHours,
      };
    })
  );

  return {
    total,
    pending,
    inProgress,
    resolved,
    closed,
    transferred: transferredIds.length,
    byDepartment: byDepartment.sort((a, b) => b.received - a.received),
    recent,
  };
}

export async function getAdminOverviewData() {
  const [totalUsers, activeUsers, totalDepartments, activeDepartments, totalRequests, recentAudit] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.department.count(),
      prisma.department.count({ where: { isActive: true } }),
      prisma.request.count(),
      prisma.auditLog.findMany({
        include: { actor: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  return {
    totalUsers,
    activeUsers,
    totalDepartments,
    activeDepartments,
    totalRequests,
    recentAudit,
  };
}
