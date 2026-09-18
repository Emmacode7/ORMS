"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { forgotPasswordSchema } from "@/lib/validation";

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    username: formData.get("username"),
    staffId: formData.get("staffId"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect("/forgot-password?error=invalid");
  }

  const username = parsed.data.username.toLowerCase();

  const { allowed } = checkRateLimit(`forgot-password:${username}`);
  if (!allowed) {
    redirect("/forgot-password?error=rate_limited");
  }

  const user = await prisma.user.findUnique({ where: { username } });

  // Same generic error whether the username doesn't exist, the Staff ID
  // doesn't match, or the account is disabled — never confirm which.
  const staffIdMatches =
    !!user && user.staffId.trim().toUpperCase() === parsed.data.staffId.trim().toUpperCase();

  if (!user || !user.isActive || !staffIdMatches) {
    redirect("/forgot-password?error=no_match");
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await logAudit(prisma, {
    actorId: user.id,
    action: "USER_PASSWORD_RESET",
    entityType: "User",
    entityId: user.id,
    metadata: { selfService: true },
  });

  redirect("/login?reset=1");
}
