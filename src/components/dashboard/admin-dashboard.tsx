import { StatCard } from "@/components/ui/stat-card";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, humanizeStatus } from "@/lib/utils";
import type { getAdminOverviewData } from "@/lib/dashboard";

export function AdminDashboard({
  data,
}: {
  data: Awaited<ReturnType<typeof getAdminOverviewData>>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">System Administration</h1>
          <p className="text-sm text-ink-500">Users, departments, and system-wide activity.</p>
        </div>
        <LinkButton href="/requests/new" size="lg">
          New Request
        </LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total Requests" value={data.totalRequests} accent="navy" />
        <StatCard label="Total Users" value={data.totalUsers} />
        <StatCard label="Active Users" value={data.activeUsers} />
        <StatCard label="Departments" value={data.totalDepartments} />
        <StatCard label="Active Departments" value={data.activeDepartments} accent="gold" />
      </div>

      <div className="flex flex-wrap gap-3">
        <LinkButton href="/admin/users" variant="secondary">
          Manage Users
        </LinkButton>
        <LinkButton href="/departments" variant="secondary">
          Manage Departments
        </LinkButton>
        <LinkButton href="/admin/audit-logs" variant="secondary">
          View Audit Logs
        </LinkButton>
        <LinkButton href="/reports" variant="secondary">
          Reports
        </LinkButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Activity</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-line-200">
          {data.recentAudit.length === 0 && (
            <p className="py-4 text-sm text-ink-500">No activity recorded yet.</p>
          )}
          {data.recentAudit.map((entry) => (
            <div key={entry.id} className="py-2.5 text-sm">
              <p className="text-ink-900">
                <span className="font-medium">{entry.actor?.fullName ?? "System"}</span>{" "}
                <span className="text-ink-500">
                  {humanizeStatus(entry.action)} · {entry.entityType}
                </span>
              </p>
              <p className="text-xs text-ink-500">{formatDateTime(entry.createdAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
