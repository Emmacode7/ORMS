import { StatCard } from "@/components/ui/stat-card";
import { RequestTable } from "@/components/requests/request-table";
import type { getOfficerDashboardData } from "@/lib/dashboard";
import type { SessionUser } from "@/lib/session";

export function OfficerDashboard({
  user,
  data,
}: {
  user: SessionUser;
  data: Awaited<ReturnType<typeof getOfficerDashboardData>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">
          Good day, {user.fullName.split(" ")[0]}
        </h1>
        <p className="text-sm text-ink-500">Requests currently assigned to you.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned" value={data.assigned} accent="navy" />
        <StatCard label="In Progress" value={data.inProgress} accent="gold" />
        <StatCard label="Awaiting Information" value={data.awaiting} />
        <StatCard label="Resolved" value={data.resolved} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Recent Assignments</h2>
        <RequestTable
          rows={data.recent}
          columns={{ requester: true, requestingDepartment: true }}
          emptyTitle="No requests assigned to you yet"
        />
      </div>
    </div>
  );
}
