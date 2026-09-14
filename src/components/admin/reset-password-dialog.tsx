import { Modal } from "@/components/ui/modal";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/app/(app)/admin/users/actions";

export function ResetPasswordDialog({ userId, fullName }: { userId: string; fullName: string }) {
  return (
    <Modal triggerLabel="Reset Password" triggerVariant="ghost" title="Reset Password">
      <p className="mb-3 text-sm text-ink-500">Set a new temporary password for {fullName}.</p>
      <form action={resetPasswordAction} className="space-y-4">
        <input type="hidden" name="userId" value={userId} />
        <Field label="New Password" htmlFor={`newpw-${userId}`} required hint="At least 8 characters">
          <input
            id={`newpw-${userId}`}
            name="newPassword"
            type="text"
            required
            minLength={8}
            className={inputClass}
          />
        </Field>
        <Button type="submit" className="w-full">
          Reset Password
        </Button>
      </form>
    </Modal>
  );
}
