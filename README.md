# ORMS — Office Request Management System

A centralized platform where any staff member can submit a request to any
department; the receiving department's Head reviews it and delegates it to
an officer, who works it through to resolution. Built for an institutional
office environment (e.g. a court registry / government office) in Nigeria.

This is a genuinely functional prototype — real authentication, a real
database, real authorization checks on every action — architected so it can
grow into a production system without a rewrite.

## Tech stack

| Layer          | Choice                                              |
| -------------- | ---------------------------------------------------- |
| Frontend       | Next.js 15 (App Router), TypeScript, Tailwind CSS    |
| Backend        | Next.js Server Actions + Route Handlers              |
| Database       | PostgreSQL (Supabase)                                |
| ORM            | Prisma                                               |
| Auth           | Username/password, bcrypt hashing, signed JWT session cookie (`jose`) |
| Validation     | Zod                                                  |
| Charts         | Recharts                                             |
| PDF generation | pdfkit                                               |
| Tests          | Vitest                                               |

### Database

Runs on PostgreSQL via Supabase. Get your connection string from the
Supabase dashboard (Settings → Database → Connection string → URI, the
direct connection on port 5432, not the pooled one — `prisma db push` and
migrations need a direct connection) and put it in `.env` as `DATABASE_URL`.
The schema has no Postgres-specific features, so it would also run on any
other Postgres host, or on SQLite for offline local testing if you ever
need that (just `provider = "sqlite"` and a `file:` URL).

## Getting started

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL and SESSION_SECRET
npm run db:generate           # generates the Prisma client
npm run db:push               # applies the schema to your database
npm run db:seed               # loads demo departments, users, and requests
npm run dev
```

Visit `http://localhost:3000` and sign in with any account from the table
below. To wipe and reseed at any point: `npm run db:reset`.

## Demo credentials

All accounts are fictional. The seed script (`prisma/seed.ts`) creates one
System Administrator, one Management user, a Head and one-or-two Officers
per department, and eight Staff accounts. The full list — usernames and
passwords — is printed to the console at the end of `npm run db:seed`. A few
to get started with:

| Role                  | Username      | Password         |
| ---------------------- | ------------- | ----------------- |
| System Administrator  | `admin`       | `Admin@12345`      |
| Management             | `management`  | `Management@123`   |
| ICT Department Head    | `ict.head`    | `Head@12345`       |
| ICT Officer            | `ict.officer1`| `Officer@123`      |
| Staff (Registry)       | `ifeoma.staff`| `Staff@12345`      |

Change or remove these before any non-local deployment.

## Request workflow

```
Staff creates request → selects receiving department → submits
  → Department Head receives it (status: Received)
  → Head assigns it to an Officer in their department (status: Assigned)
  → Officer works it (In Progress → optionally Awaiting Information)
  → Officer marks it Resolved
  → Requester confirms → Closed
```

There is no approval step in this MVP — assignment is a delegation, not a
sign-off. A Department Head can **Transfer** a misrouted request to another
department at any point before it's resolved; the reference number never
changes, and the full transfer history is kept (`RequestTransfer` +
`RequestStatusHistory`). See `src/lib/requests.ts` for the implementation of
every transition — each one runs inside a single Prisma transaction that
updates the request, appends to its status history, writes an audit log
entry, and creates the relevant notifications together.

## Roles

Enforced **server-side** on every page and Server Action (`src/lib/permissions.ts`
+ `src/lib/authorization.ts`) — never only by hiding UI. A request's detail
page and every mutation re-derives permission from the current database
state on every request; nothing is trusted from the client.

- **Staff** — submit requests, track their own, comment, confirm/close resolved ones.
- **Department Officer** — see and act on requests assigned to them.
- **Department Head** — manage their department's inbox: assign, reassign, transfer, review stats.
- **Management** — read-only, organization-wide oversight and reports.
- **System Administrator** — manage users and departments, view everything, view the audit log.

Unauthorized access to a specific request (e.g. editing the `id` in the URL)
returns a generic **404**, not a 403 — so a guess can't be used to confirm a
record exists. See `getRequestForViewing` in `src/lib/requests.ts` and the
attachment/PDF route handlers.

## Adding a department

As System Administrator: **Departments → Create Department**. No code
change needed — departments are database records (`Department` model), and
every part of the app (the New Request dropdown, filters, dashboards) reads
from that table. To make someone that department's Head, edit their user
and set Role = Department Head with that department — the app enforces at
most one active Head per department.

## Adding a user

