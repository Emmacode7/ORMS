import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authorization";
import { getRequestForViewing } from "@/lib/requests";
import { canManageRequest, canActOnRequest, canUpdateStatus, canCloseRequest } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { LinkButton } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { AssignDialog } from "@/components/requests/assign-dialog";
import { TransferDialog } from "@/components/requests/transfer-dialog";
import { StatusActions } from "@/components/requests/status-actions";
import { Timeline } from "@/components/requests/timeline";
import { CommentForm } from "@/components/requests/comment-form";
import { CommentList } from "@/components/requests/comment-list";
import { AttachmentList } from "@/components/requests/attachment-list";
import { AttachmentUploadForm } from "@/components/requests/attachment-upload-form";
import type { RequestStatus } from "@/lib/enums";

const SUCCESS_MESSAGES: Record<string, string> = {
  assigned: "Request assigned successfully.",
  transferred: "Request transferred successfully.",
  status_updated: "Status updated successfully.",
  closed: "Request closed. Thank you for confirming.",
  commented: "Comment added.",
  attached: "Attachment uploaded.",
};

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string; created?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { error, success, created } = await searchParams;

  const request = await getRequestForViewing(user, id);
  if (!request) notFound();

  const managePermission = canManageRequest(user, request);
  const actPermission = canActOnRequest(user, request);
  const updatePermission = canUpdateStatus(user, request);
  const closePermission = canCloseRequest(user, request) && request.status === "RESOLVED";

  const [officers, departments] = await Promise.all([
    managePermission
      ? prisma.user.findMany({
          where: {
            departmentId: request.receivingDepartmentId,
            isActive: true,
            role: { in: ["DEPARTMENT_OFFICER", "DEPARTMENT_HEAD"] },
          },
          orderBy: { fullName: "asc" },
        })
      : Promise.resolve([]),
    managePermission
      ? prisma.department.findMany({
          where: { isActive: true, id: { not: request.receivingDepartmentId } },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      {created && (
        <Alert variant="success">
          Request submitted successfully. Your reference number is{" "}
          <strong>{request.referenceNumber}</strong>. It has been sent to the{" "}
          {request.receivingDepartment.name} department.
        </Alert>
      )}
      {success && <Alert variant="success">{SUCCESS_MESSAGES[success] ?? "Done."}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            {request.referenceNumber}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-ink-900">{request.subject}</h1>
          <div className="mt-2 flex gap-2">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/api/requests/${request.id}/pdf`} variant="secondary" size="sm">
            Download PDF
          </LinkButton>
          {managePermission && !["RESOLVED", "CLOSED"].includes(request.status) && (
            <>
              <AssignDialog
                requestId={request.id}
                referenceNumber={request.referenceNumber}
                officers={officers}
                isReassign={!!request.assignedOfficerId}
              />
              <TransferDialog
                requestId={request.id}
                referenceNumber={request.referenceNumber}
                departments={departments}
              />
            </>
          )}
        </div>
      </div>

      {(updatePermission || closePermission) && (
        <StatusActions
          requestId={request.id}
          // `status` comes from the database as a plain string (see
          // lib/enums.ts for why); it only ever holds one of the eight
          // known status values, all written through validated code paths.
          status={request.status as RequestStatus}
          canUpdate={updatePermission}
          canClose={closePermission}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-ink-700">{request.details}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AttachmentList attachments={request.attachments} />
              {actPermission && <AttachmentUploadForm requestId={request.id} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CommentList comments={request.comments} />
              {actPermission && <CommentForm requestId={request.id} />}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Requester" value={request.requester.fullName} />
              <InfoRow label="Requesting Department" value={request.requestingDepartment.name} />
              <InfoRow label="Receiving Department" value={request.receivingDepartment.name} />
              <InfoRow label="Date Submitted" value={formatDate(request.createdAt)} />
              <InfoRow
                label="Assigned Officer"
                value={request.assignedOfficer?.fullName ?? "Unassigned"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline entries={request.statusHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-caps">{label}</p>
      <p className="text-ink-900">{value}</p>
    </div>
  );
}
