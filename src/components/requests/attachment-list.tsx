import { formatDateTime } from "@/lib/utils";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <li key={a.id} className="flex items-center justify-between py-2">
          <div>
            <a
              href={`/api/attachments/${a.id}`}
              className="text-sm font-medium text-navy-700 hover:underline"
            >
              {a.fileName}
            </a>
            <p className="text-xs text-ink-500">
              {formatSize(a.size)} · uploaded by {a.uploadedBy.fullName} on{" "}
              {formatDateTime(a.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
