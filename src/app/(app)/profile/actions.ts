"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clearSessionCookie } from "@/lib/session";
import { z } from "zod";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect("/profile?error=invalid");
  }

  const isValid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) {
    redirect("/profile?error=wrong_password");
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });

  await logAudit(prisma, {
    actorId: user.id,
    action: "USER_PASSWORD_RESET",
    entityType: "User",
    entityId: user.id,
    metadata: { self: true },
  });

  // Changing your own password bumps sessionVersion, which immediately
  // invalidates the session cookie already in this browser (see
  // src/lib/session.ts). Sign out cleanly here and ask for a fresh login,
  // rather than leaving a cookie that would just fail on the next request.
  await clearSessionCookie();
  redirect("/login?passwordChanged=1");
}
