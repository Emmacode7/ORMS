import { Modal } from "@/components/ui/modal";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createUserAction, updateUserAction } from "@/app/(app)/admin/users/actions";

const ROLES = [
  { value: "STAFF", label: "Staff" },
  { value: "DEPARTMENT_OFFICER", label: "Department Officer" },
  { value: "DEPARTMENT_HEAD", label: "Department Head" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "SYSTEM_ADMIN", label: "System Administrator" },
];

export function UserFormDialog({
  departments,
  user,
}: {
  departments: { id: string; name: string }[];
  user?: {
    id: string;
    fullName: string;
    staffId: string;
    username: string;
    role: string;
    departmentId: string | null;
    isActive: boolean;
  };
}) {
  const isEdit = !!user;
  const uid = user?.id ?? "new";

  return (
    <Modal
      triggerLabel={isEdit ? "Edit" : "Create User"}
      triggerVariant={isEdit ? "secondary" : "primary"}
      title={isEdit ? "Edit User" : "Create User"}
    >
      <form action={isEdit ? updateUserAction : createUserAction} className="space-y-4">
        {isEdit && <input type="hidden" name="userId" value={user!.id} />}

        <Field label="Full Name" htmlFor={`fullName-${uid}`} required>
          <input
            id={`fullName-${uid}`}
            name="fullName"
            type="text"
            required
            minLength={2}
            defaultValue={user?.fullName}
            className={inputClass}
          />
        </Field>

        {!isEdit && (
          <>
            <Field label="Staff ID" htmlFor={`staffId-${uid}`} required>
              <input id={`staffId-${uid}`} name="staffId" type="text" required className={inputClass} />
            </Field>
            <Field label="Username" htmlFor={`username-${uid}`} required hint="Lowercase letters, numbers, dots, dashes only">
              <input id={`username-${uid}`} name="username" type="text" required className={inputClass} />
            </Field>
            <Field label="Temporary Password" htmlFor={`password-${uid}`} required hint="At least 8 characters">
              <input
                id={`password-${uid}`}
                name="password"
                type="text"
                required
                minLength={8}
                className={inputClass}
              />
            </Field>
          </>
        )}

        <Field label="Role" htmlFor={`role-${uid}`} required>
          <select id={`role-${uid}`} name="role" required defaultValue={user?.role ?? "STAFF"} className={inputClass}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Department" htmlFor={`departmentId-${uid}`} hint="Required for Staff, Officer, and Department Head roles">
          <select
            id={`departmentId-${uid}`}
            name="departmentId"
            defaultValue={user?.departmentId ?? ""}
            className={inputClass}
          >
            <option value="">None</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>

        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" name="isActive" defaultChecked={user!.isActive} />
            Active (can log in)
          </label>
        )}

        <Button type="submit" className="w-full">
          {isEdit ? "Save Changes" : "Create User"}
        </Button>
      </form>
    </Modal>
  );
}
