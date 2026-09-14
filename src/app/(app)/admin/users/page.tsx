import { requireUser, requireRole } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatDate, humanizeRole } from "@/lib/utils";
import { UserFormDialog } from "@/components/admin/user-form-dialog";
import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";

const SUCCESS_MESSAGES: Record<string, string> = {
  created: "User created.",
  updated: "User updated.",
  password_reset: "Password reset successfully.",
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Please check the form and try again.",
  department_required: "Select a department for this role.",
  username_taken: "That username is already in use.",
  staffid_taken: "That staff ID is already in use.",
  head_exists: "That department already has an active head. Reassign or disable them first.",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireUser();
  await requireRole(user, ["SYSTEM_ADMIN"]);
  const { error, success } = await searchParams;

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      include: { department: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Users</h1>
          <p className="text-sm text-ink-500">{users.length} accounts</p>
        </div>
        <UserFormDialog departments={departments} />
      </div>

      {success && <Alert variant="success">{SUCCESS_MESSAGES[success] ?? "Done."}</Alert>}
      {error && <Alert variant="error">{ERROR_MESSAGES[error] ?? "Something went wrong."}</Alert>}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-200 bg-surface-muted text-xs uppercase tracking-wide text-ink-500">
                <th className="px-4 py-2.5 font-medium">Staff ID</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Username</th>
                <th className="px-4 py-2.5 font-medium">Department</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
                <th className="px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line-200 last:border-0">
                  <td className="px-4 py-2.5 text-ink-700">{u.staffId}</td>
                  <td className="px-4 py-2.5 font-medium text-ink-900">{u.fullName}</td>
                  <td className="px-4 py-2.5 text-ink-700">{u.username}</td>
                  <td className="px-4 py-2.5 text-ink-700">{u.department?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-700">{humanizeRole(u.role)}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        u.isActive
                          ? "text-status-resolved text-xs font-medium"
                          : "text-ink-500 text-xs font-medium"
                      }
                    >
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-2">
                      <UserFormDialog departments={departments} user={u} />
                      <ResetPasswordDialog userId={u.id} fullName={u.fullName} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
