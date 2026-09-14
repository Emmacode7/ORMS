import { Modal } from "@/components/ui/modal";
import { Field, inputClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { assignRequestAction } from "@/app/(app)/requests/[id]/actions";

export function AssignDialog({
  requestId,
  referenceNumber,
  officers,
  isReassign,
}: {
  requestId: string;
  referenceNumber: string;
  officers: { id: string; fullName: string }[];
  isReassign: boolean;
}) {
  return (
    <Modal triggerLabel={isReassign ? "Reassign" : "Assign"} title={`${isReassign ? "Reassign" : "Assign"} Request`}>
      <p className="mb-3 text-sm text-ink-500">{referenceNumber}</p>
      <form action={assignRequestAction} className="space-y-4">
        <input type="hidden" name="requestId" value={requestId} />
        <Field label="Assign to" htmlFor="assignedToId" required>
          <select id="assignedToId" name="assignedToId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select an officer
            </option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.fullName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Note (optional)" htmlFor="assign-note">
          <textarea
            id="assign-note"
            name="note"
            rows={2}
            placeholder="Please attend to this request."
            className={inputClass}
          />
        </Field>
        <Button type="submit" className="w-full">
          {isReassign ? "Reassign Request" : "Assign Request"}
        </Button>
      </form>
    </Modal>
  );
}
