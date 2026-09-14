import { requireUser } from "@/lib/authorization";
import { getVisibleRequests } from "@/lib/requests";
import { prisma } from "@/lib/db";
import { RequestTable } from "@/components/requests/request-table";
import { inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Priority, RequestStatus } from "@prisma/client";

const STATUSES: RequestStatus[] = [
  "SUBMITTED",
  "RECEIVED",
  "ASSIGNED",
  "IN_PROGRESS",
  "AWAITING_INFORMATION",
  "RESOLVED",
  "CLOSED",
  "TRANSFERRED",
];
const PRIORITIES: Priority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    department?: string;
    officer?: string;
    q?: string;
  }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const rows = await getVisibleRequests(user, {
    status: params.status as RequestStatus | undefined,
    priority: params.priority as Priority | undefined,
    departmentId: params.department,
    assignedOfficerId: params.officer,
    search: params.q,
  });

  const showDepartmentFilter = user.role === "MANAGEMENT" || user.role === "SYSTEM_ADMIN";
  const showOfficerFilter = user.role === "DEPARTMENT_HEAD";

  const [departments, officers] = await Promise.all([
    showDepartmentFilter
      ? prisma.department.findMany({ orderBy: { name: "asc" } })
      : Promise.resolve([]),
    showOfficerFilter
      ? prisma.user.findMany({
          where: { departmentId: user.departmentId ?? "__none__", isActive: true },
          orderBy: { fullName: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const title =
    user.role === "STAFF"
      ? "My Requests"
      : user.role === "DEPARTMENT_OFFICER"
        ? "Assigned to Me"
        : user.role === "DEPARTMENT_HEAD"
          ? `${user.department?.name ?? "Department"} Requests`
          : "All Requests";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
        <p className="text-sm text-ink-500">{rows.length} request{rows.length === 1 ? "" : "s"}</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-md border border-line-300 bg-white p-4">
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-xs font-medium text-ink-700">Search</label>
          <input
            type="text"
            name="q"
            defaultValue={params.q}
            placeholder="Reference or subject"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-700">Status</label>
          <select name="status" defaultValue={params.status ?? ""} className={inputClass}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-700">Priority</label>
          <select name="priority" defaultValue={params.priority ?? ""} className={inputClass}>
            <option value="">All</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        {showDepartmentFilter && (
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-700">Department</label>
            <select name="department" defaultValue={params.department ?? ""} className={inputClass}>
              <option value="">All</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {showOfficerFilter && (
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-700">Officer</label>
            <select name="officer" defaultValue={params.officer ?? ""} className={inputClass}>
              <option value="">All</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.fullName}
                </option>
              ))}
            </select>
          </div>
        )}
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>

      <RequestTable
        rows={rows}
        columns={{
          requester: user.role !== "STAFF",
          requestingDepartment: user.role === "MANAGEMENT" || user.role === "SYSTEM_ADMIN" || user.role === "DEPARTMENT_HEAD",
          receivingDepartment: user.role === "STAFF" || user.role === "MANAGEMENT" || user.role === "SYSTEM_ADMIN",
          assignedOfficer: user.role === "DEPARTMENT_HEAD" || user.role === "MANAGEMENT" || user.role === "SYSTEM_ADMIN",
        }}
      />
    </div>
  );
}
