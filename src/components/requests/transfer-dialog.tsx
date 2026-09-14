import { Modal } from "@/components/ui/modal";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { transferRequestAction } from "@/app/(app)/requests/[id]/actions";

export function TransferDialog({
  requestId,
  referenceNumber,
  departments,
}: {
  requestId: string;
  referenceNumber: string;
  departments: { id: string; name: string }[];
}) {
  return (
    <Modal triggerLabel="Transfer" triggerVariant="secondary" title="Transfer Request">
      <p className="mb-3 text-sm text-ink-500">{referenceNumber}</p>
      <form action={transferRequestAction} className="space-y-4">
        <input type="hidden" name="requestId" value={requestId} />
        <Field label="Receiving Department" htmlFor="toDepartmentId" required>
          <select id="toDepartmentId" name="toDepartmentId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select a department
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reason for Transfer" htmlFor="reason" required>
          <textarea
            id="reason"
            name="reason"
            required
            minLength={5}
            rows={3}
            placeholder="Explain why this request should move to that department"
            className={inputClass}
          />
        </Field>
        <Button type="submit" className="w-full">
          Transfer Request
        </Button>
      </form>
    </Modal>
  );
}
