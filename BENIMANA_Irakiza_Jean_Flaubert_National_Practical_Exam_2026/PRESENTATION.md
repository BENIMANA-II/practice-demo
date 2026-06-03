# SMS — Presentation Guide (mapped to the SWD assessment checklist)

How to present the **Stock Management System (SMS)** so the assessor ticks every box on the marking
sheet. The plan: **you drive the laptop**, demonstrate the working app, say the exact scored sentences,
and when code is needed **you open the file you choose and say one line about it** — so you are never
dragged into code you didn't prepare.

> Note on names: the sample checklist uses Spare_Part / Stock_In / Stock_Out. This app uses the same
> shape with **Product / Warehouse / Stock Transaction** (a Stock Transaction is a Stock-In or a
> Stock-Out). When a checklist item says "Stock_Out", show a **Stock-Out transaction**; when it says
> "Stock Status", show the **Available Stock report**. The points are identical.

---

## 0. Before the assessor arrives (be ready)

- Both servers **already running**: backend on :5000, frontend on http://localhost:5173.
- Logged-out, sitting on the **Landing page**, browser full-screen.
- Your **hand-drawn ERD on paper** next to you (this is graded and collected — see §1).
- Editor open with the project folder, but **collapsed** — you decide which files to open.
- Login ready: **admin / change-me**, recovery code **1234**.

---

## 1. Preliminary Activities — the ERD (15%)

This is marked from your **paper ERD**, not the screen. Make sure your drawing shows, and you can point to:
- **Entities drawn**: Users, Product (Spare_Part), Warehouse/Stock_In, Stock Transaction (Stock_Out).
- **Primary keys** on every entity (underlined `_id`).
- **Foreign keys**: `owner` (→ Users) on each entity; `product` and `warehouse` (FKs) on Stock Transaction.
- **Relationships + cardinality (1 / N)**: User 1—N each entity; Product 1—N Transaction; Warehouse 1—N Transaction.
- **Correct symbols**: entity boxes, relationship diamonds, link lines.

> One sentence to say: *"One user owns many products, warehouses and transactions; and each transaction
> belongs to one product and one warehouse — that's why the foreign keys sit on the transaction."*

(The same diagram is in `ERD.md` and `sms_chen_erd_fk.svg` if they want it on screen.)

---

## 2. Product Presentation — say these EXACT points (Indicator 3.1)

Deliver this standing, **clear and audible, with hand gestures** (voice + body language are each scored).
Hit every underlined element:

1. **Product name** — "This is the **Stock Management System (SMS)** for StockHub Ltd."
2. **Use / function / importance** — "It replaces their manual, paper stock register with a secure web
   app so the store manager can track products, stock-in, stock-out and current stock in real time, and
   print daily reports."
3. **Key steps of the process** (say them as steps):
   - "First I **designed the ERD** and database (SMS in MongoDB)."
   - "Then I built the **backend** — Node, Express and Mongoose — with the REST API and login."
   - "Then the **React frontend** with the pages, connected to the backend with **Axios**."
   - "Finally the **reports and dashboard**, and I tested everything."
4. **Challenges/difficulties met** — pick one real, simple one, e.g.:
   - "Making sure a **stock-out can't remove more than is available**, and keeping each user's data separate."
5. **How you overcame them** — "I **calculated the available stock on the server** before saving and
   **scoped every record to the logged-in user**, so the numbers stay correct."

Keep it to ~60–90 seconds, then move straight into the live demo.

---

## 3. Usability demo — drive the app (Indicator 3.2 — high marks)

Do these on screen, narrating the outcome. Each line below is a scored element:

1. **Input validation prevents invalid data** — On Sign Up, type a bad phone (e.g. `0991234567`) and a
   short password → show the inline red errors and that it won't submit.
2. **Form submission saves data** — Create an account (show the one-time recovery code), then log in.
   Add a **Product** → it appears in the table with a success toast.
3. **Data retrieval displays records** — Point at the Products / Warehouses / Transactions tables filling
   from the database; use the **search** box.
4. **Update works** — Edit a Transaction (or Product) in the dialog, save, show the row change.
5. **Delete works** — Delete a Transaction through the confirm dialog, show it disappear.
6. Show the **stock-out guard**: try a Stock-Out bigger than available → it's blocked with a clear message.

---

## 4. Navigation, look & reports (Indicator 3.3)

- **Interactive menus & buttons** — Click through the Navbar (Dashboard, Products, Warehouses,
  Transactions, Reports); show the active link highlight and hover states.
- **Consistent fonts & colours** — Mention "one font (Outfit), one accent colour (#003F91) used
  everywhere" — show the Dashboard cards.
