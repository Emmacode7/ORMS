import { Button } from "@/components/ui/button";
import { updateStatusAction, closeRequestAction } from "@/app/(app)/requests/[id]/actions";
import type { RequestStatus } from "@prisma/client";

const OFFICER_TRANSITIONS: Record<string, { status: RequestStatus; label: string }[]> = {
  ASSIGNED: [
    { status: "IN_PROGRESS", label: "Start Progress" },
    { status: "RESOLVED", label: "Mark Resolved" },
  ],
  IN_PROGRESS: [
    { status: "AWAITING_INFORMATION", label: "Awaiting Information" },
    { status: "RESOLVED", label: "Mark Resolved" },
  ],
  AWAITING_INFORMATION: [
    { status: "IN_PROGRESS", label: "Resume Progress" },
    { status: "RESOLVED", label: "Mark Resolved" },
  ],
};

export function StatusActions({
  requestId,
  status,
  canUpdate,
  canClose,
}: {
  requestId: string;
  status: RequestStatus;
  canUpdate: boolean;
  canClose: boolean;
}) {
  const transitions = OFFICER_TRANSITIONS[status] ?? [];

  if (status === "RESOLVED" && canClose) {
    return (
      <form action={closeRequestAction}>
        <input type="hidden" name="requestId" value={requestId} />
        <Button type="submit" size="sm">
          Confirm &amp; Close Request
        </Button>
      </form>
    );
  }

  if (!canUpdate || transitions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((t) => (
        <form key={t.status} action={updateStatusAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="status" value={t.status} />
          <Button type="submit" variant="secondary" size="sm">
            {t.label}
          </Button>
        </form>
      ))}
    </div>
  );
}
