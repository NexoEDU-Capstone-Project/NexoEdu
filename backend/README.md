# NexoEdu — Backend

REST API for a student and graduate tracking platform. Educational institutions manage their students and graduates through update campaigns, run by school admins and a super admin, so records stay current over time.

## Tech Stack

- **Runtime:** Node.js, Express 5
- **Database:** PostgreSQL (hosted on Supabase, with a local Postgres fallback for development)
- **Auth:** JWT (access + refresh tokens), delivered via an `httpOnly` cookie
- **API Docs:** Swagger / OpenAPI, served interactively at `/api-docs`
- **Architecture:** MVC (Model → Controller → Route), one Model/Controller/Route trio per resource

## Project Structure

```
backend/
├── models/          # Raw SQL queries only — no req/res, no HTTP logic
├── controllers/      # Request handling, validation, and response shaping
├── routes/            # HTTP method + path → controller mapping, no logic
├── middleware/          # authToken (JWT verification), requireRole (authorization)
├── helpers/               # Small reusable queries shared across models (e.g. role lookup)
├── config/                  # cookieOptions, Swagger setup
├── docs/                      # Swagger/OpenAPI comment blocks, one file per resource
├── db.js                        # PostgreSQL connection pool
├── index.js                      # Express app entry point
├── .env.example
└── package.json
```

Each resource (auth, institutions, admins, campaigns, students) follows the same three-file pattern. When adding a new one, replicate that structure rather than adding logic to `index.js`.

## Prerequisites

- Node.js (v18+)
- A Supabase project (or a local PostgreSQL instance for development — see below)
- npm

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values:

| Variable | Description |
|---|---|
| `SUPABASE_DB_URL` | Connection string for the Supabase Postgres instance |
| `USE_LOCAL_DB` | `true` to use a local Postgres instance instead of Supabase, `false` (default) to use Supabase |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Only used when `USE_LOCAL_DB=true` |
| `PORT` | Port the Express server listens on (default `3000`) |
| `JWT_SECRET` | Signing secret for access tokens |
| `JWT_EXPIRES_IN` | Access token lifetime (e.g. `1h`) |
| `JWT_REFRESH_SECRET` | Signing secret for refresh tokens (must differ from `JWT_SECRET`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (e.g. `7d`) |

`.env` is gitignored and must never be committed. `db.js` picks the connection based on `USE_LOCAL_DB`, so switching between Supabase and a local database never requires editing committed code.

## Installation & Running

```bash
cd backend
npm install
npm run dev
```

The server starts on `http://localhost:3000` and logs a database connectivity check on startup.

> To run the full project (frontend + backend together), see the [root README](../README.md).

## Authentication & Roles

Login issues two JWTs: a short-lived **access token** (sent both as an `httpOnly` cookie and in the response body) and a longer-lived **refresh token** (returned in the response body, used to obtain a new access token via `/api/auth/refresh` without re-entering credentials).

Three roles exist, matched exactly as stored in the database:

| Role | Access |
|---|---|
| `superadmin` | Full access: manage institutions, admins, and campaigns across all institutions |
| `administrador` | Manage students, campaigns, and view data scoped to their own institution only |
| `estudiante` | View and enroll in campaigns they're eligible for, view their own eligible campaigns |

Every protected route requires a valid access token (`authToken` middleware); role-restricted routes additionally use `requireRole(...)`. Scope restrictions (e.g. an admin only accessing their own institution's students) are enforced inside the controller using `institution_id`/`people_id` embedded in the token payload, not by the client.

## API Reference

Full interactive documentation, including request/response schemas, is available at:

```
http://localhost:3000/api-docs
```

Quick endpoint index:

| Resource | Method & Path | Roles |
|---|---|---|
| Auth | `POST /api/auth/login` | Public |
| Auth | `POST /api/auth/refresh` | Public (valid refresh token) |
| Auth | `POST /api/auth/logout` | Authenticated |
| Institutions | `GET /api/institutions` | Authenticated |
| Institutions | `GET /api/institutions/:id` | Authenticated |
| Institutions | `POST /api/institutions` | superadmin |
| Institutions | `PUT /api/institutions/:id` | superadmin |
| Institutions | `DELETE /api/institutions/:id` | superadmin |
| Admins | `POST /api/admins` | superadmin |
| Admins | `PUT /api/admins/:id/assign` | superadmin |
| Admins | `DELETE /api/admins/:id` | superadmin |
| Campaigns | `GET /api/campaigns` | Authenticated |
| Campaigns | `GET /api/campaigns/mine` | estudiante |
| Campaigns | `GET /api/campaigns/:id` | Authenticated |
| Campaigns | `POST /api/campaigns` | superadmin, administrador |
| Campaigns | `POST /api/campaigns/:id/criteria` | superadmin, administrador (campaign owner) |
| Campaigns | `GET /api/campaigns/:id/criteria` | Authenticated |
| Campaigns | `POST /api/campaigns/:id/enroll` | estudiante |
| Students | `GET /api/students` | superadmin, administrador |
| Students | `GET /api/students/:id` | superadmin, administrador |
| Students | `POST /api/students` | superadmin, administrador |
| Students | `PUT /api/students/:id` | superadmin, administrador |
| Students | `DELETE /api/students/:id` | superadmin, administrador |
| Students | `GET /api/students/:id/eligible-campaigns` | superadmin, administrador |

`GET /api/students` supports `?page=`, `?limit=`, and `?search=` query parameters for pagination and search by name/document.

## Backend Conventions

- **Models** only run parameterized SQL (`$1`, `$2`, ...) — raw input is never concatenated into a query.
- **Controllers** validate input, call the model, and map database error codes to meaningful HTTP responses (`23505` → 409 conflict, `23503` → 404/foreign key violation, `23514` → 400 check constraint violation).
- **Routes** contain no logic — only method, path, middleware chain, and controller function.
- Sensitive fields (e.g. `institution_id`, `people_id`, `credential_id`) used for authorization are always read from the verified JWT payload (`req.user`), never trusted from the request body.
- Multi-step writes that must succeed or fail together (e.g. creating a campaign and its scope) run inside a database transaction (`BEGIN`/`COMMIT`/`ROLLBACK`) to avoid orphaned records.

## Database

The database schema, migrations, and seed data live in a separate repository: [Database_Structure](https://github.com/Proyecto-Integrador-Riwi/Database_Structure).

Key business rules enforced at the database level (not just in application code) include:

- An institution can have at most one admin credential (`UNIQUE` constraint on `institutions.credential_id`).
- A campaign's scope must be exactly one of institution, neighborhood, or locality — enforced by a `CHECK` constraint.
- A student cannot enroll in the same campaign twice (`UNIQUE` constraint on `campaign_enrollments`).

## Known Limitations

- `DELETE /api/institutions/:id` performs a hard delete rather than a soft delete (deactivation). This is a deliberate scope decision for the current milestone.
- Passwords are currently stored in plain text.

## Planned Improvements

- Soft delete for institutions (deactivation instead of permanent removal).
- Hashed passwords (bcrypt) instead of plain text.
- Students updating their own profile data during an active campaign they're enrolled in.
- Automatic "last updated" timestamp recorded whenever a student updates their data.
- Dashboard/indicators endpoints: totals by status (students/graduates, updated/pending).
- Filtering students by status (active/graduate, updated/pending) in addition to the existing name/document search.
