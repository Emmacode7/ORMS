import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { inputClass, Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Please check the form and try again.",
  no_match: "We couldn't verify those details. Contact your System Administrator to reset your password.",
  rate_limited: "Too many attempts. Please wait a few minutes and try again.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-700 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-100">
            Office Request Management System
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">Reset Password</h1>
          <p className="mt-1 text-sm text-navy-100/70">
            Verify your identity to set a new password
          </p>
        </div>

        <div className="rounded-md border border-white/10 bg-white p-6">
          {error && (
            <div className="mb-4">
              <Alert variant="error">{ERROR_MESSAGES[error] ?? "Something went wrong."}</Alert>
            </div>
          )}

          <form action={forgotPasswordAction} className="space-y-4">
            <Field label="Username" htmlFor="username" required>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className={inputClass}
              />
            </Field>
            <Field
              label="Staff ID"
              htmlFor="staffId"
              required
              hint="As issued on your staff account — contact your Department Head or Admin if you don't have it to hand."
            >
              <input id="staffId" name="staffId" type="text" required className={inputClass} />
            </Field>
            <Field label="New Password" htmlFor="newPassword" required>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm New Password" htmlFor="confirmPassword" required>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" className="w-full" size="lg">
              Reset Password
            </Button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link href="/login" className="text-navy-700 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
