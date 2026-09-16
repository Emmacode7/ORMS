import type { Role } from "@prisma/client";

export type NavItem = { label: string; href: string };

export function navForRole(role: Role): NavItem[] {
  switch (role) {
    case "STAFF":
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "New Request", href: "/requests/new" },
        { label: "My Requests", href: "/requests" },
        { label: "Notifications", href: "/notifications" },
        { label: "Profile", href: "/profile" },
      ];
    case "DEPARTMENT_OFFICER":
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "New Request", href: "/requests/new" },
        { label: "Assigned to Me", href: "/requests" },
        { label: "Notifications", href: "/notifications" },
        { label: "Profile", href: "/profile" },
      ];
    case "DEPARTMENT_HEAD":
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "New Request", href: "/requests/new" },
        { label: "Department Requests", href: "/requests" },
        { label: "Unassigned", href: "/requests?status=RECEIVED" },
        { label: "Assigned", href: "/requests?status=ASSIGNED" },
        { label: "In Progress", href: "/requests?status=IN_PROGRESS" },
        { label: "Resolved", href: "/requests?status=RESOLVED" },
        { label: "Notifications", href: "/notifications" },
        { label: "Profile", href: "/profile" },
      ];
    case "MANAGEMENT":
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "New Request", href: "/requests/new" },
        { label: "All Requests", href: "/requests" },
        { label: "Departments", href: "/departments" },
        { label: "Reports", href: "/reports" },
        { label: "Notifications", href: "/notifications" },
        { label: "Profile", href: "/profile" },
      ];
    case "SYSTEM_ADMIN":
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "New Request", href: "/requests/new" },
        { label: "Requests", href: "/requests" },
        { label: "Users", href: "/admin/users" },
        { label: "Departments", href: "/departments" },
        { label: "Reports", href: "/reports" },
        { label: "Audit Logs", href: "/admin/audit-logs" },
        { label: "Settings", href: "/admin/settings" },
        { label: "Notifications", href: "/notifications" },
        { label: "Profile", href: "/profile" },
      ];
  }
}
