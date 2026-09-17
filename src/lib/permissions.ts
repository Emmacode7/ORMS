import type { Role } from "@prisma/client";

// Pure permission-check functions with no dependency on Prisma's runtime
// client or Next.js request context — safe to unit test in isolation.
// (src/lib/authorization.ts holds the request/DB-aware helpers that build
// on top of these: requireUser, requireRole, etc.)

export type PermissionUser = {
  id: string;
  role: Role;
  departmentId: string | null;
};

export function isDepartmentHead(user: PermissionUser): boolean {
  return user.role === "DEPARTMENT_HEAD" && !!user.departmentId;
}

export function isHeadOfDepartment(
  user: PermissionUser,
  departmentId: string
): boolean {
  return user.role === "DEPARTMENT_HEAD" && user.departmentId === departmentId;
}

export function isOfficerInDepartment(
  user: PermissionUser,
  departmentId: string
): boolean {
  return (
    user.role === "DEPARTMENT_OFFICER" && user.departmentId === departmentId
  );
}

export type MinimalRequest = {
  requesterId: string;
  assignedOfficerId: string | null;
  receivingDepartmentId: string;
  requestingDepartmentId: string;
};

/** Whether this user is allowed to view this request's detail page. */
export function canViewRequest(
  user: PermissionUser,
  request: MinimalRequest
): boolean {
  switch (user.role) {
    case "SYSTEM_ADMIN":
    case "MANAGEMENT":
      return true;
    case "STAFF":
      return request.requesterId === user.id;
    case "DEPARTMENT_OFFICER":
      return request.assignedOfficerId === user.id;
    case "DEPARTMENT_HEAD":
      return (
        request.receivingDepartmentId === user.departmentId ||
        request.assignedOfficerId === user.id
      );
    default:
      return false;
  }
}

/**
 * Whether this user may comment on / attach files to this request.
 * Management is read-only oversight everywhere *except* requests routed to
 * their own department (Management is itself one of the seeded departments
 * and can receive requests directly, e.g. "approval needed" requests) —
 * there they can act on it the same way a Department Head would.
 */
export function canActOnRequest(
  user: PermissionUser,
  request: MinimalRequest
): boolean {
  if (user.role === "SYSTEM_ADMIN") return true;
  if (user.role === "MANAGEMENT")
    return request.receivingDepartmentId === user.departmentId;
  if (user.role === "STAFF") return request.requesterId === user.id;
  if (user.role === "DEPARTMENT_OFFICER")
    return request.assignedOfficerId === user.id;
  if (user.role === "DEPARTMENT_HEAD")
    return request.receivingDepartmentId === user.departmentId;
  return false;
}

/**
 * Whether this user may assign or transfer this request. Same rule as
 * above: Management can manage requests sent to their own department, but
 * not other departments' requests (oversight there stays read-only).
 */
export function canManageRequest(
  user: PermissionUser,
  request: MinimalRequest
): boolean {
  if (user.role === "SYSTEM_ADMIN") return true;
  return (
    (user.role === "DEPARTMENT_HEAD" || user.role === "MANAGEMENT") &&
    request.receivingDepartmentId === user.departmentId
  );
}

/** Whether this user may progress the officer-side status of this request. */
export function canUpdateStatus(
  user: PermissionUser,
  request: MinimalRequest
): boolean {
  if (user.role === "SYSTEM_ADMIN") return true;
  if (
    (user.role === "DEPARTMENT_HEAD" || user.role === "MANAGEMENT") &&
    request.receivingDepartmentId === user.departmentId
  )
    return true;
  if (user.role === "DEPARTMENT_OFFICER")
    return request.assignedOfficerId === user.id;
  return false;
}

/** Only the original requester (or an admin) may close a resolved request. */
export function canCloseRequest(
  user: PermissionUser,
  request: MinimalRequest
): boolean {
  if (user.role === "SYSTEM_ADMIN") return true;
  return request.requesterId === user.id;
}
