import Link from "next/link";
import type { SessionUser } from "@/lib/session";
import { getInitials } from "@/lib/utils";
import { logoutAction } from "@/app/(app)/logout-action";
import { navForRole } from "./nav-config";

export function Topbar({
  user,
  unreadCount,
}: {
  user: SessionUser;
  unreadCount: number;
}) {
  const items = navForRole(user.role);

  return (
    <header className="flex items-center justify-between border-b border-line-300 bg-white px-4 py-3 lg:px-6">
      <details className="relative lg:hidden">
        <summary className="list-none cursor-pointer rounded border border-line-300 px-3 py-1.5 text-sm font-medium text-ink-700">
          Menu
        </summary>
        <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-md border border-line-300 bg-white py-2 shadow-lg">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 text-sm text-ink-700 hover:bg-surface-muted"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </details>

      <p className="hidden text-sm font-semibold text-ink-900 lg:block">
        Office Request Management System
      </p>

      <form action="/requests" method="get" className="hidden flex-1 max-w-xs px-4 md:block">
        <input
          type="text"
          name="q"
          placeholder="Search by reference, subject, requester..."
          className="w-full rounded border border-line-300 bg-surface-muted px-3 py-1.5 text-sm placeholder:text-ink-300 focus:border-navy-400 focus:outline-none focus:ring-1 focus:ring-navy-400"
        />
      </form>

      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          className="relative rounded px-2 py-1.5 text-sm font-medium text-ink-700 hover:bg-surface-muted"
        >
          Notifications
          {unreadCount > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-priority-urgent px-1 text-xs font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </Link>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700">
          {getInitials(user.fullName)}
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded px-2 py-1.5 text-sm font-medium text-ink-500 hover:bg-surface-muted hover:text-ink-900"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
