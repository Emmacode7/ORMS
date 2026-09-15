import { requireUser, requireRole } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { DepartmentFormDialog } from "@/components/admin/department-form-dialog";
import type { User } from "@prisma/client";

const SUCCESS_MESSAGES: Record<string, string> = {
  created: "Department created.",
  updated: "Department updated.",
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Please check the form and try again.",
  duplicate: "A department with that name already exists.",
};

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireUser();
  await requireRole(user, ["MANAGEMENT", "SYSTEM_ADMIN"]);
  const { error, success } = await searchParams;

  const isAdmin = user.role === "SYSTEM_ADMIN";

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { members: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Departments</h1>
          <p className="text-sm text-ink-500">
            {isAdmin
              ? "Create, edit, and disable departments."
              : "Departments across the organization."}
          </p>
        </div>
        {isAdmin && <DepartmentFormDialog />}
      </div>

      {success && <Alert variant="success">{SUCCESS_MESSAGES[success] ?? "Done."}</Alert>}
      {error && <Alert variant="error">{ERROR_MESSAGES[error] ?? "Something went wrong."}</Alert>}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-200 bg-surface-muted text-xs uppercase tracking-wide text-ink-500">
                <th className="px-4 py-2.5 font-medium">Department</th>
                <th className="px-4 py-2.5 font-medium">Head</th>
                <th className="px-4 py-2.5 font-medium">Staff</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                {isAdmin && <th className="px-4 py-2.5 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => {
                const head = dept.members.find(
                  (m: User) => m.role === "DEPARTMENT_HEAD" && m.isActive
                );
                return (
                  <tr key={dept.id} className="border-b border-line-200 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-ink-900">{dept.name}</td>
                    <td className="px-4 py-2.5 text-ink-700">{head?.fullName ?? "Unassigned"}</td>
                    <td className="px-4 py-2.5 text-ink-700">{dept.members.length}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          dept.isActive
                            ? "text-status-resolved text-xs font-medium"
                            : "text-ink-500 text-xs font-medium"
                        }
                      >
                        {dept.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2.5">
                        <DepartmentFormDialog department={dept} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
