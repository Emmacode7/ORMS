import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const newRequestSchema = z.object({
  receivingDepartmentId: z.string().min(1, "Select a receiving department"),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(150, "Subject must be under 150 characters"),
  details: z
    .string()
    .trim()
    .min(10, "Please provide more detail (at least 10 characters)")
    .max(5000, "Details must be under 5000 characters"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
});

export const commentSchema = z.object({
  requestId: z.string().min(1),
  body: z.string().trim().min(1, "Comment cannot be empty").max(3000),
});

export const assignSchema = z.object({
  requestId: z.string().min(1),
  assignedToId: z.string().min(1, "Select an officer"),
  note: z.string().trim().max(1000).optional(),
});

export const transferSchema = z.object({
  requestId: z.string().min(1),
  toDepartmentId: z.string().min(1, "Select a department"),
  reason: z
    .string()
    .trim()
    .min(5, "Please explain the reason for transfer")
    .max(1000),
});

export const statusUpdateSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum([
    "IN_PROGRESS",
    "AWAITING_INFORMATION",
    "RESOLVED",
  ]),
  note: z.string().trim().max(1000).optional(),
});

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  staffId: z.string().trim().min(1).max(40),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9._-]+$/, "Use lowercase letters, numbers, dots, dashes only"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum([
    "STAFF",
    "DEPARTMENT_OFFICER",
    "DEPARTMENT_HEAD",
    "MANAGEMENT",
    "SYSTEM_ADMIN",
  ]),
  departmentId: z.string().optional().nullable(),
});

export const updateUserSchema = z.object({
  userId: z.string().min(1),
  fullName: z.string().trim().min(2).max(120),
  role: z.enum([
    "STAFF",
    "DEPARTMENT_OFFICER",
    "DEPARTMENT_HEAD",
    "MANAGEMENT",
    "SYSTEM_ADMIN",
  ]),
  departmentId: z.string().optional().nullable(),
  isActive: z.coerce.boolean(),
});

export const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});

export const updateDepartmentSchema = z.object({
  departmentId: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  isActive: z.coerce.boolean(),
});

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_UPLOAD_BYTES =
  Number(process.env.MAX_UPLOAD_SIZE_MB ?? "10") * 1024 * 1024;
