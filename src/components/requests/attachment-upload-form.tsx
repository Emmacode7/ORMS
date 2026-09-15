import { Button } from "@/components/ui/button";
import { addAttachmentAction } from "@/app/(app)/requests/[id]/actions";

export function AttachmentUploadForm({ requestId }: { requestId: string }) {
  return (
    <form action={addAttachmentAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="requestId" value={requestId} />
      <input
        type="file"
        name="attachment"
        accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
        required
        className="text-sm text-ink-700 file:mr-3 file:rounded file:border-0 file:bg-navy-700 file:px-3 file:py-1.5 file:text-sm file:text-white"
      />
      <Button type="submit" variant="secondary" size="sm">
        Upload
      </Button>
    </form>
  );
}