As System Administrator: **Users → Create User**. Set their role and
department (department is required for Staff, Officer, and Department Head
roles). A temporary password is set at creation; the user should change it
from **Profile** after first login, or an admin can **Reset Password** at
any time.

## Project structure

```
prisma/schema.prisma       Data model
prisma/seed.ts              Demo data
src/lib/                    Business logic, isolated from UI
  db.ts                      Prisma client singleton
  auth.ts                    Password hashing (bcrypt)
  session.ts                 Session cookie issuing/verification (jose)
  permissions.ts              Pure RBAC rules (no DB/framework dependency — unit tested directly)
  authorization.ts            requireUser/requireRole + re-exports permissions.ts
  requests.ts                  Request lifecycle: create/assign/transfer/status/comment/attach
  reference-number.ts          Atomic ORMS-YYYY-NNNNNN generator
  audit.ts / notifications.ts  Audit log and in-app notifications
  pdf.ts                       Printable request record (pdfkit)
  storage.ts                   File storage abstraction (local disk today; swap for S3 later)
  validation.ts                Zod schemas
  rate-limit.ts                Login rate limiting
src/middleware.ts            Coarse auth gate (defense-in-depth; real checks are server-side)
src/app/                     Routes (Next.js App Router)
src/components/              UI, grouped by feature
tests/                       Vitest unit + integration tests
```

## Security

- Passwords hashed with bcrypt (12 rounds), never logged or stored in plaintext.
- Sessions are signed JWTs (`SESSION_SECRET`) in an `httpOnly`, `sameSite=lax`,
  `secure`-in-production cookie. Every request re-verifies the user is still
  active in the database — disabling an account takes effect immediately.
- Authorization is enforced in Server Components and Server Actions, not the
  client. `src/middleware.ts` is a fast, coarse gate only; it cannot reach
  the database, so it never makes the final authorization decision.
- Login is rate-limited per username (in-memory for this prototype — see the
  comment in `src/lib/rate-limit.ts` for the swap to a shared store like
  Redis in a multi-instance deployment).
- File uploads are restricted by MIME type and size (`src/lib/validation.ts`),
  stored under a generated filename (not the original), and served only
  through an authenticated route handler that re-checks the requester's
  permission on the parent request.
- All queries go through Prisma (parameterized), so there is no hand-built
  SQL and no SQL injection surface.
- React escapes all rendered content by default (XSS protection); no
  `dangerouslySetInnerHTML` is used anywhere in this codebase.
- Every consequential action (login, request created/assigned/transferred/
  resolved/closed, comments, attachments, user/department changes) is
  written to `AuditLog`, which no non-admin role can read or modify.

## Using a different Postgres host

Nothing in the codebase is Supabase-specific — swap `DATABASE_URL` in
`.env` for any Postgres connection string (another Supabase project, RDS,
Render Postgres, a local install, whatever) and everything else is
unchanged. `npm run db:generate && npm run db:push && npm run db:seed`
against the new URL and you're on it.

## Running tests

```bash
npm run db:generate   # required once — the integration tests use a real Prisma client
npm test
```

`tests/authorization.test.ts` and `tests/auth.test.ts` are pure unit tests
(no database, no network — they'll run anywhere). `tests/requests.test.ts`
runs the full request lifecycle — creation, unauthorized-access rejection,
assignment, status transitions, resolution, closing, transfer, and PDF
generation — against your real `DATABASE_URL`, isolated in its own Postgres
schema (`test_orms`) so it never touches your demo data, and drops that
schema when it finishes.

## Deployment notes

This is a prototype; before any real deployment:

- Switch to PostgreSQL (above) and set a strong, unique `SESSION_SECRET`.
- Put the app behind HTTPS (the session cookie is only marked `secure` when
  `NODE_ENV=production`, which requires HTTPS to actually protect it).
- Move file storage off local disk to persistent object storage if you
  deploy on ephemeral infrastructure — swap `src/lib/storage.ts` for an
  S3-compatible client; nothing else needs to change, since every caller
  only depends on `saveFile`/`resolveFilePath`.
- Replace the in-memory rate limiter with a shared store if you run more
  than one instance.
- Review and change (or remove) every seeded demo account.

## Deliberately out of scope for this MVP

Per the brief, these are designed to bolt on later without restructuring the
app: SSO, institutional email/SMS notifications, SLA tracking and automatic
escalation (the "Overdue" dashboard stat is a simple time-based heuristic,
not a real SLA engine — see `src/lib/dashboard.ts`), department-specific
request forms, approval workflows, and advanced document management.
