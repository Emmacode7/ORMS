import { cn } from "@/lib/utils";
import { humanizeStatus } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-ink-900/5 text-status-submitted border-status-submitted/30",
  RECEIVED: "bg-status-received/10 text-status-received border-status-received/30",
  ASSIGNED: "bg-status-assigned/10 text-status-assigned border-status-assigned/30",
  IN_PROGRESS: "bg-status-inprogress/10 text-status-inprogress border-status-inprogress/30",
  AWAITING_INFORMATION: "bg-status-awaiting/10 text-status-awaiting border-status-awaiting/30",
  RESOLVED: "bg-status-resolved/10 text-status-resolved border-status-resolved/30",
  CLOSED: "bg-status-closed/10 text-status-closed border-status-closed/30",
  TRANSFERRED: "bg-status-transferred/10 text-status-transferred border-status-transferred/30",
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-priority-low/10 text-priority-low border-priority-low/30",
  NORMAL: "bg-priority-normal/10 text-priority-normal border-priority-normal/30",
  HIGH: "bg-priority-high/10 text-priority-high border-priority-high/30",
  URGENT: "bg-priority-urgent/10 text-priority-urgent border-priority-urgent/30",
};

function BaseBadge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <BaseBadge className={STATUS_STYLES[status] ?? "bg-ink-900/5 text-ink-700 border-ink-300/30"}>
      {humanizeStatus(status)}
    </BaseBadge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <BaseBadge className={PRIORITY_STYLES[priority] ?? "bg-ink-900/5 text-ink-700 border-ink-300/30"}>
      {humanizeStatus(priority)}
    </BaseBadge>
  );
}
