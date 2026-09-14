import { formatDateTime } from "@/lib/utils";
import { humanizeStatus } from "@/lib/utils";

export function Timeline({
  entries,
}: {
  entries: {
    id: string;
    status: string;
    note: string | null;
    createdAt: Date;
    changedBy: { fullName: string };
  }[];
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-ink-500">No activity yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry) => (
        <li key={entry.id} className="relative pl-5">
          <span className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-navy-700" />
          <p className="text-sm font-medium text-ink-900">{humanizeStatus(entry.status)}</p>
          {entry.note && <p className="text-sm text-ink-700">{entry.note}</p>}
          <p className="text-xs text-ink-500">
            {formatDateTime(entry.createdAt)} · {entry.changedBy.fullName}
          </p>
        </li>
      ))}
    </ol>
  );
}
