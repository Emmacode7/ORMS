import { requireUser } from "@/lib/authorization";
import {
  getStaffDashboardData,
  getOfficerDashboardData,
  getHeadDashboardData,
  getManagementDashboardData,
  getAdminOverviewData,
} from "@/lib/dashboard";
import { StaffDashboard } from "@/components/dashboard/staff-dashboard";
import { OfficerDashboard } from "@/components/dashboard/officer-dashboard";
import { DepartmentHeadDashboard } from "@/components/dashboard/department-head-dashboard";
import { ManagementDashboard } from "@/components/dashboard/management-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default async function DashboardPage() {
  const user = await requireUser();

  switch (user.role) {
    case "STAFF": {
      const data = await getStaffDashboardData(user);
      return <StaffDashboard user={user} data={data} />;
    }
    case "DEPARTMENT_OFFICER": {
      const data = await getOfficerDashboardData(user);
      return <OfficerDashboard user={user} data={data} />;
    }
    case "DEPARTMENT_HEAD": {
      const data = await getHeadDashboardData(user);
      return <DepartmentHeadDashboard user={user} data={data} />;
    }
    case "MANAGEMENT": {
      const data = await getManagementDashboardData();
      return <ManagementDashboard data={data} />;
    }
    case "SYSTEM_ADMIN": {
      const data = await getAdminOverviewData();
      return <AdminDashboard data={data} />;
    }
  }
}
