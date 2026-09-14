import { cn } from "@/lib/utils";

export const inputClass = cn(
  "w-full rounded border border-line-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300",
  "focus:border-navy-400 focus:outline-none focus:ring-1 focus:ring-navy-400"
);

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
        {required && <span className="text-priority-urgent"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-priority-urgent">{error}</p>}
    </div>
  );
}
