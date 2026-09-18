import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/enums";
import { getCurrentUser, type SessionUser } from "./session";

// Request/DB-aware auth helpers. The pure RBAC rules themselves (who can
// view/assign/transfer/etc.) live in ./permissions.ts, kept free of Prisma
// runtime and Next.js request context so they can be unit tested directly —
// re-exported here so existing call sites can keep importing from one place.
export {
  isDepartmentHead,
  isHeadOfDepartment,
  isOfficerInDepartment,
  canViewRequest,
  canActOnRequest,
  canManageRequest,
  canUpdateStatus,
  canCloseRequest,
  type PermissionUser,
  type MinimalRequest,
} from "./permissions";

/** Use at the top of a Server Component page/layout that requires login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Use at the top of a Server Component page that is restricted to specific
 * roles. Redirects to the dashboard (never reveals whether the page "exists"
 * to the wrong role) rather than showing a confirmable 403.
 */
export async function requireRole(
  user: SessionUser,
  allowed: Role[]
): Promise<void> {
  if (!allowed.includes(user.role)) {
    redirect("/dashboard");
  }
}
