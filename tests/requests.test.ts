/**
 * Integration tests for the request lifecycle. These exercise real Prisma
 * queries against your actual Postgres database (DATABASE_URL, read from
 * .env below), isolated into their own schema (test_orms) so they never
 * touch demo/seed data — that schema is dropped and recreated fresh on each
 * run, and dropped again on teardown. `npm run db:generate` must have been
 * run at least once before this file runs (see README "Running tests").
 * Env vars are set before any `@/lib/*` module is imported — those modules
 * construct a PrismaClient at import time, so the imports below are
 * deliberately dynamic (inside beforeAll) rather than static top-of-file
 * imports.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const TEST_SCHEMA = "test_orms";

// vitest doesn't load .env on its own (Next.js does that for its own
// commands, but this is a separate process) — read it manually, without
// pulling in a new dependency for something this small.
function loadDotEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotEnv();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and fill in your Postgres connection string before running tests."
  );
}

const BASE_DATABASE_URL = process.env.DATABASE_URL;
const TEST_DATABASE_URL = BASE_DATABASE_URL.includes("?")
  ? `${BASE_DATABASE_URL}&schema=${TEST_SCHEMA}`
  : `${BASE_DATABASE_URL}?schema=${TEST_SCHEMA}`;
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET ?? "test-only-session-secret-do-not-use-in-production";
process.env.UPLOAD_DIR = path.resolve(__dirname, "test-uploads");

function dropTestSchema() {
  execSync(`npx prisma db execute --url "${BASE_DATABASE_URL}" --stdin`, {
    input: `DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE;`,
    stdio: ["pipe", "inherit", "inherit"],
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prisma: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let lib: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfLib: any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let staff: any, staff2: any, head: any, officer: any, admin: any, ict: any, maintenance: any;

beforeAll(async () => {
  dropTestSchema();

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: process.env as NodeJS.ProcessEnv,
  });

  const dbModule = await import("@/lib/db");
  prisma = dbModule.prisma;
  lib = await import("@/lib/requests");
  pdfLib = await import("@/lib/pdf");
  const authLib = await import("@/lib/auth");

  ict = await prisma.department.create({ data: { name: "Test ICT" } });
  maintenance = await prisma.department.create({ data: { name: "Test Maintenance" } });

  const passwordHash = await authLib.hashPassword("Test@12345");

  const makeUser = (data: Record<string, unknown>) =>
    prisma.user.create({ data, include: { department: true } });

  staff = await makeUser({
    fullName: "Test Staff",
    staffId: "T-STF-1",
    username: "t.staff",
    passwordHash,
    role: "STAFF",
    departmentId: maintenance.id,
  });
  staff2 = await makeUser({
    fullName: "Other Staff",
    staffId: "T-STF-2",
    username: "t.staff2",
    passwordHash,
    role: "STAFF",
    departmentId: maintenance.id,
  });
  head = await makeUser({
    fullName: "Test Head",
    staffId: "T-HD-1",
    username: "t.head",
    passwordHash,
    role: "DEPARTMENT_HEAD",
    departmentId: ict.id,
  });
  officer = await makeUser({
    fullName: "Test Officer",
    staffId: "T-OF-1",
    username: "t.officer",
    passwordHash,
    role: "DEPARTMENT_OFFICER",
    departmentId: ict.id,
  });
  admin = await makeUser({
    fullName: "Test Admin",
    staffId: "T-AD-1",
    username: "t.admin",
    passwordHash,
    role: "SYSTEM_ADMIN",
  });
});

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  dropTestSchema();
});

describe("request lifecycle", () => {
  let requestId: string;
  let referenceNumber: string;

  it("creates a request with a unique reference number and an audit log entry", async () => {
    const result = await lib.createRequest(staff, {
      receivingDepartmentId: ict.id,
      subject: "Computer not powering on",
      details: "The desktop in my office will not turn on this morning.",
      priority: "HIGH",
    });

    expect(result.ok).toBe(true);
    requestId = result.data.id;
    referenceNumber = result.data.referenceNumber;
    expect(referenceNumber).toMatch(/^ORMS-\d{4}-\d{6}$/);

    const audit = await prisma.auditLog.findFirst({
      where: { entityId: requestId, action: "REQUEST_CREATED" },
    });
    expect(audit).not.toBeNull();
  });

  it("is visible to the requester but not to an unrelated staff member (IDOR check)", async () => {
    const visibleToOwner = await lib.getRequestForViewing(staff, requestId);
    expect(visibleToOwner).not.toBeNull();

    const visibleToOther = await lib.getRequestForViewing(staff2, requestId);
    expect(visibleToOther).toBeNull();
  });

  it("is visible to the receiving department's head as RECEIVED", async () => {
    const visible = await lib.getRequestForViewing(head, requestId);
    expect(visible).not.toBeNull();
    expect(visible.status).toBe("RECEIVED");
  });

  it("rejects assignment by someone who is not the department head", async () => {
    const result = await lib.assignRequest(staff, { requestId, assignedToId: officer.id });
    expect(result.ok).toBe(false);
  });

  it("lets the department head assign the request to an officer", async () => {
    const result = await lib.assignRequest(head, { requestId, assignedToId: officer.id });
    expect(result.ok).toBe(true);

    const updated = await prisma.request.findUniqueOrThrow({ where: { id: requestId } });
    expect(updated.status).toBe("ASSIGNED");
    expect(updated.assignedOfficerId).toBe(officer.id);
  });

  it("lets the assigned officer move the request through to resolution", async () => {
    let result = await lib.updateRequestStatus(officer, { requestId, status: "IN_PROGRESS" });
    expect(result.ok).toBe(true);

    result = await lib.updateRequestStatus(officer, { requestId, status: "RESOLVED" });
    expect(result.ok).toBe(true);

    const updated = await prisma.request.findUniqueOrThrow({ where: { id: requestId } });
    expect(updated.status).toBe("RESOLVED");
    expect(updated.resolvedAt).not.toBeNull();
  });

  it("only the original requester (or admin) can close a resolved request", async () => {
    const blocked = await lib.closeRequest(officer, requestId);
    expect(blocked.ok).toBe(false);

    const allowed = await lib.closeRequest(staff, requestId);
    expect(allowed.ok).toBe(true);

    const updated = await prisma.request.findUniqueOrThrow({ where: { id: requestId } });
    expect(updated.status).toBe("CLOSED");
  });

  it("generates a printable PDF for the request", async () => {
    const full = await lib.getRequestForViewing(admin, requestId);
    expect(full).not.toBeNull();
    const pdf = await pdfLib.generateRequestPdf(full);
    expect(pdf.byteLength).toBeGreaterThan(500);
    expect(pdf.subarray(0, 5).toString("utf-8")).toBe("%PDF-");
  });
});

describe("transfer", () => {
  it("moves the request to another department while preserving the reference number", async () => {
    const created = await lib.createRequest(staff, {
      receivingDepartmentId: ict.id,
      subject: "Air conditioning issue",
      details: "This is actually a maintenance issue, not an ICT one.",
      priority: "NORMAL",
    });
    expect(created.ok).toBe(true);

    const transfer = await lib.transferRequest(head, {
      requestId: created.data.id,
      toDepartmentId: maintenance.id,
      reason: "This concerns HVAC equipment, not IT.",
    });
    expect(transfer.ok).toBe(true);

    const updated = await prisma.request.findUniqueOrThrow({
      where: { id: created.data.id },
    });
    expect(updated.receivingDepartmentId).toBe(maintenance.id);
    expect(updated.referenceNumber).toBe(created.data.referenceNumber);
    expect(updated.assignedOfficerId).toBeNull();

    const transferLog = await prisma.requestTransfer.findFirst({
      where: { requestId: created.data.id },
    });
    expect(transferLog).not.toBeNull();
  });

  it("rejects a transfer from someone who does not head the current department", async () => {
    const created = await lib.createRequest(staff, {
      receivingDepartmentId: ict.id,
      subject: "Another request",
      details: "Some details about this request for testing purposes.",
      priority: "LOW",
    });
    expect(created.ok).toBe(true);

    const result = await lib.transferRequest(officer, {
      requestId: created.data.id,
      toDepartmentId: maintenance.id,
      reason: "Trying to transfer without permission.",
    });
    expect(result.ok).toBe(false);
  });
});
