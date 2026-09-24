import { formatDateTime, getInitials } from "@/lib/utils";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIconLabel(fileName: string): string {
  const ext = fileName.split(".").pop()?.toUpperCase() ?? "FILE";
  return ext.length <= 4 ? ext : "FILE";
}

export function AttachmentList({
  attachments,
}: {
  attachments: {
    id: string;
    fileName: string;
    size: number;
    createdAt: Date;
    uploadedBy: { fullName: string };
  }[];
}) {
  if (attachments.length === 0) {
    return <p className="text-sm text-ink-500">No attachments.</p>;
  }

  return (
    <ul className="divide-y divide-line-200">
      {attachments.map((a) => (
        <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-navy-100 text-[10px] font-bold tracking-wide text-navy-700">
            {fileIconLabel(a.fileName)}
          </div>
          <div className="min-w-0 flex-1">
            <a
              href={`/api/attachments/${a.id}`}
              className="block truncate text-sm font-medium text-navy-700 hover:underline"
            >
              {a.fileName}
            </a>
            <p className="mt-0.5 text-xs text-ink-500">{formatSize(a.size)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-right">
            <div>
              <p className="text-xs font-medium text-ink-900">{a.uploadedBy.fullName}</p>
              <p className="text-xs text-ink-500">{formatDateTime(a.createdAt)}</p>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[10px] font-semibold text-navy-700">
              {getInitials(a.uploadedBy.fullName)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
