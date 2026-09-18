"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authorization";
import {
  assignRequest,
  transferRequest,
  updateRequestStatus,
  closeRequest,
  addComment,
  addAttachment,
} from "@/lib/requests";
import {
  assignSchema,
  transferSchema,
  statusUpdateSchema,
  commentSchema,
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/validation";
import { saveFile } from "@/lib/storage";
import type { RequestStatus } from "@/lib/enums";

function back(requestId: string, params: Record<string, string>): never {
  const qs = new URLSearchParams(params).toString();
  redirect(`/requests/${requestId}${qs ? `?${qs}` : ""}`);
}

export async function assignRequestAction(formData: FormData) {
  const user = await requireUser();
  const requestId = String(formData.get("requestId"));

  const parsed = assignSchema.safeParse({
    requestId,
    assignedToId: formData.get("assignedToId"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) back(requestId, { error: "Select an officer to assign this to." });

  const result = await assignRequest(user, parsed.data);
  if (!result.ok) back(requestId, { error: result.error });
  back(requestId, { success: "assigned" });
}

export async function transferRequestAction(formData: FormData) {
  const user = await requireUser();
  const requestId = String(formData.get("requestId"));

  const parsed = transferSchema.safeParse({
    requestId,
    toDepartmentId: formData.get("toDepartmentId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) back(requestId, { error: "Select a department and provide a reason." });

  const result = await transferRequest(user, parsed.data);
  if (!result.ok) back(requestId, { error: result.error });
  back(requestId, { success: "transferred" });
}

export async function updateStatusAction(formData: FormData) {
  const user = await requireUser();
  const requestId = String(formData.get("requestId"));

  const parsed = statusUpdateSchema.safeParse({
    requestId,
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) back(requestId, { error: "Invalid status update." });

  const result = await updateRequestStatus(user, parsed.data);
  if (!result.ok) back(requestId, { error: result.error });
  back(requestId, { success: "status_updated" });
}

export async function closeRequestAction(formData: FormData) {
  const user = await requireUser();
  const requestId = String(formData.get("requestId"));

  const result = await closeRequest(user, requestId);
  if (!result.ok) back(requestId, { error: result.error });
  back(requestId, { success: "closed" });
}

export async function addCommentAction(formData: FormData) {
  const user = await requireUser();
  const requestId = String(formData.get("requestId"));

  const parsed = commentSchema.safeParse({
    requestId,
    body: formData.get("body"),
  });
  if (!parsed.success) back(requestId, { error: "Comment cannot be empty." });

  const result = await addComment(user, parsed.data);
  if (!result.ok) back(requestId, { error: result.error });
  back(requestId, { success: "commented" });
}

export async function addAttachmentAction(formData: FormData) {
  const user = await requireUser();
  const requestId = String(formData.get("requestId"));

  const file = formData.get("attachment");
  if (!(file instanceof File) || file.size === 0) {
    back(requestId, { error: "Choose a file to upload." });
  }
  const uploadedFile = file as File;
  if (uploadedFile.size > MAX_UPLOAD_BYTES) {
    back(requestId, { error: "File exceeds the maximum allowed size." });
  }
  if (
    !ALLOWED_UPLOAD_MIME_TYPES.includes(
      uploadedFile.type as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number]
    )
  ) {
    back(requestId, { error: "That file type is not supported." });
  }

  const buffer = Buffer.from(await uploadedFile.arrayBuffer());
  const saved = await saveFile(buffer, uploadedFile.name);

  const result = await addAttachment(user, {
    requestId,
    fileName: uploadedFile.name,
    storedName: saved.storedName,
    mimeType: uploadedFile.type,
    size: saved.size,
  });
  if (!result.ok) back(requestId, { error: result.error });
  back(requestId, { success: "attached" });
}

export type { RequestStatus };
