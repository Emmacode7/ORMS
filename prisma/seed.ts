/**
 * ORMS demo seed data.
 *
 * Wipes existing data and recreates:
 *  - the 10 prototype departments
 *  - one System Administrator, one Management user
 *  - one Department Head + one or two Officers per department
 *  - eight Staff users spread across departments
 *  - ~18 sample requests in a range of statuses, so every dashboard has
 *    something to show on first run
 *
 * All demo accounts share simple, clearly-fake credentials — see the table
 * this script prints at the end, and README.md "Demo credentials".
 * No real individuals' data is used anywhere in this file.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";
import { nextReferenceNumber } from "../src/lib/reference-number";
import { logAudit } from "../src/lib/audit";
import { notify } from "../src/lib/notifications";

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { key: "ict", name: "ICT" },
  { key: "admin", name: "Administration" },
  { key: "hr", name: "Human Resources" },
  { key: "finance", name: "Finance & Accounts" },
  { key: "registry", name: "Registry" },
  { key: "procurement", name: "Procurement" },
  { key: "maintenance", name: "Maintenance" },
  { key: "legal", name: "Legal" },
  { key: "comms", name: "Communications" },
  { key: "mgmt", name: "Management" },
] as const;

const HEAD_NAMES: Record<string, string> = {
  ict: "David Okonkwo",
  admin: "Ngozi Eze",
  hr: "Ibrahim Sule",
  finance: "Folake Adebayo",
  registry: "Chinedu Obi",
  procurement: "Amina Bello",
  maintenance: "Emmanuel Etim",
  legal: "Grace Nkem",
  comms: "Yusuf Aliyu",
  mgmt: "Patricia Nwosu",
};

const OFFICER_NAMES: Record<string, string[]> = {
  ict: ["Chukwuemeka Nwachukwu", "Amaka Johnson"],
  admin: ["Blessing Udo"],
  hr: ["Musa Danjuma"],
  finance: ["Oluwaseun Ajayi"],
  registry: ["Esther Bassey"],
  procurement: ["Aisha Garba"],
  maintenance: ["Peter Effiong", "Rukayat Suleiman"],
  legal: ["Tunde Fashola"],
  comms: ["Chiamaka Okafor"],
  mgmt: ["Samuel Ekong"],
};

const STAFF_NAMES: { name: string; deptKey: string }[] = [
  { name: "Ifeoma Chukwu", deptKey: "registry" },
  { name: "Abdullahi Mohammed", deptKey: "finance" },
  { name: "Kemi Alabi", deptKey: "hr" },
  { name: "Victor Osaze", deptKey: "legal" },
  { name: "Halima Yakubu", deptKey: "comms" },
  { name: "Chidinma Eze", deptKey: "procurement" },
  { name: "Emeka Nnamdi", deptKey: "admin" },
  { name: "Fatima Lawal", deptKey: "ict" },
];

function usernameFor(name: string, suffix: string): string {
  const first = name.split(" ")[0].toLowerCase();
  return `${first}.${suffix}`.replace(/[^a-z0-9.]/g, "");
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.requestStatusHistory.deleteMany(),
    prisma.requestTransfer.deleteMany(),
    prisma.requestAssignment.deleteMany(),
    prisma.request.deleteMany(),
    prisma.counter.deleteMany(),
    prisma.user.deleteMany(),
    prisma.department.deleteMany(),
  ]);

  console.log("Creating departments...");
  const deptByKey: Record<string, { id: string; name: string }> = {};
  for (const d of DEPARTMENTS) {
    const dept = await prisma.department.create({
      data: { name: d.name, description: `${d.name} department` },
    });
    deptByKey[d.key] = dept;
  }

  const credentials: { role: string; username: string; password: string }[] = [];

  console.log("Creating admin and management accounts...");
  const adminPasswordHash = await hashPassword("Admin@12345");
  await prisma.user.create({
    data: {
      fullName: "System Administrator",
      staffId: "ADM-0001",
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "SYSTEM_ADMIN",
    },
  });
  credentials.push({ role: "System Administrator", username: "admin", password: "Admin@12345" });

  const mgmtPasswordHash = await hashPassword("Management@123");
  await prisma.user.create({
    data: {
      fullName: "Patricia Nwosu",
      staffId: "MGT-0001",
      username: "management",
      passwordHash: mgmtPasswordHash,
      role: "MANAGEMENT",
      departmentId: deptByKey.mgmt.id,
    },
  });
  credentials.push({ role: "Management", username: "management", password: "Management@123" });

  console.log("Creating department heads and officers...");
  const headByDept: Record<string, { id: string; fullName: string }> = {};
  const officersByDept: Record<string, { id: string; fullName: string }[]> = {};

  let seq = 1;
  for (const d of DEPARTMENTS) {
    const headName = HEAD_NAMES[d.key];
    const headUsername = `${d.key}.head`;
    const headPassword = "Head@12345";
    const head = await prisma.user.create({
      data: {
        fullName: headName,
        staffId: `HOD-${String(seq++).padStart(3, "0")}`,
        username: headUsername,
        passwordHash: await hashPassword(headPassword),
        role: "DEPARTMENT_HEAD",
        departmentId: deptByKey[d.key].id,
      },
    });
    headByDept[d.key] = head;
    credentials.push({ role: `${d.name} Head`, username: headUsername, password: headPassword });

    officersByDept[d.key] = [];
    const officerNames = OFFICER_NAMES[d.key];
    for (let i = 0; i < officerNames.length; i++) {
      const officerUsername = `${d.key}.officer${officerNames.length > 1 ? i + 1 : ""}`;
      const officerPassword = "Officer@123";
      const officer = await prisma.user.create({
        data: {
          fullName: officerNames[i],
          staffId: `OFF-${String(seq++).padStart(3, "0")}`,
          username: officerUsername,
          passwordHash: await hashPassword(officerPassword),
          role: "DEPARTMENT_OFFICER",
          departmentId: deptByKey[d.key].id,
        },
      });
      officersByDept[d.key].push(officer);
      credentials.push({
        role: `${d.name} Officer`,
        username: officerUsername,
        password: officerPassword,
      });
    }
  }

  console.log("Creating staff accounts...");
  const staffUsers: { id: string; fullName: string; deptKey: string }[] = [];
  for (const s of STAFF_NAMES) {
    const username = usernameFor(s.name, "staff");
    const password = "Staff@12345";
    const user = await prisma.user.create({
      data: {
        fullName: s.name,
        staffId: `STF-${String(seq++).padStart(3, "0")}`,
        username,
        passwordHash: await hashPassword(password),
        role: "STAFF",
        departmentId: deptByKey[s.deptKey].id,
      },
    });
    staffUsers.push({ id: user.id, fullName: user.fullName, deptKey: s.deptKey });
    credentials.push({ role: "Staff", username, password });
  }

  // ---------------------------------------------------------------------
  // Sample requests
  // ---------------------------------------------------------------------
  console.log("Creating sample requests...");

  type SeedRequest = {
    requester: { id: string; deptKey: string };
    toDeptKey: string;
    subject: string;
    details: string;
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    daysAgo: number;
    outcome:
      | "submitted"
      | "assigned"
      | "in_progress"
      | "awaiting"
      | "resolved"
      | "closed"
      | "transferred";
  };

  const pick = (deptKey: string) =>
    staffUsers.find((s) => s.deptKey === deptKey) ?? staffUsers[0];

  const seedRequests: SeedRequest[] = [
    {
      requester: pick("registry"),
      toDeptKey: "ict",
      subject: "Office computer not powering on",
      details:
        "The desktop computer in my office does not power on this morning. I have checked the power cable and socket; both appear fine.",
      priority: "HIGH",
      daysAgo: 6,
      outcome: "closed",
    },
    {
      requester: pick("finance"),
      toDeptKey: "ict",
      subject: "Unable to access accounting software",
      details: "I keep receiving a login error on the accounting software since this morning.",
      priority: "URGENT",
      daysAgo: 3,
      outcome: "resolved",
    },
    {
      requester: pick("hr"),
      toDeptKey: "maintenance",
      subject: "Air conditioning unit not cooling",
      details: "The AC unit in the HR open office has stopped cooling for the past two days.",
      priority: "NORMAL",
      daysAgo: 4,
      outcome: "in_progress",
    },
    {
      requester: pick("legal"),
      toDeptKey: "procurement",
      subject: "Request for new office chairs",
      details: "We require two new ergonomic office chairs for the legal reading room.",
      priority: "LOW",
      daysAgo: 2,
      outcome: "assigned",
    },
    {
      requester: pick("comms"),
      toDeptKey: "ict",
      subject: "Projector not connecting to laptop",
      details:
        "The projector in the main conference room is not detecting any laptop connected via HDMI.",
      priority: "NORMAL",
      daysAgo: 1,
      outcome: "submitted",
    },
    {
      requester: pick("procurement"),
      toDeptKey: "finance",
      subject: "Delay in vendor payment processing",
      details:
        "Payment for vendor invoice INV-2291 has not been processed although approvals are complete.",
      priority: "HIGH",
      daysAgo: 5,
      outcome: "awaiting",
    },
    {
      requester: pick("admin"),
      toDeptKey: "ict",
      subject: "New staff email account setup",
      details: "Please set up an official email account for a newly resumed staff member.",
      priority: "NORMAL",
      daysAgo: 2,
      outcome: "assigned",
    },
    {
      requester: pick("ict"),
      toDeptKey: "maintenance",
      subject: "Leaking pipe near server room",
      details:
        "There is a slow water leak from the ceiling near the server room entrance. This is urgent given the equipment nearby.",
      priority: "URGENT",
      daysAgo: 3,
      outcome: "in_progress",
    },
    {
      requester: pick("registry"),
      toDeptKey: "administration",
      subject: "Filing cabinets required for archive room",
      details: "The registry archive room requires three additional lockable filing cabinets.",
      priority: "LOW",
      daysAgo: 7,
      outcome: "resolved",
    },
    {
      requester: pick("hr"),
      toDeptKey: "hr",
      subject: "Update staff leave records",
      details: "Please update the leave record for a staff member who returned from annual leave.",
      priority: "NORMAL",
      daysAgo: 1,
      outcome: "submitted",
    },
    {
      requester: pick("finance"),
      toDeptKey: "ict",
      subject: "Printer in accounts office is jamming repeatedly",
      details: "The office printer jams on almost every print job and needs servicing or replacement.",
      priority: "NORMAL",
      daysAgo: 8,
      outcome: "closed",
    },
    {
      requester: pick("legal"),
      toDeptKey: "registry",
      subject: "Retrieve case file for hearing",
      details: "Kindly retrieve the archived case file ref. LEG-2024-118 ahead of next week's hearing.",
      priority: "HIGH",
      daysAgo: 2,
      outcome: "assigned",
    },
    {
      requester: pick("comms"),
      toDeptKey: "procurement",
      subject: "Banners needed for upcoming event",
      details: "We need two large banners printed for the departmental open day next month.",
      priority: "LOW",
      daysAgo: 1,
      outcome: "submitted",
    },
    {
      requester: pick("procurement"),
      toDeptKey: "ict",
      subject: "Laptop request misrouted, should go to Administration",
      details: "This was mistakenly sent to ICT; it concerns furniture procurement for a new hire, not IT equipment.",
      priority: "NORMAL",
      daysAgo: 4,
      outcome: "transferred",
    },
    {
      requester: pick("admin"),
      toDeptKey: "hr",
      subject: "Clarify onboarding checklist for new hires",
      details: "Requesting an updated onboarding checklist to guide the next intake of staff.",
      priority: "LOW",
      daysAgo: 3,
      outcome: "resolved",
    },
    {
      requester: pick("ict"),
      toDeptKey: "finance",
      subject: "Budget approval for network switch replacement",
      details: "ICT requires approval to replace two failing network switches in the server room.",
      priority: "HIGH",
      daysAgo: 6,
      outcome: "awaiting",
    },
    {
      requester: pick("maintenance"),
      toDeptKey: "administration",
      subject: "Request for additional cleaning supplies",
      details: "The maintenance unit is running low on cleaning supplies for the east wing.",
      priority: "LOW",
      daysAgo: 1,
      outcome: "submitted",
    },
    {
      requester: pick("legal"),
      toDeptKey: "mgmt",
      subject: "Approval needed for external counsel engagement",
      details: "Requesting management's review and approval to engage external counsel for a pending matter.",
      priority: "URGENT",
      daysAgo: 2,
      outcome: "assigned",
    },
  ];

  for (const sr of seedRequests) {
    const requestingDept = deptByKey[sr.requester.deptKey];
    const receivingDeptKey = sr.toDeptKey === "administration" ? "admin" : sr.toDeptKey;
    const receivingDept = deptByKey[receivingDeptKey] ?? deptByKey.ict;
    const createdAt = new Date(Date.now() - sr.daysAgo * 24 * 60 * 60 * 1000);

    const referenceNumber = await prisma.$transaction((tx) =>
      nextReferenceNumber(tx, createdAt.getFullYear())
    );

    const request = await prisma.request.create({
      data: {
        referenceNumber,
        subject: sr.subject,
        details: sr.details,
        priority: sr.priority,
        status: "RECEIVED",
        requesterId: sr.requester.id,
        requestingDepartmentId: requestingDept.id,
        receivingDepartmentId: receivingDept.id,
        createdAt,
        updatedAt: createdAt,
      },
    });

    await prisma.requestStatusHistory.createMany({
      data: [
        { requestId: request.id, status: "SUBMITTED", changedById: sr.requester.id, createdAt },
        {
          requestId: request.id,
          status: "RECEIVED",
          note: `Received by ${receivingDept.name}`,
          changedById: sr.requester.id,
          createdAt,
        },
      ],
    });
    await notify(prisma, {
      userId: sr.requester.id,
      requestId: request.id,
      message: `Your request ${referenceNumber} has been submitted successfully.`,
    });
    await logAudit(prisma, {
      actorId: sr.requester.id,
      action: "REQUEST_CREATED",
      entityType: "Request",
      entityId: request.id,
      metadata: { referenceNumber },
    });

    if (sr.outcome === "submitted") continue;

    // Assign
    const officer = officersByDept[receivingDeptKey]?.[0] ?? officersByDept.ict[0];
    const head = headByDept[receivingDeptKey] ?? headByDept.ict;
    const assignedAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);

    if (sr.outcome === "transferred") {
      const targetKey = receivingDeptKey === "ict" ? "admin" : "ict";
      const targetDept = deptByKey[targetKey];
      const transferAt = new Date(createdAt.getTime() + 3 * 60 * 60 * 1000);

      await prisma.requestTransfer.create({
        data: {
          requestId: request.id,
          fromDepartmentId: receivingDept.id,
          toDepartmentId: targetDept.id,
          reason: "This request concerns a different department and should be handled there.",
          transferredById: head.id,
          createdAt: transferAt,
        },
      });
      await prisma.request.update({
        where: { id: request.id },
        data: { receivingDepartmentId: targetDept.id, status: "RECEIVED" },
      });
      await prisma.requestStatusHistory.createMany({
        data: [
          {
            requestId: request.id,
            status: "TRANSFERRED",
            note: `Transferred from ${receivingDept.name} to ${targetDept.name}`,
            changedById: head.id,
            createdAt: transferAt,
          },
          {
            requestId: request.id,
            status: "RECEIVED",
            note: `Received by ${targetDept.name}`,
            changedById: head.id,
            createdAt: transferAt,
          },
        ],
      });
      await logAudit(prisma, {
        actorId: head.id,
        action: "REQUEST_TRANSFERRED",
        entityType: "Request",
        entityId: request.id,
      });
      continue;
    }

    await prisma.request.update({
      where: { id: request.id },
      data: { assignedOfficerId: officer.id, status: "ASSIGNED", updatedAt: assignedAt },
    });
    await prisma.requestAssignment.create({
      data: {
        requestId: request.id,
        assignedToId: officer.id,
        assignedById: head.id,
        createdAt: assignedAt,
      },
    });
    await prisma.requestStatusHistory.create({
      data: {
        requestId: request.id,
        status: "ASSIGNED",
        note: `Assigned to ${officer.fullName}`,
        changedById: head.id,
        createdAt: assignedAt,
      },
    });
    await logAudit(prisma, {
      actorId: head.id,
      action: "REQUEST_ASSIGNED",
      entityType: "Request",
      entityId: request.id,
    });

    if (sr.outcome === "assigned") continue;

    const progressAt = new Date(assignedAt.getTime() + 3 * 60 * 60 * 1000);
    await prisma.request.update({
      where: { id: request.id },
      data: { status: sr.outcome === "awaiting" ? "AWAITING_INFORMATION" : "IN_PROGRESS", updatedAt: progressAt },
    });
    await prisma.requestStatusHistory.create({
      data: {
        requestId: request.id,
        status: sr.outcome === "awaiting" ? "AWAITING_INFORMATION" : "IN_PROGRESS",
        changedById: officer.id,
        createdAt: progressAt,
      },
    });

    if (sr.outcome === "in_progress" || sr.outcome === "awaiting") continue;

    const resolvedAt = new Date(progressAt.getTime() + 5 * 60 * 60 * 1000);
    await prisma.request.update({
      where: { id: request.id },
      data: { status: "RESOLVED", resolvedAt, updatedAt: resolvedAt },
    });
    await prisma.requestStatusHistory.create({
      data: { requestId: request.id, status: "RESOLVED", changedById: officer.id, createdAt: resolvedAt },
    });

    if (sr.outcome === "resolved") continue;

    const closedAt = new Date(resolvedAt.getTime() + 4 * 60 * 60 * 1000);
    await prisma.request.update({
      where: { id: request.id },
      data: { status: "CLOSED", closedAt, updatedAt: closedAt },
    });
    await prisma.requestStatusHistory.create({
      data: { requestId: request.id, status: "CLOSED", changedById: sr.requester.id, createdAt: closedAt },
    });
  }

  console.log("\nSeed complete.\n");
  console.log("Demo credentials (all fictional — see README):");
  console.table(credentials);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
