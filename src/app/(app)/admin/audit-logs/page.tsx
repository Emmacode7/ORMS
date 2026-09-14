import { requireUser, requireRole } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, humanizeStatus } from "@/lib/utils";

export default async function AuditLogsPage() {
  const user = await requireUser();
  await requireRole(user, ["SYSTEM_ADMIN"]);

  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Audit Logs</h1>
        <p className="text-sm text-ink-500">
          Read-only system record of important actions. Showing the latest {logs.length} entries.
        </p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-200 bg-surface-muted text-xs uppercase tracking-wide text-ink-500">
                <th className="px-4 py-2.5 font-medium">Timestamp</th>
                <th className="px-4 py-2.5 font-medium">Actor</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Entity</th>
                <th className="px-4 py-2.5 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                let details = "";
                if (log.metadata) {
                  try {
                    const parsed = JSON.parse(log.metadata) as Record<string, unknown>;
                    details = Object.entries(parsed)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ");
                  } catch {
                    details = log.metadata;
                  }
                }
                return (
                  <tr key={log.id} className="border-b border-line-200 last:border-0 align-top">
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-ink-900">{log.actor?.fullName ?? "System"}</td>
                    <td className="px-4 py-2.5 text-ink-700">{humanizeStatus(log.action)}</td>
                    <td className="px-4 py-2.5 text-ink-700">
                      {log.entityType}
                      {log.entityId ? ` #${log.entityId.slice(-6)}` : ""}
                    </td>
                    <td className="px-4 py-2.5 text-ink-500">{details}</td>
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
