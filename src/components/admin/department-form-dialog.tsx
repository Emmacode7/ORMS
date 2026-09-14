import { Modal } from "@/components/ui/modal";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createDepartmentAction, updateDepartmentAction } from "@/app/departments/actions";

export function DepartmentFormDialog({
  department,
}: {
  department?: { id: string; name: string; description: string | null; isActive: boolean };
}) {
  const isEdit = !!department;

  return (
    <Modal
      triggerLabel={isEdit ? "Edit" : "Create Department"}
      triggerVariant={isEdit ? "secondary" : "primary"}
      title={isEdit ? "Edit Department" : "Create Department"}
    >
      <form action={isEdit ? updateDepartmentAction : createDepartmentAction} className="space-y-4">
        {isEdit && <input type="hidden" name="departmentId" value={department!.id} />}
        <Field label="Department Name" htmlFor={`name-${department?.id ?? "new"}`} required>
          <input
            id={`name-${department?.id ?? "new"}`}
            name="name"
            type="text"
            required
            minLength={2}
            defaultValue={department?.name}
            className={inputClass}
          />
        </Field>
        <Field label="Description (optional)" htmlFor={`desc-${department?.id ?? "new"}`}>
          <textarea
            id={`desc-${department?.id ?? "new"}`}
            name="description"
            rows={2}
            defaultValue={department?.description ?? ""}
            className={inputClass}
          />
        </Field>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" name="isActive" defaultChecked={department!.isActive} />
            Active (visible when submitting new requests)
          </label>
        )}
        <Button type="submit" className="w-full">
          {isEdit ? "Save Changes" : "Create Department"}
        </Button>
      </form>
    </Modal>
  );
}
