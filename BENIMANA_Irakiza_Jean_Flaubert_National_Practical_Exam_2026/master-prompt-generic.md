=== PROJECT BRIEF (fill in the blanks; leave any blank to let the AI decide) ===
This prompt builds an app with the SAME shape and quality as the reference Stock Management System
(a catalogue item, an actor/location, and a movement record that links them, plus auth, dashboard and
reports) — but for WHATEVER DOMAIN YOU WRITE BELOW. It must NOT be a stock-management system; fill in a
different domain (e.g. a school, clinic, library, payroll, transport, etc.).

Project description: ____________________________________________________________
  (one or two sentences, e.g. "A clinic system to register patients and record their visits")

System name (optional):           ______________________________
Company/organization (optional):  ______________________________
Database name (optional):         ______________________________

Entities (optional — leave blank to let the AI choose; aim for 3 domain entities + Users):
  Entity 1 (the "catalogue" item):     ______________________________
  Entity 2 (the "actor/place"):        ______________________________
  Entity 3 (the "movement/event" that references Entity 1 and Entity 2): ______________________________
  Key attributes per entity (optional): ______________________________

Per-entity operations (optional):  ______________________________
  (default: full CRUD on all three. To restrict, name which are INSERT-ONLY and which are full CRUD.)

Layout style (optional):           ______________________________   (minimal / editorial / bold / corporate / …)

Data visibility (optional):        ______________________________
  (blank = per-user: each user sees only their own records, seed data belongs to admin;
   "shared" = one shared dataset; "admin sees all" = per-user but admin sees everyone.)

Reports required (optional — leave blank to let the AI design the right ones for the domain):
  Report 1 — Name: __________  Shows: __________  Group/total by: __________  Filter by: __________
  Report 2 — Name: __________  Shows: __________  Group/total by: __________  Filter by: __________
  Report 3 — Name: __________  Shows: __________  Group/total by: __________  Filter by: __________

=== INSTRUCTIONS TO THE AI ===
You are a senior full-stack developer. Build the complete application described in the PROJECT BRIEF
using React.js (frontend) and Node.js/Express.js (backend) with MongoDB/Mongoose. The brief is the only
required input. Any blank field and every [SQUARE BRACKET] below is a value YOU derive with a sensible
default; if a field is filled in, honor it exactly. Do not ask the human to complete the brief or to
confirm the entities, attributes or relationships — make the most reasonable assumption and proceed.

Before writing code, output: (1) a short assumptions summary (system name, entities/attributes,
inferred relationships one line each, per-entity operations, the reports), then (2) a Mermaid erDiagram.
Then build every file. Deliver ERD.md (the Mermaid diagram) and README.md at the project root.

=== HOW TO INFER THE MODEL ===
- Choose 3 domain entities plus Users (more/fewer only if the domain clearly needs it).
- [Entity3] is a "movement/event" that references [Entity1] and [Entity2] (like a transaction linking a
  product and a warehouse). A reference field on B pointing to A means A has-many B (one-to-many).
- If the domain needs a quantity/balance, compute it on the SERVER from the movement records
  (e.g. available = base + (increase events) - (decrease events)), and never let a "decrease" exceed
  what is available. Mirror that rule on the client.
- Unless data visibility is "shared", every domain entity also carries `owner` (ObjectId ref User,
  required, indexed) set server-side to the creating user; all reads/writes and every aggregation
  filter by owner (admin is unscoped only in "admin sees all").

=== BACKEND RULES ===
- Libraries: express, cors, mongoose, bcryptjs, express-session, dotenv, nodemon, express-rate-limit.
- Layered, never mixed: thin routes -> controllers (all logic, validation, status codes, JSON) -> models
  (schema only). Reusable checks (auth) live in /middleware.
- RESPONSE SHAPE (no exceptions): `{ data }` on success, `{ error: "message" }` on failure.
  Status codes: 200/201/400/401/404/500. Protect all non-auth routes with a session-check middleware (401).
- Auth endpoints: register, login, logout, me, recover/verify, recover/reset.
  * register validates everything, hashes the password, rejects duplicate username/email/phone (400),
    generates a random 4-digit recovery code, stores ONLY its bcrypt hash, and returns the plaintext ONCE.
  * If password/recoveryCodeHash are select:false, re-select them before bcrypt.compare, then strip them
    from any returned user. Throttle login and recovery (4-digit codes are easy to brute-force).
