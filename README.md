# Secure Task Management System (Nx Monorepo)

Role-based task management with NestJS 11 + TypeORM (SQLite) and Angular 17 inside an Nx workspace. Includes shared auth/data libraries, JWT authentication, RBAC guards, and audit logging.

---

## Quick start
1. Install deps: `npm install`
2. Create `api/.env` (see below) or rely on defaults.
3. Start API: `npx nx serve api` (listens on `http://localhost:3333/api`, CORS enabled, creates `taskdb.sqlite` if missing).
4. Seed a demo account (after the API is up): `node scripts/create-test-user.js`  
   - email: `test@example.com` / password: `password123` / role: owner (org id is printed)
5. Start dashboard: `npx nx serve dashboard` (uses `environment.apiUrl`, default `http://localhost:3333/api`).

---

## Backend environment (`api/.env`)
```
PORT=3333
DB_PATH=taskdb.sqlite        # defaults to repo root if unset
JWT_SECRET=super-secret-key
JWT_EXPIRES_IN=1d
NODE_ENV=development
```
ConfigModule loads `api/.env` first, then workspace `.env`. TypeORM synchronize is off when `NODE_ENV=production`.

---

## Frontend API target
Update `dashboard/src/environments/environment.ts` (and `.prod`) `apiUrl` if your backend host/port changes. No runtime `.env` is needed; default is `http://localhost:3333/api`.

---

## Architecture
- `api/` — NestJS backend (JWT auth, RBAC guards, tasks, audit log, TypeORM SQLite)
- `dashboard/` — Angular dashboard (login/register, task CRUD, audit log view)
- `libs/auth/` — Decorators/guards for roles & permissions
- `libs/data/` — Shared enums/interfaces for users, tasks, organizations

---

## Data model
- **User**: id, email, password (hashed), role (`owner|admin|viewer`), organizationId; timestamps.
- **Organization**: id, name, parentId (supports parent/child visibility); relations to users and tasks.
- **Task**: id, title, description, status (`todo|in_progress|done`), category (`work|personal`), organizationId, createdById, assignedToId?; timestamps.
- **AuditLog**: id, action, resourceType, resourceId, userId, details, createdAt.

---

## Access control
- Roles: owner (full org scope), admin (manage within org + parent/child visibility), viewer (read-only in org).
- Permissions:  
  - CREATE_TASK / UPDATE_TASK / DELETE_TASK: owner, admin  
  - READ_TASK: owner, admin, viewer (scoped)  
  - READ_AUDIT_LOG: owner, admin
- Guards/decorators: `JwtAuthGuard`, `RbacGuard`, `PermissionGuard`, `@Roles()`, `@RequirePermissions()`, `@Public()`, `@CurrentUser()`.
- Scope: viewer -> org only; owner/admin -> org + parent/child org tasks/audit entries.

---

## API (REST)
Base URL: `http://localhost:3333/api`

- `POST /auth/register` — `{ email, password, role, organizationId }` -> `{ access_token, user }`
- `POST /auth/login` — `{ email, password }` -> `{ access_token, user }`
- `GET /tasks` — list tasks within scoped orgs
- `GET /tasks/:id` — fetch one (scoped)
- `POST /tasks` — create (owner/admin) `{ title, description, category, status?, assignedToId? }`
- `PUT /tasks/:id` — update (owner/admin)
- `DELETE /tasks/:id` — delete (owner/admin)
- `GET /tasks/audit-log` — audit entries for scoped users (owner/admin)

Auth header: `Authorization: Bearer <jwt>`

---

## Running & tests
- API dev: `npx nx serve api`
- API build: `npx nx build api --configuration=production`
- Dashboard dev: `npx nx serve dashboard`
- Dashboard build: `npx nx build dashboard --configuration=production`
- API unit tests (Jest): `npx nx test api`
- Dashboard unit tests (Angular TestBed runner): `npx nx test dashboard`
- API e2e (Jest): `npx nx e2e api-e2e` (expects API on `PORT`, default 3333)

---

## Future considerations
- JWT refresh/rotation, CSRF protection, secure cookies for production.
- Additional RBAC granularity and caching for permission checks.
- Indexing/pagination for large orgs and background audit sink.
- UX polish: drag-and-drop ordering, completion analytics, keyboard shortcuts, dark/light toggle.
