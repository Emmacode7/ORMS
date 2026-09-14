import { cn } from "@/lib/utils";

export function Alert({
  variant = "info",
  children,
}: {
  variant?: "info" | "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded border px-4 py-3 text-sm",
        variant === "info" && "border-status-received/30 bg-status-received/5 text-status-received",
        variant === "success" && "border-status-resolved/30 bg-status-resolved/5 text-status-resolved",
        variant === "error" && "border-priority-urgent/30 bg-priority-urgent/5 text-priority-urgent"
      )}
    >
      {children}
    </div>
  );
}