- **Responsive** — Shrink the window once to show it reflows / stacks.
- **Daily Stock Status report** (scored, ×2) — Reports → **Available Stock** tab, period **Daily**:
  show Product, Base Stock, Stock In, Stock Out, **Available (remaining)** — say *"this is the daily stock
  status: what's stored, what went out, and what remains."*
- **Daily Stock-Out report** (scored, ×2) — Reports → **Stock Out** tab, period **Daily** → show the
  day's stock-out list. Click **Print** to show the clean printout.

---

## 5. GUIDED CODE TOUR — you open the files, you say one line each

If the assessor wants to see code (Process & Fulfilment, 50%), **stay in control**: open only these
files and say the single sentence next to each. This covers the marked items without them picking
random code.

| Open this file | Say this one line (the point being marked) |
|---|---|
| `backend-project/server.js` | "Here Express and CORS are imported, the port is set, the app object is created, MongoDB is connected, and `app.listen` starts the server." |
| `backend-project/models/` (User, Product, Warehouse, StockTransaction) | "These are my four collections with their primary keys and the foreign keys — `owner`, `product`, `warehouse`." |
| `backend-project/controllers/transaction.controller.js` | "This is full CRUD — the create, list, update and delete handlers — and here is where a stock-out is checked against available stock." |
| `backend-project/routes/transaction.routes.js` | "The REST endpoints: **POST, GET, PUT, DELETE** mapped to those handlers." |
| `backend-project/controllers/auth.controller.js` | "Login validates the user, the **password is hashed with bcrypt**, duplicates are rejected, and this is the **4-digit password recovery**." |
| `frontend-project/src/api/axiosClient.js` + one `*API.js` | "My **API layer**: Axios with the **base URL**, and one file per resource using POST/GET/PUT/DELETE." |
| `frontend-project/src/App.jsx` | "**Routing** with react-router-dom — routes are configured and links navigate between components." |
| `frontend-project/src/components/ProductForm.jsx` (or any page) | "A React **function component** — it returns **JSX**, and it's **exported** and mounted through the routes." |
| `frontend-project/tailwind.config.js` + `src/index.css` | "**Tailwind** is installed, configured and imported; colours and the font are customised here." |

> Golden rule: **you choose the file**. Open it, say the one line, then close it and return to the
> running app. Don't scroll aimlessly — that invites questions.

---

## 6. If pushed to explain a specific line of code

Keep it short, then redirect to behaviour:
- Answer its **purpose in one sentence** (e.g. "This checks the login and starts the session").
- Then say: *"The clearest proof it works is to show it"* — and **demo the result** in the running app.
- For anything calculated (reports, available stock): *"That total is worked out by the database, then
  shown here"* — and change the report filter to show it update.

You are demonstrating a working product; the marks for "usability" and "reports" come from the
**running app**, not from reading code aloud.

---

## 7. The three assessor questions (prepared answers)

1. **Describe your product in brief** → use the §2 lines (name + what it does for StockHub).
2. **Which difficulties did you meet?** → "Keeping stock numbers correct (no negative stock) and keeping
   each user's data private."
3. **How did you overcome them?** → "I calculated available stock on the server before every stock-out,
   and scoped every record to the logged-in user."

---

## 8. Closing activities (5%) — do this LAST, and ASK FIRST

The checklist scores tidy clean-up **after marking**. Do NOT remove anything until the assessor says so.
- Say: *"May I now remove the project as required?"*
- Then: delete the **project folder**, drop the **SMS database**, remove **global dependencies** if any.
- Do **not** uninstall the editor or XAMPP/Mongo itself.

---

## 9. Quick facts (keep visible)

| | |
|---|---|
| System | Stock Management System (SMS) — StockHub Ltd |
| Stack | React + Vite · Node/Express · MongoDB · Tailwind · Axios |
| Entities | Product, Warehouse, Stock Transaction (+ Users) |
| Reports | Available Stock (= stock status), Stock In, Stock Out (daily/weekly/monthly) |
| Admin login | `admin` / `change-me`   ·   Recovery code `1234` |
| URLs | API http://localhost:5000 · App http://localhost:5173 |

**Run from scratch (if asked):**
```bash
cd backend-project && npm install && npm run dev      # :5000 (MongoDB must be running)
cd frontend-project && npm install && npm run dev     # :5173
```

## 10. Closing line
> "In short, SMS turns StockHub's manual stock process into a secure, real-time web system with
> validated entry, full CRUD, and printable daily reports. Thank you — I can demonstrate any part again."
