import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { Alert } from "@/components/ui/alert";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRequestAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Please check the form — some fields are missing or invalid.",
  file_too_large: "That file exceeds the maximum allowed size.",
  file_type: "That file type is not supported. Use PDF, DOC/DOCX, or an image.",
  server: "Unable to submit request. Please try again.",
};

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  const departments = await prisma.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">New Request</h1>
        <p className="text-sm text-ink-500">Submit a request to any department.</p>
      </div>

      {error && <Alert variant="error">{ERROR_MESSAGES[error] ?? "Something went wrong."}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createRequestAction} encType="multipart/form-data" className="space-y-5">
            <Field label="Requesting Department" htmlFor="requestingDepartment">
              <input
                id="requestingDepartment"
                value={user.department?.name ?? "Not set"}
                disabled
                className={inputClass + " bg-surface-muted text-ink-500"}
              />
            </Field>

            <Field label="Receiving Department" htmlFor="receivingDepartmentId" required>
              <select
                id="receivingDepartmentId"
                name="receivingDepartmentId"
                required
                defaultValue=""
                className={inputClass}
              >
                <option value="" disabled>
                  Select a department
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Subject" htmlFor="subject" required>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                minLength={3}
                maxLength={150}
                placeholder="Short title of your request"
                className={inputClass}
              />
            </Field>

            <Field label="Request Details" htmlFor="details" required>
              <textarea
                id="details"
                name="details"
                required
                minLength={10}
                maxLength={5000}
                rows={6}
                placeholder="Explain what you need"
                className={inputClass}
              />
            </Field>

            <Field label="Priority" htmlFor="priority" required>
              <select id="priority" name="priority" defaultValue="NORMAL" className={inputClass}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </Field>

            <Field
              label="Attachment"
              htmlFor="attachment"
              hint="Optional. PDF, DOC/DOCX, or image — up to 10MB."
            >
              <input
                id="attachment"
                name="attachment"
                type="file"
                accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
                className={inputClass + " file:mr-3 file:rounded file:border-0 file:bg-navy-700 file:px-3 file:py-1.5 file:text-white"}
              />
            </Field>

            <Button type="submit" size="lg">
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
