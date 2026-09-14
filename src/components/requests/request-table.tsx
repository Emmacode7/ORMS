import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export type RequestRow = {
  id: string;
  referenceNumber: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: Date;
  requester?: { fullName: string } | null;
  requestingDepartment?: { name: string } | null;
  receivingDepartment?: { name: string } | null;
  assignedOfficer?: { fullName: string } | null;
};

export function RequestTable({
  rows,
  columns = {},
  emptyTitle = "No requests found",
  emptyDescription,
}: {
  rows: RequestRow[];
  columns?: {
    requester?: boolean;
    requestingDepartment?: boolean;
    receivingDepartment?: boolean;
    assignedOfficer?: boolean;
  };
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-line-300 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-line-200 bg-surface-muted text-xs uppercase tracking-wide text-ink-500">
            <th className="px-4 py-2.5 font-medium">Reference</th>
            <th className="px-4 py-2.5 font-medium">Subject</th>
            {columns.requester && <th className="px-4 py-2.5 font-medium">Requester</th>}
            {columns.requestingDepartment && (
              <th className="px-4 py-2.5 font-medium">From</th>
            )}
            {columns.receivingDepartment && (
              <th className="px-4 py-2.5 font-medium">To</th>
            )}
            {columns.assignedOfficer && (
              <th className="px-4 py-2.5 font-medium">Assigned To</th>
            )}
            <th className="px-4 py-2.5 font-medium">Priority</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line-200 last:border-0 hover:bg-surface-muted">
              <td className="px-4 py-2.5">
                <Link
                  href={`/requests/${row.id}`}
                  className="font-medium text-navy-700 hover:underline"
                >
                  {row.referenceNumber}
                </Link>
              </td>
              <td className="max-w-[240px] truncate px-4 py-2.5 text-ink-700">{row.subject}</td>
              {columns.requester && (
                <td className="px-4 py-2.5 text-ink-700">{row.requester?.fullName ?? "—"}</td>
              )}
              {columns.requestingDepartment && (
                <td className="px-4 py-2.5 text-ink-700">
                  {row.requestingDepartment?.name ?? "—"}
                </td>
              )}
              {columns.receivingDepartment && (
                <td className="px-4 py-2.5 text-ink-700">
                  {row.receivingDepartment?.name ?? "—"}
                </td>
              )}
              {columns.assignedOfficer && (
                <td className="px-4 py-2.5 text-ink-700">
                  {row.assignedOfficer?.fullName ?? "Unassigned"}
                </td>
              )}
              <td className="px-4 py-2.5">
                <PriorityBadge priority={row.priority} />
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={row.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-ink-500">
                {formatDate(row.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