- All queries use Mongoose model methods (no raw/SQL). Compute derived fields server-side.
- Seeding (idempotent, on startup): seed one admin from SEED_ADMIN_* env vars with a known recovery code,
  plus a few sample rows per entity (some dated today) owned by the admin. Never duplicate on restart;
  never log the password or code.
- Routes per entity: POST (create), GET (list), PUT/:id (update), DELETE/:id (delete one record only).
  An INSERT-ONLY entity gets only POST (+ GET if another form needs it as a dropdown). Deleting a
  referenced parent record returns 400 (no orphaned movement records).
- Reports: one MongoDB aggregation pipeline each ($match owner + date range, $lookup to join, $group to
  total, $sort, $project). Default the date filter to today. Also one /dashboard aggregation.

=== FRONTEND RULES ===
- React 18 + Vite, react-router-dom v6, Tailwind CSS v3, shadcn/ui, Phosphor Icons (regular weight via a
  single IconContext.Provider), Sonner toasts (one global <Toaster/>), axios. Pin exact versions.
- Generate every shadcn component you import, in full, under src/components/ui/ (button, input, card,
  table, dialog, alert-dialog, badge, label, tabs, select, alert, sonner) with the cn() util and the
  `@/` alias in vite.config.js AND jsconfig.json. No phantom imports.
- Auth state via AuthContext (useAuth) that calls GET /api/auth/me on mount and exposes
  login/logout/register. ProtectedRoute, Navbar, AuthPage and RecoverPage read from useAuth().
- Build reusable pieces (declared at module top level, never inside another component): PageWrapper,
  FormField (Label + Input + inline error), StateBlock (loading/error/empty), a confirm dialog, and a
  pagination helper. Pages compose these.
