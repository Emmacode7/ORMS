"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, requireRole } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
} from "@/lib/validation";

const DEPARTMENT_REQUIRED_ROLES = ["STAFF", "DEPARTMENT_OFFICER", "DEPARTMENT_HEAD"];

async function assertSingleActiveHead(
  departmentId: string | null | undefined,
  role: string,
  excludeUserId?: string
) {
  if (role !== "DEPARTMENT_HEAD" || !departmentId) return null;
  const existingHead = await prisma.user.findFirst({
    where: {
      departmentId,
      role: "DEPARTMENT_HEAD",
      isActive: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
  return existingHead;
}

export async function createUserAction(formData: FormData) {
  const admin = await requireUser();
  await requireRole(admin, ["SYSTEM_ADMIN"]);

  const parsed = createUserSchema.safeParse({
    fullName: formData.get("fullName"),
    staffId: formData.get("staffId"),
    username: formData.get("username"),
    password: formData.get("password"),
    role: formData.get("role"),
    departmentId: formData.get("departmentId") || null,
  });

  if (!parsed.success) {
    redirect("/admin/users?error=invalid");
  }

  const data = parsed.data;

  if (DEPARTMENT_REQUIRED_ROLES.includes(data.role) && !data.departmentId) {
    redirect("/admin/users?error=department_required");
  }

  const [usernameTaken, staffIdTaken] = await Promise.all([
    prisma.user.findUnique({ where: { username: data.username } }),
    prisma.user.findUnique({ where: { staffId: data.staffId } }),
  ]);
  if (usernameTaken) redirect("/admin/users?error=username_taken");
  if (staffIdTaken) redirect("/admin/users?error=staffid_taken");

  const existingHead = await assertSingleActiveHead(data.departmentId, data.role);
  if (existingHead) {
    redirect("/admin/users?error=head_exists");
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      staffId: data.staffId,
      username: data.username,
      passwordHash,
      role: data.role,
      departmentId: data.departmentId || null,
    },
  });

  await logAudit(prisma, {
    actorId: admin.id,
    action: "USER_CREATED",
    entityType: "User",
    entityId: user.id,
    metadata: { username: user.username, role: user.role },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?success=created");
}

export async function updateUserAction(formData: FormData) {
  const admin = await requireUser();
  await requireRole(admin, ["SYSTEM_ADMIN"]);

  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    departmentId: formData.get("departmentId") || null,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    redirect("/admin/users?error=invalid");
  }

  const data = parsed.data;

  if (DEPARTMENT_REQUIRED_ROLES.includes(data.role) && !data.departmentId) {
    redirect("/admin/users?error=department_required");
  }

  const existingHead = await assertSingleActiveHead(data.departmentId, data.role, data.userId);
  if (existingHead) {
    redirect("/admin/users?error=head_exists");
  }

  await prisma.user.update({
    where: { id: data.userId },
    data: {
      fullName: data.fullName,
      role: data.role,
      departmentId: data.departmentId || null,
      isActive: data.isActive,
    },
  });

  await logAudit(prisma, {
    actorId: admin.id,
    action: "USER_UPDATED",
    entityType: "User",
    entityId: data.userId,
    metadata: { role: data.role, isActive: data.isActive },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?success=updated");
}

export async function resetPasswordAction(formData: FormData) {
  const admin = await requireUser();
  await requireRole(admin, ["SYSTEM_ADMIN"]);

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    redirect("/admin/users?error=invalid");
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { passwordHash },
  });

  await logAudit(prisma, {
    actorId: admin.id,
    action: "USER_PASSWORD_RESET",
    entityType: "User",
    entityId: parsed.data.userId,
    metadata: { byAdmin: true },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?success=password_reset");
}
