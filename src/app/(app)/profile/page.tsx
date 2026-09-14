import { requireUser } from "@/lib/authorization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { humanizeRole } from "@/lib/utils";
import { changePasswordAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Please check the form and try again.",
  wrong_password: "Your current password is incorrect.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireUser();
  const { error, success } = await searchParams;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Profile</h1>
        <p className="text-sm text-ink-500">Your account details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Full Name" value={user.fullName} />
          <Row label="Staff ID" value={user.staffId} />
          <Row label="Username" value={user.username} />
          <Row label="Role" value={humanizeRole(user.role)} />
          <Row label="Department" value={user.department?.name ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-4">
              <Alert variant="success">Your password has been updated.</Alert>
            </div>
          )}
          {error && (
            <div className="mb-4">
              <Alert variant="error">{ERROR_MESSAGES[error] ?? "Something went wrong."}</Alert>
            </div>
          )}
          <form action={changePasswordAction} className="space-y-4">
            <Field label="Current Password" htmlFor="currentPassword" required>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </Field>
            <Field label="New Password" htmlFor="newPassword" required>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </Field>
            <Field label="Confirm New Password" htmlFor="confirmPassword" required>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </Field>
            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line-200 pb-2 last:border-0 last:pb-0">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900">{value}</span>
    </div>
  );
}
