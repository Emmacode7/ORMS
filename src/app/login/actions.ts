"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { loginSchema } from "@/lib/validation";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  const username = parsed.data.username.toLowerCase();

  const { allowed } = checkRateLimit(`login:${username}`);
  if (!allowed) {
    redirect("/login?error=rate_limited");
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !user.isActive) {
    await logAudit(prisma, {
      actorId: null,
      action: "USER_LOGIN_FAILED",
      entityType: "User",
      metadata: { username },
    });
    redirect("/login?error=invalid");
  }

  const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    await logAudit(prisma, {
      actorId: user.id,
      action: "USER_LOGIN_FAILED",
      entityType: "User",
      entityId: user.id,
    });
    redirect("/login?error=invalid");
  }

  await setSessionCookie(user.id);
  await logAudit(prisma, {
    actorId: user.id,
    action: "USER_LOGIN",
    entityType: "User",
    entityId: user.id,
  });

  redirect("/dashboard");
}
