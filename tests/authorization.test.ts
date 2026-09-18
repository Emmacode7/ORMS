import { describe, it, expect } from "vitest";
import {
  canViewRequest,
  canActOnRequest,
  canManageRequest,
  canUpdateStatus,
  canCloseRequest,
  type PermissionUser,
  type MinimalRequest,
} from "@/lib/permissions";

const ICT = "dept-ict";
const MAINTENANCE = "dept-maintenance";

function user(overrides: Partial<PermissionUser>): PermissionUser {
  return { id: "user-1", role: "STAFF", departmentId: null, ...overrides };
}

function request(overrides: Partial<MinimalRequest>): MinimalRequest {
  return {
    requesterId: "requester-1",
    assignedOfficerId: null,
    receivingDepartmentId: ICT,
    requestingDepartmentId: MAINTENANCE,
    ...overrides,
  };
}

describe("canViewRequest — IDOR protection", () => {
  it("lets a staff member view their own request", () => {
    const staff = user({ id: "u1", role: "STAFF" });
    const req = request({ requesterId: "u1" });
    expect(canViewRequest(staff, req)).toBe(true);
  });

  it("blocks a staff member from viewing another staff member's request", () => {
    const staff = user({ id: "u1", role: "STAFF" });
    const req = request({ requesterId: "someone-else" });
    expect(canViewRequest(staff, req)).toBe(false);
  });

  it("blocks an officer from viewing a request not assigned to them", () => {
    const officer = user({ id: "officer-1", role: "DEPARTMENT_OFFICER", departmentId: ICT });
    const req = request({ receivingDepartmentId: ICT, assignedOfficerId: "officer-2" });
    expect(canViewRequest(officer, req)).toBe(false);
  });

  it("lets an officer view a request assigned to them", () => {
    const officer = user({ id: "officer-1", role: "DEPARTMENT_OFFICER", departmentId: ICT });
    const req = request({ receivingDepartmentId: ICT, assignedOfficerId: "officer-1" });
    expect(canViewRequest(officer, req)).toBe(true);
  });

  it("lets a department head view any request sent to their department", () => {
    const head = user({ id: "head-1", role: "DEPARTMENT_HEAD", departmentId: ICT });
    const req = request({ receivingDepartmentId: ICT });
    expect(canViewRequest(head, req)).toBe(true);
  });

  it("blocks a department head from viewing another department's request", () => {
    const head = user({ id: "head-1", role: "DEPARTMENT_HEAD", departmentId: ICT });
    const req = request({ receivingDepartmentId: MAINTENANCE });
    expect(canViewRequest(head, req)).toBe(false);
  });

  it("lets management view any request", () => {
    const mgmt = user({ id: "m1", role: "MANAGEMENT" });
    expect(canViewRequest(mgmt, request({}))).toBe(true);
  });

  it("lets a system admin view any request", () => {
    const admin = user({ id: "a1", role: "SYSTEM_ADMIN" });
    expect(canViewRequest(admin, request({}))).toBe(true);
  });
});

describe("canActOnRequest — commenting / attachments", () => {
  it("management cannot comment on another department's request (read-only oversight)", () => {
    const mgmt = user({ id: "m1", role: "MANAGEMENT", departmentId: "dept-management" });
    expect(canActOnRequest(mgmt, request({ receivingDepartmentId: ICT }))).toBe(false);
  });

  it("management CAN comment on a request routed to their own department", () => {
    const mgmt = user({ id: "m1", role: "MANAGEMENT", departmentId: "dept-management" });
    expect(
      canActOnRequest(mgmt, request({ receivingDepartmentId: "dept-management" }))
    ).toBe(true);
  });

  it("the requester can comment on their own request", () => {
    const staff = user({ id: "u1", role: "STAFF" });
    expect(canActOnRequest(staff, request({ requesterId: "u1" }))).toBe(true);
  });

  it("an unrelated staff member cannot comment", () => {
    const staff = user({ id: "u1", role: "STAFF" });
    expect(canActOnRequest(staff, request({ requesterId: "someone-else" }))).toBe(false);
  });
});

describe("canManageRequest — assign / transfer", () => {
  it("only the receiving department's head (or admin) can assign", () => {
    const head = user({ id: "head-1", role: "DEPARTMENT_HEAD", departmentId: ICT });
    const wrongHead = user({ id: "head-2", role: "DEPARTMENT_HEAD", departmentId: MAINTENANCE });
    const req = request({ receivingDepartmentId: ICT });
    expect(canManageRequest(head, req)).toBe(true);
    expect(canManageRequest(wrongHead, req)).toBe(false);
  });

  it("an officer cannot assign or transfer", () => {
    const officer = user({ id: "o1", role: "DEPARTMENT_OFFICER", departmentId: ICT });
    expect(canManageRequest(officer, request({ receivingDepartmentId: ICT }))).toBe(false);
  });

  it("admin can always manage", () => {
    const admin = user({ id: "a1", role: "SYSTEM_ADMIN" });
    expect(canManageRequest(admin, request({}))).toBe(true);
  });

  it("management can assign/transfer requests routed to their own department, but not others", () => {
    const mgmt = user({ id: "m1", role: "MANAGEMENT", departmentId: "dept-management" });
    expect(canManageRequest(mgmt, request({ receivingDepartmentId: "dept-management" }))).toBe(
      true
    );
    expect(canManageRequest(mgmt, request({ receivingDepartmentId: ICT }))).toBe(false);
  });
});

describe("canUpdateStatus", () => {
  it("the assigned officer can update status", () => {
    const officer = user({ id: "o1", role: "DEPARTMENT_OFFICER", departmentId: ICT });
    const req = request({ receivingDepartmentId: ICT, assignedOfficerId: "o1" });
    expect(canUpdateStatus(officer, req)).toBe(true);
  });

  it("a different officer in the same department cannot update a request assigned to someone else", () => {
    const officer = user({ id: "o2", role: "DEPARTMENT_OFFICER", departmentId: ICT });
    const req = request({ receivingDepartmentId: ICT, assignedOfficerId: "o1" });
    expect(canUpdateStatus(officer, req)).toBe(false);
  });

  it("the department head can update status regardless of who it's assigned to", () => {
    const head = user({ id: "head-1", role: "DEPARTMENT_HEAD", departmentId: ICT });
    const req = request({ receivingDepartmentId: ICT, assignedOfficerId: "o1" });
    expect(canUpdateStatus(head, req)).toBe(true);
  });
});

describe("canCloseRequest", () => {
  it("only the original requester (or admin) can close", () => {
    const requester = user({ id: "u1", role: "STAFF" });
    const otherStaff = user({ id: "u2", role: "STAFF" });
    const admin = user({ id: "a1", role: "SYSTEM_ADMIN" });
    const req = request({ requesterId: "u1" });

    expect(canCloseRequest(requester, req)).toBe(true);
    expect(canCloseRequest(otherStaff, req)).toBe(false);
    expect(canCloseRequest(admin, req)).toBe(true);
  });
});
