# RIWI-Projects

A web platform for tracking students and graduates across educational institutions, built through update campaigns managed by school admins and a super admin.

## Tech Stack

**Frontend:** Vanilla JavaScript SPA, Vite, Tailwind CSS
**Backend:** Node.js, Express, PostgreSQL (via `pg`)
**Architecture:** Monorepo with two independent packages (`frontend/`, `backend/`), backend follows an MVC pattern (Model → Controller → Route)

## Project Structure

```
RIWI-Projects/
├── backend/
│   ├── models/         # Database queries only (no req/res)
│   ├── controllers/     # Request handling & validation
│   ├── routes/            # Endpoint definitions
│   ├── db.js               # PostgreSQL connection pool
│   ├── index.js             # Express app entry point
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── views/       # Page-level components (Login, Dashboard...)
│       ├── modules/       # Client-side router, auth state, http wrapper
│       ├── services/       # API calls, grouped by feature (mirrors backend controllers)
│       └── components/       # Reusable UI pieces
│
└── package.json           # Root scripts to run both projects together
```

## Getting Started

### 1. Install dependencies (both projects)

```bash
npm run install:all
```

This installs `backend/` and `frontend/` dependencies separately — they don't share `node_modules`.

### 2. Set up environment variables

Copy the example file and fill in your local PostgreSQL credentials:

```bash
cp backend/.env.example backend/.env
```

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
PORT=3000
```

`.env` is gitignored — never commit it.

### 3. Run the project

```bash
npm run dev
```

This starts both the backend (port `3000`) and the frontend (Vite dev server) at once, using `concurrently`.

To run them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

## Backend Conventions

- **Models** (`backend/models/`) only talk to the database. No `req`/`res`, no HTTP logic.
- **Controllers** (`backend/controllers/`) handle the request, validate input, call the model, and shape the response.
- **Routes** (`backend/routes/`) only map an HTTP method + path to a controller function — no logic.
- Every SQL query is parameterized (`$1`, `$2`, ...) — never concatenate raw input into a query.

When adding a new feature (e.g. institutions, campaigns), follow this same three-file pattern.

## Frontend Conventions

- **Services** (`frontend/src/services/`) are the only place that call the backend API — views should never call `fetch` directly.
- **Views** (`frontend/src/views/`) render UI and call services.
- Client-side routing and session state live in `frontend/src/modules/`.

## API Testing

Use Thunder Client (VS Code extension) or Postman to test endpoints manually. Example:

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "superadmin@gmail.com",
  "password": "admin"
}
```
