"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, clearSessionCookie } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) {
    await logAudit(prisma, {
      actorId: user.id,
      action: "USER_LOGOUT",
      entityType: "User",
      entityId: user.id,
    });
  }
  await clearSessionCookie();
  redirect("/login");
}