- Pages:
  * LandingPage (/) — PUBLIC, its own minimal top bar (system name + Sign In), a hero with a primary
    "Get Started" (→ /register) and secondary "Explore More" (smooth-scroll to a #services section), and a
    capabilities section. Distinct layout; not wrapped in ProtectedRoute.
  * AuthPage (/login AND /register) — PUBLIC, one floating two-part card (accent showcase panel + form),
    segmented Sign In / Sign Up tabs derived from the URL (useLocation). Sign Up shows the one-time
    recovery code (copy + download + "I've saved it" before continuing).
  * RecoverPage (/recover) — PUBLIC, verify code -> set new password -> show the new one-time code.
  * DashboardPage (/dashboard) — PROTECTED, >=4 stat cards (counts + one SUM/AVG) and a recent-activity
    summary, from a single /api/reports/dashboard call. Optional Quick Actions that open create modals.
  * One page per entity — create form + searchable, sortable, paginated table; full-CRUD entities get a
    per-row Edit (Dialog) and Delete (AlertDialog).
  * ReportsPage (/reports) — Tabs (one per report), a filter control (default a date picker = today, or a
    daily/weekly/monthly selector), an empty state, and a Print button (window.print) with a print-only
    header/footer; print the FULL report, not just the current page.
- Every API call: try/catch/finally, inline shadcn Alert for server errors, a toast on every action
  result, a loading spinner in the submit button, and "Unable to connect to the server. Please try again."
  on network errors. Refresh the affected list after create/update/delete.

=== VALIDATION (client AND server) ===
- Name fields: letters, spaces, hyphens, apostrophes only — /^[A-Za-z]+([ '-][A-Za-z]+)*$/
- Email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
- Phone (Rwanda): exactly 10 digits starting 078/079/073/072 — /^(078|079|073|072)\d{7}$/
- Recovery code: exactly 4 digits — /^\d{4}$/
- Rwandan plate (only if the domain needs it): /^R[A-Z]{2} \d{3} [A-Z]$/ after uppercasing.
- Numbers > 0 where required; integers >= 0 for counts; dropdowns must have a selection; dates not in the
  future (HTML max = today); a "decrease" movement must not exceed the available amount.
- Inline red error under each invalid field; disable submit while sending; reset the form on success.

=== DESIGN TOKENS (FIXED signature — keep identical across builds) ===
- Light mode only; all colors are CSS variables on :root.
- Page background: --color-bg: #F6F8FF.   Accent (FIXED): --color-accent: #003F91 — used for active nav,
  primary buttons, focus rings, highlights and badges.
- Signature shadow on every elevated surface (cards, modals, navbar):
  --shadow-accent: 0 4px 14px -4px rgba(0, 63, 145, 0.25);  (removed only in @media print).
- Font (FIXED): Google Font "Outfit" applied globally (weights 400/500/600/700); tabular-nums on all
  figures; small uppercase muted table-column headers; slight negative letter-spacing on headings/big numbers.
- No emoji; Phosphor icons only at consistent sizes. No purple gradients on white.
- @media print: `.no-print` hides chrome; `.print-only` shows the report header/footer; tables print as
  plain black-on-white with borders and no shadows.

=== REQUIRED ENV VARS ===
- backend-project/.env.example: PORT=5000, NODE_ENV=development, MONGODB_URI=mongodb://localhost:27017/[DB],
  SESSION_SECRET=change-me, CLIENT_URL=http://localhost:5173, SEED_ADMIN_USERNAME=admin,
  SEED_ADMIN_PASSWORD=change-me, SEED_ADMIN_RECOVERY_CODE=1234.
- frontend-project/.env.example: VITE_API_URL=http://localhost:5000/api.
- server.js validates MONGODB_URI and SESSION_SECRET at startup and exits with a clear message if missing.
- Never commit real .env files; deliver only .env.example.

=== PROJECT STRUCTURE (use this exact layout; one file per entity, named after the REAL entity) ===
[ROOT_FOLDER_NAME]/                     ← choose a clear root folder name (or use one the human gives)
├── README.md                           ← project doc + "Build Phases" recap
├── ERD.md                              ← Mermaid erDiagram
├── backend-project/
│   ├── package.json (pinned; "dev": nodemon)   ├── .env.example   ├── server.js
│   ├── config/ (db.js, seed.js)
│   ├── models/ (User.js, [Entity1].js, [Entity2].js, [Entity3].js)
│   ├── controllers/ (auth, [entity1], [entity2], [entity3], reports .controller.js)
│   ├── routes/ (auth, [entity1], [entity2], [entity3], reports .routes.js)
│   └── middleware/ (requireAuth.js   [+ requireRole.js only if the domain needs roles])
└── frontend-project/
    ├── package.json (pinned) ├── .env.example ├── vite.config.js ├── jsconfig.json
    ├── postcss.config.js ├── tailwind.config.js ├── index.html
    └── src/
        ├── App.jsx ├── main.jsx ├── index.css
        ├── lib/ (utils.js, constants.js, validators.js, format.js   [+ a domain helper if needed])
        ├── context/ (AuthContext.jsx)
        ├── api/ (axiosClient.js, authAPI.js, [entity1]API.js, [entity2]API.js, [entity3]API.js, reportsAPI.js)
        ├── components/ (Navbar.jsx, ProtectedRoute.jsx, common.jsx,
        │                [Entity1]Form.jsx, [Entity2]Form.jsx, [Entity3]Form.jsx, ui/*)
        └── pages/ (LandingPage, AuthPage, RecoverPage, DashboardPage,
                    [Entity1]Page, [Entity2]Page, [Entity3]Page, ReportsPage)

=== CODE QUALITY ===
Write simple, beginner-readable code: clear names, small focused functions, no clever one-liners, one
responsibility per file. Add a short comment ONLY where intent is not obvious (the recovery-code flow,
owner-scoping, each aggregation pipeline, any computed balance, non-trivial validation). Do not over-engineer
or add features, options or error handling that the brief did not ask for.

=== DELIVERABLE ===
Every file complete and immediately runnable with zero edits after: backend `npm install` + copy
.env.example to .env + `npm run dev`; then frontend `npm install` + copy .env.example to .env +
`npm run dev` (API on :5000, app on :5173, MongoDB running). Every frontend call maps to a real route,
every route to a real controller, every import to a real file. No placeholder TODOs, no hardcoded secrets.
Do NOT suggest deleting the project, dropping the database, or bulk-wiping collections — the only delete is
a single record via DELETE /api/[entity]/:id. End the README with a "Build Phases" recap of the steps you followed.
