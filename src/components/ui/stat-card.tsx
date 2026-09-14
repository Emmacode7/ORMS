import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "navy" | "gold" | "muted";
}) {
  return (
    <div className="rounded-md border border-line-300 bg-white px-5 py-4">
      <p className="label-caps">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold",
          accent === "gold" ? "text-gold-600" : "text-navy-700"
        )}
      >
        {value}
      </p>
    </div>
  );
}
