import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { inputClass, Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { loginAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Incorrect username or password.",
  rate_limited: "Too many attempts. Please wait a few minutes and try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { error, reset } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-700 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-100">
            Office Request Management System
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">ORMS</h1>
          <p className="mt-1 text-sm text-navy-100/70">Sign in to your account</p>
        </div>

        <div className="rounded-md border border-white/10 bg-white p-6">
          {reset && (
            <div className="mb-4">
              <Alert variant="success">Your password has been reset. Please sign in.</Alert>
            </div>
          )}
          {error && (
            <div className="mb-4">
              <Alert variant="error">{ERROR_MESSAGES[error] ?? "Something went wrong."}</Alert>
            </div>
          )}

          <form action={loginAction} className="space-y-4">
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
            <Field label="Password" htmlFor="password" required>
              <PasswordInput id="password" name="password" autoComplete="current-password" required />
            </Field>
            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="text-navy-700 hover:underline">
              Forgot password?
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-navy-100/50">
          Internal system. Unauthorized access is prohibited and logged.
        </p>
      </div>
    </div>
  );
}
