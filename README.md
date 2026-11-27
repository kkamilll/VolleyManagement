# VolleyManagement

Web application for managing volleyball teams and multi-club portals. Built with Next.js 14, TypeScript, Tailwind CSS, and MongoDB Atlas, designed for both mobile and desktop browsers.

Each club operates in an isolated workspace with its own roster, schedule, matches, tactics, finances, theme, crest, and invite code.

---

## Features

### Multi-Club & Accounts
- **Portal administration (`/superadmin`)** — create, edit, suspend, and delete clubs; inspect club statistics, database size, and member lists; add users directly to any club; regenerate invite codes; reset passwords; send global announcements; export JSON backups.
- **Authentication (`/login`, `/register`)** — JWT cookie sessions with `bcryptjs` password hashing. Players can join via club invite code or be added directly by club staff/SuperAdmin.
- **Password management** — self-service password change in the user profile modal, plus password reset by club managers (`/team`) and SuperAdmin (`/superadmin`).

### Team & Match Operations
- **Dashboard (`/`)** — upcoming match summary, venue links (Google Maps), quick attendance declaration, fees status, and pinned announcements.
- **Schedule & attendance (`/events`)** — list and calendar views for league matches, trainings, friendlies, and tournaments with one-click attendance tracking.
- **Competitions (`/rozgrywki`)** — league standings, schedules, set scores, match reports, player statistics (with VolleyStation import), plus separate tabs for friendlies and tournaments.
- **Tactics board (`/taktyka`)** — interactive court with drag-and-drop players, drawing tools, Libero/Middle Blocker toggle, portrait/landscape modes, video/image attachments, and player visibility controls.
- **Training planner (`/trening`)** — session planning with calendar view, drill library, materials, and comments.
- **Roster (`/team`)** — player and staff profiles (number, position, height, phone, stats), direct member creation, profile editing, and quick invite code copy.
- **Finances (`/fees`)** — fee tracking, BLIK payment info, payment confirmation, club treasury balance, and Excel export (`.xlsx`).
- **Gallery (`/galeria`)** — match, friendly, and tournament photo albums with fullscreen viewer.
- **Club admin (`/admin`)** — granular user permissions, season archiving with printable reports (`/admin/raport-sezonu`), and JSON import/export.

---

## Roles & Permissions

| Role | Access |
|---|---|
| **SuperAdmin** (`/superadmin`) | Manage all clubs, view club details and rosters, create users, reset passwords, manage invite codes, broadcast announcements, export backups |
| **Manager** (`KIEROWNIK`) | Full management of own club: roster (add/edit/reset passwords), matches, standings, finances, tactics, trainings, permissions, and season archives |
| **Coach** (`TRENER`) | Manage tactics, trainings, schedule, roster additions, announcements, and invite code sharing |
| **Player** (`ZAWODNIK`) | View schedule, stats, gallery, and shared tactics; submit attendance; pay fees; edit own profile and password |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, Lucide Icons
- **Database:** MongoDB Atlas (`app_state` collection with per-club isolation) with local JSON fallback (`data/`)
- **Auth & Utilities:** `bcryptjs`, `jsonwebtoken`, `xlsx`, `tesseract.js`

---

## Project Structure

```text
src/
  app/            # Pages and Next.js API routes
  components/     # Shared UI (Navbar, modals, planners, guards)
  context/        # AuthContext and ClubContext
  lib/            # Database, MongoDB, auth, clubs registry, parsers, types
  middleware.ts   # Route protection and session cookie checks
data/             # Default local JSON seed/fallback files
public/           # Static assets and PWA manifest
```

---

## Getting Started

Requires **Node.js 18+** and **npm**.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production build

```bash
npm run build
npm run start
```

---

## Environment Variables

Create a `.env.local` file for local development or configure these variables in Vercel (**Settings -> Environment Variables**):

```env
# MongoDB Atlas connection string (leave empty to use local data/ JSON files)
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/volleyhub?retryWrites=true&w=majority
MONGODB_DB_NAME=volleyhub

# Secret key for signing JWT session cookies
JWT_SECRET=your-long-random-secret

# Portal SuperAdmin credentials (/superadmin)
SUPERADMIN_EMAIL=admin@yourdomain.com
SUPERADMIN_PASSWORD=your-strong-password
```

When deploying to Vercel with MongoDB Atlas, make sure `0.0.0.0/0` is allowed in Atlas **Network Access** so serverless functions can connect.

---

All rights reserved.
