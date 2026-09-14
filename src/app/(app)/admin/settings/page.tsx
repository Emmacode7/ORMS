import { requireUser, requireRole } from "@/lib/authorization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_DESCRIPTIONS = [
  {
    role: "Staff",
    description:
      "Can submit requests to any department, track their own requests, comment, and confirm/close resolved requests.",
  },
  {
    role: "Department Officer",
    description: "Can view and act on requests assigned to them by their Department Head.",
  },
  {
    role: "Department Head",
    description:
      "Manages requests directed to their department: assigns to officers, transfers misrouted requests, and reviews department statistics.",
  },
  {
    role: "Management",
    description:
      "Read-focused, organization-wide oversight: statistics, department performance, and reports across all departments.",
  },
  {
    role: "System Administrator",
    description:
      "Manages users, departments, and system configuration; views all requests and the full audit log.",
  },
];

export default async function SettingsPage() {
  const user = await requireUser();
  await requireRole(user, ["SYSTEM_ADMIN"]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500">System roles and configuration overview.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Roles</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-line-200">
          {ROLE_DESCRIPTIONS.map((r) => (
            <div key={r.role} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-medium text-ink-900">{r.role}</p>
              <p className="text-sm text-ink-500">{r.description}</p>
            </div>
          ))}
          <p className="pt-3 text-xs text-ink-500">
            Roles are fixed system permissions and cannot be modified from this screen. Assign
            roles to individual users from the Users page.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-ink-700">
          <p>Environment: {process.env.NODE_ENV}</p>
          <p>Application: Office Request Management System (ORMS)</p>
        </CardContent>
      </Card>
    </div>
  );
}
