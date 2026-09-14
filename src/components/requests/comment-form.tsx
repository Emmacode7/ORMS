import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { addCommentAction } from "@/app/(app)/requests/[id]/actions";

export function CommentForm({ requestId }: { requestId: string }) {
  return (
    <form action={addCommentAction} className="space-y-2">
      <input type="hidden" name="requestId" value={requestId} />
      <textarea
        name="body"
        required
        minLength={1}
        rows={3}
        placeholder="Add a comment"
        className={inputClass}
      />
      <Button type="submit" size="sm">
        Post Comment
      </Button>
    </form>
  );
}
