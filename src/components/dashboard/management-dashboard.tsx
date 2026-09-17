import { StatCard } from "@/components/ui/stat-card";
import { LinkButton } from "@/components/ui/button";
import { RequestTable } from "@/components/requests/request-table";
import { DepartmentBarChart } from "@/components/charts/department-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { getManagementDashboardData } from "@/lib/dashboard";
import type { SessionUser } from "@/lib/session";

export function ManagementDashboard({
  user,
  data,
}: {
  user?: SessionUser;
  data: Awaited<ReturnType<typeof getManagementDashboardData>>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Organization Overview</h1>
          <p className="text-sm text-ink-500">Requests across all departments.</p>
        </div>
        {user && (
          <LinkButton href="/requests/new" size="lg">
            New Request
          </LinkButton>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Total" value={data.total} accent="navy" />
        <StatCard label="Pending" value={data.pending} />
        <StatCard label="In Progress" value={data.inProgress} accent="gold" />
        <StatCard label="Resolved" value={data.resolved} />
        <StatCard label="Closed" value={data.closed} />
        <StatCard label="Transferred" value={data.transferred} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentBarChart
            data={data.byDepartment.map((d) => ({ name: d.name, received: d.received }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-200 text-xs uppercase tracking-wide text-ink-500">
                <th className="py-2 pr-4 font-medium">Department</th>
                <th className="py-2 pr-4 font-medium">Total Received</th>
                <th className="py-2 pr-4 font-medium">Resolved</th>
                <th className="py-2 pr-4 font-medium">Pending</th>
                <th className="py-2 pr-4 font-medium">Avg. Resolution Time</th>
              </tr>
            </thead>
            <tbody>
              {data.byDepartment.map((dept) => (
                <tr key={dept.id} className="border-b border-line-200 last:border-0">
                  <td className="py-2 pr-4 font-medium text-ink-900">{dept.name}</td>
                  <td className="py-2 pr-4 text-ink-700">{dept.received}</td>
                  <td className="py-2 pr-4 text-ink-700">{dept.resolved}</td>
                  <td className="py-2 pr-4 text-ink-700">{dept.pending}</td>
                  <td className="py-2 pr-4 text-ink-700">
                    {dept.avgResolutionHours === null
                      ? "—"
                      : dept.avgResolutionHours < 24
                        ? `${dept.avgResolutionHours.toFixed(1)} hrs`
                        : `${(dept.avgResolutionHours / 24).toFixed(1)} days`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Recent Requests</h2>
        <RequestTable
          rows={data.recent}
          columns={{ requester: true, requestingDepartment: true, receivingDepartment: true }}
        />
      </div>
    </div>
  );
}
