import { requireUser, requireRole } from "@/lib/authorization";
import { getManagementDashboardData } from "@/lib/dashboard";
import { ManagementDashboard } from "@/components/dashboard/management-dashboard";

export default async function ReportsPage() {
  const user = await requireUser();
  await requireRole(user, ["MANAGEMENT", "SYSTEM_ADMIN"]);

  const data = await getManagementDashboardData();

  return <ManagementDashboard data={data} />;
}
