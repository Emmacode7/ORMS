"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, requireRole } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { createDepartmentSchema, updateDepartmentSchema } from "@/lib/validation";

export async function createDepartmentAction(formData: FormData) {
  const user = await requireUser();
  await requireRole(user, ["SYSTEM_ADMIN"]);

  const parsed = createDepartmentSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    redirect("/departments?error=invalid");
  }

  const existing = await prisma.department.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    redirect("/departments?error=duplicate");
  }

  const dept = await prisma.department.create({ data: parsed.data });

  await logAudit(prisma, {
    actorId: user.id,
    action: "DEPARTMENT_CREATED",
    entityType: "Department",
    entityId: dept.id,
    metadata: { name: dept.name },
  });

  revalidatePath("/departments");
  redirect("/departments?success=created");
}

export async function updateDepartmentAction(formData: FormData) {
  const user = await requireUser();
  await requireRole(user, ["SYSTEM_ADMIN"]);

  const parsed = updateDepartmentSchema.safeParse({
    departmentId: formData.get("departmentId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    redirect("/departments?error=invalid");
  }

  const { departmentId, ...data } = parsed.data;

  const duplicate = await prisma.department.findFirst({
    where: { name: data.name, id: { not: departmentId } },
  });
  if (duplicate) {
    redirect("/departments?error=duplicate");
  }

  await prisma.department.update({ where: { id: departmentId }, data });

  await logAudit(prisma, {
    actorId: user.id,
    action: "DEPARTMENT_UPDATED",
    entityType: "Department",
    entityId: departmentId,
    metadata: { name: data.name, isActive: data.isActive },
  });

  revalidatePath("/departments");
  redirect("/departments?success=updated");
}
