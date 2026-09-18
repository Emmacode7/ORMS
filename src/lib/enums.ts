// Role, RequestStatus, and Priority as plain TypeScript union types.
//
// These are NOT Prisma-generated enums: SQLite has no native ENUM type and
// Prisma's SQLite connector does not support `enum` in the schema at all
// (unlike PostgreSQL/MySQL), so prisma/schema.prisma stores these columns
// as plain String. The literal-union types below give the rest of the app
// the same compile-time safety a real Prisma enum would have provided —
// import from here instead of "@prisma/client" for these three.
//
// If you switch the datasource to PostgreSQL (see README "Switching to
// PostgreSQL"), you can optionally convert these back to real `enum` blocks
// in schema.prisma and re-export Prisma's generated types from this file
// instead — nothing outside this file would need to change.

export type Role =
  | "STAFF"
  | "DEPARTMENT_OFFICER"
  | "DEPARTMENT_HEAD"
  | "MANAGEMENT"
  | "SYSTEM_ADMIN";

export const ROLES: Role[] = [
  "STAFF",
  "DEPARTMENT_OFFICER",
  "DEPARTMENT_HEAD",
  "MANAGEMENT",
  "SYSTEM_ADMIN",
];

export type RequestStatus =
  | "SUBMITTED"
  | "RECEIVED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "AWAITING_INFORMATION"
  | "RESOLVED"
  | "CLOSED"
  | "TRANSFERRED";

export const REQUEST_STATUSES: RequestStatus[] = [
  "SUBMITTED",
  "RECEIVED",
  "ASSIGNED",
  "IN_PROGRESS",
  "AWAITING_INFORMATION",
  "RESOLVED",
  "CLOSED",
  "TRANSFERRED",
];

export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export const PRIORITIES: Priority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
