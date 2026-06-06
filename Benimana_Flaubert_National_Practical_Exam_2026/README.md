# SwiftWheels VRS — Vehicle Rental & Reservation Subsystem

A real-time, web-based system for **SwiftWheels Enterprises** (Huye City, Southern
Province, Rwanda) that replaces logbooks and paper forms. It manages **Customers**,
**Vehicles** and **Reservations/Rentals**, with session login, search, full CRUD and a
printable Customer–Vehicle reservation-rental report.

Built with **React.js** (Vite) on the front end and **Node.js / Express.js** with
**MySQL** (via the official `mysql2` driver, parameterized queries, no ORM) on the back end.

---

## Entities & relationships

| Entity | Primary key | Foreign keys |
|--------|-------------|--------------|
| `Users` | User_ID | — |
| `Customer` | Customer_ID | owner_id → Users |
| `Vehicle` | Plate_Number | owner_id → Users |
| `Reservation_Rental` | Reservation_ID | Customer_ID → Customer, Plate_Number → Vehicle, Recorded_By → Users |

- A **Customer** makes many reservations/rentals; each reservation belongs to one customer. (1:M)
- A **Vehicle** is reserved/rented many times; each reservation involves one vehicle. (1:M)
- A **User** records many reservations/rentals; each reservation is recorded by one user. (1:M)

See **ERD.md** (Mermaid erDiagram) and **CONTEXT-DIAGRAM.md** (Level-0 DFD).

---

## Prerequisites

- Node.js 18+ and npm
- A running **MySQL** server (5.7+/8.x). The app **creates the `VRS` database and tables
  automatically** on first start — you only need the server running and valid credentials.

---

## 1) Back end

```bash
cd backend-project
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
# edit .env -> set DB_USER, DB_PASSWORD, SESSION_SECRET
npm run dev
```

The server:
1. validates required env vars,
2. connects to MySQL and creates the **VRS** database + tables if missing,
3. seeds an admin user and a few sample rows,
4. listens on **http://localhost:5000**.

**Default admin login** (from `.env`): username `admin`, password `change-me`,
recovery code `1234`. Change these in `.env`.

### API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | create account (returns one-time recovery code) |
| POST | `/api/auth/login` | session login |
| POST | `/api/auth/logout` | destroy session |
| GET  | `/api/auth/me` | current session user |
| POST | `/api/auth/recover/verify` · `/reset` | password recovery |
| GET/POST/PUT/DELETE | `/api/customers` | Customer CRUD + `?search=` |
| GET/POST/PUT/DELETE | `/api/vehicles` | Vehicle CRUD + `?search=` |
| GET/POST/PUT/DELETE | `/api/reservations` | Reservation CRUD + `?search=` |
| GET | `/api/reports/dashboard` | dashboard aggregation |
| GET | `/api/reports/reservations?from=&to=` | reservation-rental report |

All non-auth routes require a valid session (HTTP 401 otherwise). Responses use
`{ data }` on success and `{ error }` on failure.

---

## 2) Front end

```bash
cd frontend-project
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```

Opens on **http://localhost:5173**. Sign in with the seeded admin, or register a new
account (save the one-time recovery code shown).

---

## Features (maps to the exam tasks)

1. **ERD** — `ERD.md` with PK/FK and the three 1:M relationships.
2. **Level-0 DFD** — `CONTEXT-DIAGRAM.md`.
3. **VRS database** — `Customer`, `Vehicle`, `Reservation_Rental`, `Users` created from `config/schema.sql`.
4. **Front/back environments** — Vite + React, Express + MySQL.
5. **CRUD + search + responsive UI** — one page per entity, searchable/sortable/paginated tables.
6. **Session login** — express-session with httpOnly cookies (not JWT).
7. **Report** — Customer–Vehicle reservation-rental report with all 16 fields, date-range filter and print (all columns fit without horizontal scrolling).

### Access, roles & rules
- **Admin approval workflow** — a new account registers as `pending` (no session is started) and **cannot sign in until an admin approves it**. The admin approves accounts on the **Users** page (`/users`, admin-only); a non-admin gets 403 there and the link is hidden.
- **Shared data** — every approved user sees the **same** Customers, Vehicles and Reservations (the creating user is still recorded via `owner_id`). Only admins can approve users.
- **Vehicle permissions** — Vehicles are **read-only for non-admin users**: any approved user can view the fleet (needed to book reservations), but **only the admin** can create, update or delete vehicles. Enforced server-side (`requireAdmin` on POST/PUT/DELETE `/api/vehicles`, 403 otherwise) and in the UI (the create form, row Edit/Delete and the dashboard "New Vehicle" action are hidden for non-admins). Customers and Reservations remain full-CRUD for all approved users.
- **Vehicle plates** — cars `RAB 123 A` (3-letter prefix) and **motorcycles `RL 123 A`** (the `RL` prefix) are both accepted; `Motorcycle` is a vehicle type.
- **Reservation date rules** — Reservation date and Start date are fixed to **today**; End date is **today or future**; Rental date is **today**; Return date is **today or future**.
- **Default admin:** `admin` / `change-me` (recovery code `1234`), already approved on seed.

---

## Build Phases (the steps followed)

1. **Design** — modelled the four entities, picked PK/FK, drew the ERD and Level-0 context diagram.
2. **Database** — wrote `schema.sql` (idempotent `CREATE TABLE` with FK constraints) and a bootstrap that creates the `VRS` database and seeds sample data.
3. **Backend skeleton** — Express app, CORS, sessions, rate limiting, env validation.
4. **Data layer** — `mysql2` pool + per-entity data-access models with parameterized queries.
5. **Controllers & routes** — thin routes → controllers (validation, status codes) → models; auth with bcrypt + recovery codes.
6. **Reports** — single JOIN/aggregate queries for the dashboard and the reservation-rental report.
7. **Frontend foundation** — Vite, Tailwind (container queries), shadcn/ui, axios client, AuthContext.
8. **Pages** — Landing, Auth, Recover, Dashboard, Customer, Vehicle, Reservation, Reports.
9. **Polish** — validation on both ends, toasts, loading/empty states, mobile-first responsive layout, print styles.
