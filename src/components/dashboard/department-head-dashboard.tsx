import { StatCard } from "@/components/ui/stat-card";
import { LinkButton } from "@/components/ui/button";
import { RequestTable } from "@/components/requests/request-table";
import type { getHeadDashboardData } from "@/lib/dashboard";
import type { SessionUser } from "@/lib/session";

export function DepartmentHeadDashboard({
  user,
  data,
}: {
  user: SessionUser;
  data: Awaited<ReturnType<typeof getHeadDashboardData>>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">
            {user.department?.name ?? "Department"} Dashboard
          </h1>
          <p className="text-sm text-ink-500">
            Requests directed to your department, {user.fullName.split(" ")[0]}.
          </p>
        </div>
        <LinkButton href="/requests/new" size="lg">
          New Request
        </LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New (24h)" value={data.newCount} accent="navy" />
        <StatCard label="Unassigned" value={data.unassigned} accent="gold" />
        <StatCard label="Assigned" value={data.assigned} />
        <StatCard label="In Progress" value={data.inProgress} />
        <StatCard label="Awaiting Information" value={data.awaiting} />
        <StatCard label="Resolved" value={data.resolved} />
        <StatCard label="Overdue" value={data.overdue} accent="gold" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Recent Requests</h2>
        <RequestTable
          rows={data.recent}
          columns={{ requester: true, assignedOfficer: true }}
          emptyTitle="No requests have reached your department yet"
        />
      </div>
    </div>
  );
}
