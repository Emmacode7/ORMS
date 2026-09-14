import { StatCard } from "@/components/ui/stat-card";
import { LinkButton } from "@/components/ui/button";
import { RequestTable } from "@/components/requests/request-table";
import type { getStaffDashboardData } from "@/lib/dashboard";
import type { SessionUser } from "@/lib/session";

export function StaffDashboard({
  user,
  data,
}: {
  user: SessionUser;
  data: Awaited<ReturnType<typeof getStaffDashboardData>>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">
            Good day, {user.fullName.split(" ")[0]}
          </h1>
          <p className="text-sm text-ink-500">Here is a summary of your requests.</p>
        </div>
        <LinkButton href="/requests/new" size="lg">
          New Request
        </LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Requests" value={data.total} accent="navy" />
        <StatCard label="Pending" value={data.pending} />
        <StatCard label="In Progress" value={data.inProgress} accent="gold" />
        <StatCard label="Resolved" value={data.resolved} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Recent Requests</h2>
        <RequestTable
          rows={data.recent}
          columns={{ receivingDepartment: true }}
          emptyTitle="You haven't submitted any requests yet"
          emptyDescription="Requests you submit to any department will appear here."
        />
      </div>
    </div>
  );
}
