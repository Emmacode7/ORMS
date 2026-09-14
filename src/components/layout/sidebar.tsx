import Link from "next/link";
import type { SessionUser } from "@/lib/session";
import { navForRole } from "./nav-config";
import { humanizeRole } from "@/lib/utils";
import { SidebarLink } from "./sidebar-link";

export function Sidebar({ user }: { user: SessionUser }) {
  const items = navForRole(user.role);

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-navy-700 text-white lg:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/dashboard" className="block">
          <p className="text-sm font-bold tracking-wide">ORMS</p>
          <p className="text-xs text-navy-100/70">Office Request Management</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {items.map((item) => (
          <SidebarLink key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-sm font-medium">{user.fullName}</p>
        <p className="text-xs text-navy-100/70">
          {humanizeRole(user.role)}
          {user.department ? ` · ${user.department.name}` : ""}
        </p>
      </div>
    </aside>
  );
}
