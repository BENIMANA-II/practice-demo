# SMS — Presentation Guide

A simple script for presenting the **Stock Management System (SMS)** to assessors.
The goal is to **show the working system and explain decisions in plain business language**,
so the focus stays on what the app does — not on reading code line by line.

---

## 1. Opening (30 seconds)

> "This is the **Stock Management System (SMS)** I built for **StockHub Ltd**, a wholesale and
> retail distributor in Kigali. It replaces their manual, paper-based stock records with a web app
> where the store manager can register products and warehouses, record stock coming in and going out,
> and automatically generate daily, weekly and monthly reports."

Then state the tech in one line:

> "It's a full-stack app — **React** on the front end, **Node/Express** on the back end, and
> **MongoDB** as the database."

---

## 2. Live demo flow (the main part — drive the whole thing from the screen)

Present by **doing**, narrating the business value of each screen. Suggested order:

1. **Landing page** — "This is the public home page. It explains the system and lets a user sign in or create an account."
2. **Sign Up** — Create an account live. Point out:
   - The form validates input (try a bad phone number to show the inline error).
   - After signing up, it shows a **one-time 4-digit recovery code** to copy or download.
   > "This code is how a user recovers a forgotten password — it's shown only once and stored securely."
3. **Dashboard** — "After login you land here. These cards show live totals — products, warehouses,
   transactions, today's activity, and the total value of current stock. Below are the most recent
   movements, and on the right are quick actions to add records without leaving the page." Click a
   **Quick Action** to open a create modal.
4. **Products** — Add a product. Show the searchable, paginated table with the **Base Stock**,
   **In Stock** (live), **Unit Price** and **Price** columns. Edit one, then try to delete one.
5. **Warehouses** — Add a warehouse (same create / edit / delete pattern).
6. **Transactions** — Record a **Stock In** then a **Stock Out**.
   - Show that a stock-out **cannot exceed available stock** (try an over-large quantity).
   - Show the **Type filter** (Stock In / Stock Out) and the green/red Value column.
7. **Reports** — Switch between **Available Stock / Stock In / Stock Out**, change the
   **daily / weekly / monthly** filter, then click **Print** to show the clean print layout.
8. **Recovery (optional)** — Log out, click **Forgot password**, and use the seeded admin code `1234`
   to show the recovery flow end to end.

> Tip: seed/admin login is **admin / change-me**, recovery code **1234** — already has sample data.

---

## 3. Design decisions to mention (business language, not code)

Say these as *choices you made*, which answers "why" without opening files:

- **Security** — "Passwords and recovery codes are never stored as plain text; they're hashed.
  Users only ever see their own data."
- **Data accuracy** — "Stock-out is blocked when there isn't enough stock, so the numbers can't go
  negative. Totals are calculated on the server, not trusted from the browser."
- **Usability** — "Every action gives feedback — a toast message — and every list shows loading,
  empty and error states so the screen is never just blank."
- **Reliability** — "On first run the system seeds an admin account and sample data so it's
  demonstrable immediately, and seeding never duplicates data on restart."
- **Reporting** — "Reports are produced by the database itself (aggregation), which keeps them fast,
  and they print cleanly for record-keeping."

---

## 4. One-line architecture summary (if they ask "how is it built?")

> "It's split into a **frontend** and a **backend** that talk over a REST API.
> The backend has three layers: **routes** receive requests, **controllers** hold the logic, and
> **models** define the data. The frontend has **pages** for each screen, an **API layer** that talks
> to the server, and shared **components**. Each part has one clear job."

That sentence is usually enough — it shows you understand the structure without reading code.

---

## 5. If an assessor asks you to explain a piece of code

Keep answers short and conceptual, then offer to show the *behavior* instead:

- **"What does this function do?"** → Say its job in one sentence (e.g. "It checks the login details
  and starts a session"), then **show it working** on screen.
- **"How does recovery work?"** → "We generate a 4-digit code at sign-up, store only a hashed copy,
  and check it when the user wants to reset." Then demo it.
- **"How are reports calculated?"** → "The database groups the transactions by product and by date
  range and adds them up." Then show the report updating when you change the filter.
- **"Why MongoDB?"** → "It fits this data well and the whole stack is JavaScript, so it's consistent
  front to back."

If pushed further, say: *"I can walk through that file, but the quickest way to show it's correct is
to demonstrate the result"* — then demo.

---

## 6. Entities & relationships (one slide / one breath)

- **Product** — items in the catalogue.
- **Warehouse** — depots / branches.
- **Stock Transaction** — each movement of a product through a warehouse (Stock In or Stock Out).
- A transaction **belongs to** one product and one warehouse; every record **belongs to** the user who created it.

(There is a full diagram in `ERD.md` if they want to see it.)

---

## 7. Quick facts sheet (keep visible while presenting)

| Thing | Value |
|---|---|
| System | Stock Management System (SMS) |
| Client | StockHub Ltd, Kigali |
| Stack | React + Vite · Node/Express · MongoDB |
| Entities | Product, Warehouse, Stock Transaction (+ Users) |
| Reports | Available Stock, Stock In, Stock Out (daily/weekly/monthly) |
| Admin login | `admin` / `change-me` |
| Recovery code | `1234` |
| Backend URL | http://localhost:5000 |
| Frontend URL | http://localhost:5173 |

---

## 8. How to run it (if asked to start from scratch)

```bash
# Backend
cd backend-project
npm install
npm run dev          # http://localhost:5000  (needs MongoDB running)

# Frontend (second terminal)
cd frontend-project
npm install
npm run dev          # http://localhost:5173
```

Then open **http://localhost:5173** and log in with the admin account above.

---

## 9. Closing line

> "In short, SMS turns StockHub's manual stock process into a secure, real-time web system with
> validated data entry, live dashboards, and printable reports. Thank you — I'm happy to demonstrate
> any part again."
