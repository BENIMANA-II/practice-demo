# Stock Management System (SMS)

A web application for **StockHub Ltd** (Kigali, Rwanda) — a wholesale and retail product
distribution company. SMS replaces the company's manual, paper-based stock process: the store
manager records products, warehouses and stock movements digitally, and the system automatically
generates daily, weekly and monthly inventory reports for available stock, stock in and stock out.

## Tech Stack

- **Frontend:** React 18 + Vite, react-router-dom v6, Tailwind CSS v3, shadcn/ui, Phosphor Icons (regular weight), Sonner toasts, axios
- **Backend:** Node.js + Express, express-session, bcryptjs, express-rate-limit
- **Database:** MongoDB with Mongoose

## Features

- Authentication with self-registration and a **4-digit recovery code** flow (shown once, stored hashed)
- Session-based login/logout with an httpOnly cookie; a seeded admin user on first run
- **Dashboard** with stat cards (products, warehouses, transactions, today's transactions, total stock value), a recent-movements table, and quick-action create modals
- **Products** and **Warehouses** — full CRUD (create, list, edit, delete) with searchable, paginated tables
- **Stock Transactions** — full CRUD with stock-out vs. available-stock validation, type filter, search, sort and pagination
- **Reports** — Available Stock, Stock In, Stock Out — each with a daily/weekly/monthly filter, pagination and print
- Per-user data ownership: each user sees only their own records; seeded data belongs to the admin
- Responsive UI, accessible forms, loading/error/empty states, and a toast on every action

## Project Structure

```
BENIMANA_Irakiza_Jean_Flaubert_National_Practical_Exam_2026/
├── README.md
├── ERD.md
├── backend-project/
│   ├── server.js
│   ├── config/        (db.js, seed.js)
│   ├── models/        (User, Product, Warehouse, StockTransaction)
│   ├── controllers/   (auth, product, warehouse, transaction, reports)
│   ├── routes/        (auth, product, warehouse, transaction, reports)
│   └── middleware/    (requireAuth)
└── frontend-project/
    └── src/
        ├── api/         (axiosClient, authAPI, productAPI, warehouseAPI, transactionAPI, reportsAPI)
        ├── components/  (Navbar, ProtectedRoute, common, ProductForm, WarehouseForm, TransactionForm, ui/*)
        ├── context/     (AuthContext)
        ├── lib/         (utils, constants, validators, format, stock)
        └── pages/       (Landing, Auth, Recover, Dashboard, Product, Warehouse, Transaction, Reports)
```

## Prerequisites

- Node.js 18 LTS or newer
- A running MongoDB instance (local `mongod` or a MongoDB Atlas connection string)

## Setup & Run

**Backend**
```bash
cd backend-project
npm install
cp .env.example .env      # fill MONGODB_URI / SESSION_SECRET if needed
npm run dev               # API on http://localhost:5000
```

**Frontend** (in a second terminal)
```bash
cd frontend-project
npm install
cp .env.example .env
npm run dev               # app on http://localhost:5173
```

## Environment Variables

**backend-project/.env**

| Variable | Description |
|---|---|
| `PORT` | Backend port (default 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string (database `SMS`) |
| `SESSION_SECRET` | Secret used to sign the session cookie |
| `CLIENT_URL` | Allowed CORS origin (the frontend URL) |
| `SEED_ADMIN_USERNAME` | Username for the seeded admin |
| `SEED_ADMIN_PASSWORD` | Password for the seeded admin |
| `SEED_ADMIN_RECOVERY_CODE` | Known 4-digit recovery code for the seeded admin (stored hashed) |

**frontend-project/.env**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (default `http://localhost:5000/api`) |

## Seeded Admin Login

On first run (when the Users collection is empty) one admin user is seeded from the `SEED_ADMIN_*`
environment variables, along with sample products, warehouses and transactions owned by that admin so
the dashboard and reports are populated immediately. The admin's recovery code comes from
`SEED_ADMIN_RECOVERY_CODE` so the recovery flow can always be demonstrated. No real password is printed
to the console or stored in plaintext.

## API Reference

**Auth**
- `POST /api/auth/register` — create an account and start a session; returns a one-time recovery code
- `POST /api/auth/login` — validate credentials and start a session
- `POST /api/auth/logout` — destroy the session
- `GET /api/auth/me` — return the current session user (401 if none)
- `POST /api/auth/recover/verify` — verify username/email + 4-digit recovery code
- `POST /api/auth/recover/reset` — reset password and issue a new recovery code

**Products / Warehouses / Transactions** (full CRUD)
- `POST /api/products` · `GET /api/products` · `PUT /api/products/:id` · `DELETE /api/products/:id`
- `POST /api/warehouses` · `GET /api/warehouses` · `PUT /api/warehouses/:id` · `DELETE /api/warehouses/:id`
- `POST /api/transactions` · `GET /api/transactions` · `PUT /api/transactions/:id` · `DELETE /api/transactions/:id`

**Reports**
- `GET /api/reports/dashboard` — dashboard metrics + recent activity
- `GET /api/reports/available-stock?period=daily|weekly|monthly`
- `GET /api/reports/stock-in?period=daily|weekly|monthly`
- `GET /api/reports/stock-out?period=daily|weekly|monthly`

## Account Recovery

At registration the server generates a random 4-digit recovery code, stores only its bcrypt hash, and
returns the plaintext code **once** (copy or download it). To recover a forgotten password, submit the
username/email and the 4-digit code to `recover/verify`, then set a new password via `recover/reset`,
which issues a fresh code. The seeded admin's code is fixed by `SEED_ADMIN_RECOVERY_CODE` so the flow
can be demoed at any time. Recovery and login attempts are rate-limited to resist brute force.

## Build Phases

- **Phase 1 — Analyze & Plan:** chose the system (SMS), database (`SMS`), entities (Product, Warehouse, StockTransaction), per-user visibility, and the three reports.
- **Phase 2 — Model & Relationships (ERD):** inferred `StockTransaction → Product` and `StockTransaction → Warehouse` references plus `owner → User` on every entity; drew the Mermaid ERD in `ERD.md`.
- **Phase 3 — Backend Foundation:** set up package.json, server.js (cors, JSON, session, env validation, mongoose.connect, listen), config/db.js and .env.example.
- **Phase 4 — Data Layer (Models):** built User, Product, Warehouse and StockTransaction schemas with refs, per-owner unique indexes, and select:false on password/recoveryCodeHash.
- **Phase 5 — Backend Logic:** implemented auth (register/login/logout/me + 4-digit recovery), product/warehouse/transaction controllers (full CRUD with stock validation and delete guards), the dashboard + three report aggregations, requireAuth, and the idempotent seed.
- **Phase 6 — Frontend Foundation:** scaffolded Vite + Tailwind v3, index.css design tokens (#003F91 accent, #F6F8FF background, accent shadow, Outfit font, print rules), the self-contained shadcn ui components, lib/utils, axiosClient and AuthContext.
- **Phase 7 — Frontend API Layer:** built authAPI, productAPI, warehouseAPI, transactionAPI and reportsAPI modules over the { data } envelope.
- **Phase 8 — Frontend Pages & Components:** built Navbar, ProtectedRoute, the reusable create-forms, and the Landing, Auth, Recover, Dashboard, Product, Warehouse, Transaction and Reports pages with validation, toasts, pagination and print.
- **Phase 9 — Polish & Verify:** applied design/accessibility/responsiveness rules and confirmed every import resolves and every API call maps to a real route and controller.
- **Phase 10 — Documentation:** wrote this README and kept ERD.md consistent with the built models.
