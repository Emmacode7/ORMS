"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authorization";
import { createRequest, addAttachment } from "@/lib/requests";
import {
  newRequestSchema,
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/validation";
import { saveFile } from "@/lib/storage";

export async function createRequestAction(formData: FormData) {
  const user = await requireUser();

  const parsed = newRequestSchema.safeParse({
    receivingDepartmentId: formData.get("receivingDepartmentId"),
    subject: formData.get("subject"),
    details: formData.get("details"),
    priority: formData.get("priority") || "NORMAL",
  });

  if (!parsed.success) {
    redirect("/requests/new?error=invalid");
  }

  const file = formData.get("attachment");
  let fileBuffer: Buffer | null = null;
  let fileMeta: { name: string; type: string; size: number } | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) {
      redirect("/requests/new?error=file_too_large");
    }
    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number])) {
      redirect("/requests/new?error=file_type");
    }
    fileBuffer = Buffer.from(await file.arrayBuffer());
    fileMeta = { name: file.name, type: file.type, size: file.size };
  }

  const result = await createRequest(user, parsed.data);

  if (!result.ok) {
    redirect(`/requests/new?error=server`);
  }

  if (fileBuffer && fileMeta) {
    const saved = await saveFile(fileBuffer, fileMeta.name);
    await addAttachment(user, {
      requestId: result.data.id,
      fileName: fileMeta.name,
      storedName: saved.storedName,
      mimeType: fileMeta.type,
      size: saved.size,
    });
  }

  redirect(`/requests/${result.data.id}?created=1`);
}
