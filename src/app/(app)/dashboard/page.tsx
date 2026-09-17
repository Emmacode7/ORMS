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
import { Alert } from "@/components/ui/alert";
import Link from "next/link";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ createdRef?: string; createdId?: string }>;
}) {
  const user = await requireUser();
  const { createdRef, createdId } = await searchParams;

  const confirmation = createdRef && createdId && (
    <Alert variant="success">
      Request submitted successfully. Your reference number is{" "}
      <strong>{createdRef}</strong>.{" "}
      <Link href={`/requests/${createdId}`} className="underline">
        View Request
      </Link>
    </Alert>
  );

  switch (user.role) {
    case "STAFF": {
      const data = await getStaffDashboardData(user);
      return (
        <div className="space-y-6">
          {confirmation}
          <StaffDashboard user={user} data={data} />
        </div>
      );
    }
    case "DEPARTMENT_OFFICER": {
      const data = await getOfficerDashboardData(user);
      return (
        <div className="space-y-6">
          {confirmation}
          <OfficerDashboard user={user} data={data} />
        </div>
      );
    }
    case "DEPARTMENT_HEAD": {
      const data = await getHeadDashboardData(user);
      return (
        <div className="space-y-6">
          {confirmation}
          <DepartmentHeadDashboard user={user} data={data} />
        </div>
      );
    }
    case "MANAGEMENT": {
      const data = await getManagementDashboardData();
      return (
        <div className="space-y-6">
          {confirmation}
          <ManagementDashboard user={user} data={data} />
        </div>
      );
    }
    case "SYSTEM_ADMIN": {
      const data = await getAdminOverviewData();
      return (
        <div className="space-y-6">
          {confirmation}
          <AdminDashboard data={data} />
        </div>
      );
    }
  }
}
