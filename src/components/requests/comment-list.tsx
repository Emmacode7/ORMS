import { formatDateTime, getInitials } from "@/lib/utils";

export function CommentList({
  comments,
}: {
  comments: {
    id: string;
    body: string;
    createdAt: Date;
    author: { fullName: string };
  }[];
}) {
  if (comments.length === 0) {
    return <p className="text-sm text-ink-500">No comments yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li key={c.id} className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700">
            {getInitials(c.author.fullName)}
          </div>
          <div>
            <p className="text-sm">
              <span className="font-medium text-ink-900">{c.author.fullName}</span>{" "}
              <span className="text-xs text-ink-500">{formatDateTime(c.createdAt)}</span>
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-700">{c.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
