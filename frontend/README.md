# NexoEDU — Frontend

Web interface for the NexoEDU platform: a **SPA (Single Page Application)** built in **vanilla JavaScript**. It consumes the backend REST API and renders different views per role (superadmin, administrador, estudiante).

## Tech stack

- **Vanilla JavaScript** (ES Modules) 
- **Vite** — dev server and bundler
- **Tailwind CSS v4** — styling with design tokens (`@theme` in `style.css`)
- **Custom router** built on the History API (navigation without full page reloads)

## What's in this folder

```
frontend/
├── index.html            # Root HTML where the SPA mounts
├── vite.config.js        # Vite configuration
├── vercel.json           # Rewrites for the Vercel deployment (everything → index.html)
├── public/               # Static assets (logos, icons, brand images)
└── src/
    ├── main.js           # Entry point: boots the router
    ├── style.css         # Tailwind v4 + design tokens (palette, fonts)
    ├── assets/           # Images used from within the code
    ├── modules/          # App core
    │   ├── router.js     #   SPA router: maps routes (with :id) to views, guards by role
    │   ├── http.js       #   Central HTTP client (handles cookies and token refresh on 401)
    │   ├── auth.js       #   Session state and logged-in user
    │   └── config.js     #   API base URL and constants
    ├── services/         # One module per resource, wraps the API calls
    │   ├── authService.js · studentService.js · campaignService.js
    │   └── institutionService.js · adminService.js · catalogService.js
    ├── components/        # Reusable UI pieces shared across views
    │   ├── ui.js         #   UI helpers (cards, badges, dates, skeletons, status pill…)
    │   ├── Navbar.js · Sidebar.js · icons.js · toast.js · confirm.js · modalA11y.js
    │   └── EditorCriteria.js · SelectorBarrio.js   # form-specific components
    └── views/            # One view per screen (see below)
```

### Views (`src/views/`)

Each view is an **object-module** with a `render()` method that returns the screen's DOM:

| View | Purpose |
|---|---|
| `Login.js` | Sign in |
| `DashboardSuperadmin.js` / `DashboardEscuela.js` | Main panel per role |
| `GestionInstituciones.js` / `InstitucionPerfil.js` | Institutions (list and profile) — superadmin |
| `GestionAdmins.js` | Institutional admins — superadmin |
| `GestionEstudiantes.js` | Students and graduates — administrador |
| `GestionCampanias.js` | Campaigns (create, edit, detail) |
| `MiPerfil.js` / `MisCampanias.js` | Student views (their profile and their campaigns) |
| `Layout.js` | Shared shell (navbar + sidebar + content) |
| `NotFound.js` / `Forbidden.js` / `Placeholder.js` | Error / placeholder screens |

## How it works (in brief)

1. `main.js` boots the **router**, which renders the matching **view** based on the URL and checks the role.
2. Views request data through the **services**, which centralize the API calls.
3. Every request goes through **`http.js`**, which sends the session cookie and, if a token expires (401), automatically tries to refresh it.
4. **Components** (`ui.js`, modals, toasts, etc.) avoid repeating markup and keep the UI consistent.

## Running (local)

```bash
cd frontend
npm install
npm run dev
```

Frontend on `http://localhost:5173`. By default it points to the local backend (`http://localhost:3000/api`).

### Environment variable

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL. Not needed locally (defaults to `http://localhost:3000/api`). In production it points to the Render backend, e.g. `https://nexoedu-backend.onrender.com/api` |

## Deployment

Deployed on **Vercel** with `Root Directory = frontend` (Vite framework). `vercel.json` rewrites all routes to `index.html` so the SPA router works with direct links. `VITE_API_URL` is configured in the Vercel dashboard (Production and Preview environments).

> See the [root README](../README.md) to run frontend + backend together.
