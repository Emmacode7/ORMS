"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  const notificationId = String(formData.get("notificationId"));

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
}
