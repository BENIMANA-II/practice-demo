# SwiftWheels VRS — Vehicle Rental & Reservation Subsystem

A real-time, web-based system for **SwiftWheels Enterprises** (Huye City, Southern
Province, Rwanda) that replaces logbooks and paper forms. It manages **Customers**,
**Vehicles** and **Reservations/Rentals**, with session login, search, full CRUD and a
printable Customer–Vehicle reservation-rental report.

Built with **React.js** (Vite) on the front end and **Node.js / Express.js** with
**MongoDB** (via **Mongoose**) on the back end — hostable on **MongoDB Atlas**.

---

## Entities & relationships

Each entity is a MongoDB collection. Relationships are modelled by reference: the
child document stores the parent's key (the integer `*_ID` or the `Plate_Number`),
joined at read time with an aggregation `$lookup`. Integer ids are preserved with a
small `counters` collection (Mongo has no `AUTO_INCREMENT`).

| Entity (collection) | Key field | References |
|--------|-------------|--------------|
| `users` | User_ID | — |
| `customers` | Customer_ID | owner_id → users |
| `vehicles` | Plate_Number | owner_id → users |
| `reservation_rentals` | Reservation_ID | Customer_ID → customers, Plate_Number → vehicles, Recorded_By → users |

- A **Customer** makes many reservations/rentals; each reservation belongs to one customer. (1:M)
- A **Vehicle** is reserved/rented many times; each reservation involves one vehicle. (1:M)
- A **User** records many reservations/rentals; each reservation is recorded by one user. (1:M)

See **ERD.md** (Mermaid erDiagram) and **CONTEXT-DIAGRAM.md** (Level-0 DFD).

---

## Prerequisites

- Node.js 18+ and npm
- A **MongoDB** database — either a local `mongod` (`mongodb://127.0.0.1:27017/VRS`)
  or a free **MongoDB Atlas** cluster. Collections, indexes and seed data are created
  automatically on first start; you only need a valid `MONGODB_URI`.

---

## 1) Back end

```bash
cd backend-project
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
# edit .env -> set MONGODB_URI, SESSION_SECRET
npm run dev
```

The server:
1. validates required env vars (`MONGODB_URI`, `SESSION_SECRET`),
2. connects to MongoDB (collections + indexes are created on first write),
3. seeds an admin user and a few sample rows,
4. listens on **http://localhost:5000**.

**Default admin login** (from `.env`): username `admin`, password `change-me`,
recovery code `1234`. Change these in `.env`.

### Hosting the database on MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas), add a
   database user, and allow your server's IP (or `0.0.0.0/0` for a quick start).
2. Copy the **connection string** and set it as `MONGODB_URI`, e.g.
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/VRS?retryWrites=true&w=majority`.
3. Start the server — it connects, creates the collections/indexes and seeds the admin
   automatically. On a host like Render, set `MONGODB_URI`, `SESSION_SECRET`, `CLIENT_URL`
   and `NODE_ENV=production` as environment variables (no TLS flag needed — `mongodb+srv`
   uses TLS by default).

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
3. **VRS database** — `customers`, `vehicles`, `reservation_rentals`, `users` collections defined as Mongoose models in `models/`.
4. **Front/back environments** — Vite + React, Express + MongoDB.
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
2. **Database** — defined Mongoose schemas per entity and an idempotent seed that creates the admin and sample data; integer ids preserved via a `counters` collection.
3. **Backend skeleton** — Express app, CORS, sessions, rate limiting, env validation.
4. **Data layer** — Mongoose models + per-entity data-access modules (same function surface the controllers already used).
5. **Controllers & routes** — thin routes → controllers (validation, status codes) → models; auth with bcrypt + recovery codes.
6. **Reports** — aggregation `$lookup` pipelines for the dashboard and the reservation-rental report.
7. **Frontend foundation** — Vite, Tailwind (container queries), shadcn/ui, axios client, AuthContext.
8. **Pages** — Landing, Auth, Recover, Dashboard, Customer, Vehicle, Reservation, Reports.
9. **Polish** — validation on both ends, toasts, loading/empty states, mobile-first responsive layout, print styles.
