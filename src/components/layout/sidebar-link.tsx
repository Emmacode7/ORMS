"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function SidebarLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [hrefPath, hrefQuery] = href.split("?");
  const isActive =
    pathname === hrefPath &&
    (!hrefQuery || searchParams.get("status") === new URLSearchParams(hrefQuery).get("status"));

  return (
    <Link
      href={href}
      className={cn(
        "block rounded px-3 py-2 text-sm font-medium text-navy-100/85 transition-colors hover:bg-white/10 hover:text-white",
        isActive && "bg-white/15 text-white"
      )}
    >
      {label}
    </Link>
  );
}
