<div align="center">

# 🗂️ Explorer

### A modern, Windows Explorer style file manager for the web, an unlimited depth folder tree, real file storage, preview, upload, and a recycle bin.

**English** · [Bahasa Indonesia »](README.id.md)

<p>
  <img alt="Bun" src="https://img.shields.io/badge/Bun-1.3-000000?logo=bun&logoColor=white" />
  <img alt="Elysia" src="https://img.shields.io/badge/Elysia-1.x-blueviolet" />
  <img alt="Vue" src="https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white" />
  <img alt="Drizzle" src="https://img.shields.io/badge/Drizzle_ORM-0.38-c5f74f" />
  <img alt="Scalar" src="https://img.shields.io/badge/API_docs-Scalar-1a1a1a" />
</p>

<img src="docs/images/screenshot-light.png" alt="Explorer - light theme" width="49%" />
<img src="docs/images/screenshot-dark.png" alt="Explorer - dark theme" width="49%" />

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation (from git clone)](#installation-from-git-clone)
  - [Database setup](#database-setup)
  - [Running the app](#running-the-app)
- [Usage Guide](#-usage-guide)
- [API Documentation (Scalar)](#-api-documentation-scalar)
- [Testing](#-testing)
- [Available Scripts](#-available-scripts)
- [Author](#-author)

---

## 🎯 About

**Explorer** is a web application that recreates the feel of Windows Explorer / the file tree in a modern IDE. The screen is split into two panels:

- **Left panel** - the complete folder structure as an interactive, collapsible tree. Folders can nest to **unlimited depth**.
- **Right panel** - the contents (sub-folders **and** files) of the folder selected on the left.

It is a complete file manager backed by **real file storage**: file bytes live on disk, while structure and metadata live in PostgreSQL. You can browse, search, create, rename, move, copy, upload, download, preview, extract archives, and recover deleted items from a recycle bin - all from a clean, responsive interface with light and dark themes.

---

## ✨ Features

### Browsing

- 🌳 **Unlimited-depth folder tree** built from scratch (no tree/treeview library) with independent expand/collapse per row.
- 📂 **Two-panel layout** - click a folder to view its sub-folders and files; breadcrumbs show the current path.
- 🔎 **Live search** across folders and files by name, each result showing its full path.

### File management

- ⬆️ **Upload** - via a button or by **dragging files from your computer** onto the window, with a live progress bar.
- 👁️ **Preview panel** - view **images, PDFs, video, audio, and text/code** inline (video & audio stream with range support); double-click a file to open it.
- ⬇️ **Download** any file.
- 🗂️ **Create / Rename / Move / Copy / Paste** - folders and files, individually or in bulk.
- 🖱️ **Multi-select** - click, Ctrl/⌘-click, Shift-range, Select-all, and **marquee (drag-box) selection**, with **right-click context menus**.
- ✋ **Drag-to-move** - drag a selection onto any folder, in the grid or the tree.
- 🗑️ **Recycle Bin** - deletes go to trash first; **restore** to the original location, **delete permanently**, or **empty**.
- 🗜️ **Archive extraction** - extract `.zip`, `.rar`, and `.7z` directly in the app, no external tools required (handled in pure WebAssembly).

### Experience

- 🎨 **Polished design system** - light & dark themes (persisted, flash-free), soft shadows, micro-interactions, skeleton loaders, grid/list views.
- 🧭 **Built-in guided tour** - click the **?** in the header to launch an animated walkthrough of every feature.
- 📱 **Fully responsive** - graceful tablet/mobile layout with a slide-in tree drawer.
- ♿ **Accessible** - ARIA roles, real buttons, keyboard-focusable controls, reduced-motion support.
- 🖼️ **Material Design Icons** rendered as inline SVG.

---

## 🛠 Tech Stack

| Layer                                       | Technology                                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime / package manager / test runner** | [Bun](https://bun.sh)                                                                                                           |
| **Backend framework**                       | [Elysia](https://elysiajs.com)                                                                                                  |
| **Language**                                | TypeScript                                                                                                                      |
| **Database**                                | PostgreSQL                                                                                                                      |
| **ORM & migrations**                        | [Drizzle ORM](https://orm.drizzle.team)                                                                                         |
| **API documentation**                       | [Scalar](https://scalar.com) (OpenAPI)                                                                                          |
| **Frontend framework**                      | [Vue 3](https://vuejs.org) (Composition API)                                                                                    |
| **State management**                        | [Pinia](https://pinia.vuejs.org)                                                                                                |
| **Build tool**                              | [Vite](https://vite.dev)                                                                                                        |
| **Icons**                                   | [`@mdi/js`](https://pictogrammers.com/library/mdi/)                                                                             |
| **Guided tour**                             | [driver.js](https://driverjs.com)                                                                                               |
| **Testing**                                 | `bun:test`, [Vitest](https://vitest.dev), [@vue/test-utils](https://test-utils.vuejs.org), [Playwright](https://playwright.dev) |

---

## 🏛 Architecture

The backend follows a **Hexagonal (Clean) Architecture** - dependencies point inward, so the core logic never depends on the database or the web framework.

```
            ┌───────────────────────────────────────────────┐
            │                 PRESENTATION                  │
            │        Elysia routes (/api/v1/nodes/*)        │
            └───────────────────────┬───────────────────────┘
                                    │ depends on
            ┌───────────────────────▼───────────────────────┐
            │                 APPLICATION                   │
            │  NodeService · NodeWriteService (use-cases)   │
            └───────────────────────┬───────────────────────┘
                                    │ depends on (interfaces)
            ┌───────────────────────▼───────────────────────┐
            │                    DOMAIN                     │
            │      Entities + ports (INodeRepository,       │
            │       IStorageService, IArchiveService)       │
            └───────────────────────▲───────────────────────┘
                                    │ implemented by
            ┌───────────────────────┴───────────────────────┐
            │                INFRASTRUCTURE                 │
            │   Drizzle repository · filesystem storage ·   │
            │      archive service · PostgreSQL pool        │
            └───────────────────────────────────────────────┘
```

- **Domain** - pure types and interface "ports" with zero dependencies.
- **Application** - business logic (`NodeService` for reads, `NodeWriteService` for writes/files), depending only on the ports.
- **Infrastructure** - adapters: the Drizzle repository, filesystem storage, and the archive service.
- **Presentation** - Elysia routes that wire HTTP to the application services.

The **frontend** mirrors this separation: `types` → `services` (API client) → `stores` (Pinia state) → `components`, with `composables` and `utils` for shared logic. The folder tree is a hand-built recursive component.

---

## 📁 Project Structure

```
explorer/                       # Bun monorepo
├── backend/                    # REST API (Bun + Elysia + Drizzle + PostgreSQL)
│   ├── src/
│   │   ├── domain/             # entities + ports (interfaces)
│   │   ├── application/        # services (use-cases)
│   │   ├── infrastructure/     # Drizzle repo, storage, archive, db
│   │   └── presentation/       # Elysia routes
│   ├── tests/                  # unit + integration
│   ├── seed.ts                 # database + sample-file seeder
│   └── storage/                # file bytes (generated, git-ignored)
├── frontend/                   # SPA (Vue 3 + Pinia + Vite)
│   └── src/
│       ├── components/         # UI (incl. hand-built recursive tree)
│       ├── stores/             # Pinia store
│       ├── services/           # API client
│       ├── composables/        # theme, tour, debounce
│       └── utils/              # icons, formatting, preview detection
├── sample_file/                # sample files imported by the seeder
└── docs/images/                # screenshots
```

---

## 🚀 Getting Started

### Prerequisites

| Tool                                               | Version | Notes                                  |
| -------------------------------------------------- | ------- | -------------------------------------- |
| [Bun](https://bun.sh/docs/installation)            | ≥ 1.3   | runtime, package manager & test runner |
| [PostgreSQL](https://www.postgresql.org/download/) | ≥ 14    | a running local instance               |

> **Install Bun on Windows:** `powershell -c "irm bun.sh/install.ps1 | iex"`

### Installation (from git clone)

```bash
# 1. Clone the repository
git clone https://github.com/fajar444/explorer.git explorer
cd explorer

# 2. Install all workspace dependencies (backend + frontend) from the root
bun install
```

### Database setup

```bash
# 1. Create the database
psql -U postgres -c "CREATE DATABASE explorer_db;"

# 2. Configure the backend connection
cd backend
cp .env.example .env
#   then edit .env so DATABASE_URL matches your PostgreSQL credentials, e.g.:
#   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/explorer_db

# 3. Apply the schema (creates the `nodes` table + indexes)
bun run db:migrate

# 4. Seed the database + import the sample files into storage
bun run db:seed
```

> `bun run db:seed` (or `bun run db:reset`) performs a **clean reset**: it clears the table and the storage folder, recreates the folder tree, and imports every file from `sample_file/` into `Desktop/Samples/` so you have real, previewable content immediately.

Then configure the frontend:

```bash
cd ../frontend
cp .env.example .env
#   .env contains:
#   VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Running the app

Open **two terminals**:

```bash
# Terminal 1 - Backend → http://localhost:3000
cd backend
bun run dev
#   API  : http://localhost:3000/api/v1
#   Docs : http://localhost:3000/docs   (Scalar)
```

```bash
# Terminal 2 - Frontend → http://localhost:5173
cd frontend
bun run dev
```

Open **http://localhost:5173**.

> **Windows PowerShell tip:** PowerShell doesn't support `&&`. Run each command on its own line, or use `;` between them.

---

## 🖱 Usage Guide

| Action                               | Result                                                          |
| ------------------------------------ | --------------------------------------------------------------- |
| Click a folder in the tree           | Opens it and expands / collapses that folder                    |
| Click a folder in the grid           | Opens it; the right panel shows its contents                    |
| Click the chevron in the tree        | Expands / collapses that folder                                 |
| Double-click a folder                | Navigates into it                                               |
| Click a file                         | Opens it in the preview panel                                   |
| Click / Ctrl-click / Shift-click     | Select / toggle / range-select items                            |
| Drag a box over empty space          | Marquee-select multiple items                                   |
| Right-click an item or empty space   | Context menu (open, cut, copy, paste, rename, delete, extract…) |
| Drag a selection onto a folder       | Moves the items there                                           |
| Drag files from your computer        | Uploads them to the current folder                              |
| Search box                           | Finds folders and files by name                                 |
| Recycle Bin (tree toolbar)           | Restore, delete permanently, or empty                           |
| **?** icon (top-right)               | Opens the help menu and the guided tour                         |
| Theme icon (top-right)               | Switches light / dark                                           |
| `Ctrl + C` / `Ctrl + X` / `Ctrl + V` | Copy, cut, and paste selected items                             |
| `Ctrl + Z`                           | Undo the last rename, move, or delete action                    |
| `Delete` / `Shift + Delete`          | Move selection to Recycle Bin / delete permanently              |

---

## 📡 API Documentation (Scalar)

Interactive API documentation is generated from the OpenAPI specification and rendered with **[Scalar](https://scalar.com)**. With the backend running, open:

```
http://localhost:3000/docs
```

The documentation opens with an **Introduction** describing the API, conventions, and resource groups, followed by every endpoint with request/response schemas you can try in the browser.

> Base URL: `http://localhost:3000/api/v1` · Responses are JSON wrapped as `{ "data": ... }`.

| Method  | Endpoint                                                           | Description                                                        |
| ------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `GET`   | `/nodes/tree`                                                      | Full folder tree                                                   |
| `GET`   | `/nodes/:id/children`                                              | Direct children of a folder                                        |
| `GET`   | `/nodes/search?q=`                                                 | Search by name                                                     |
| `GET`   | `/nodes/trash`                                                     | List recycle-bin items                                             |
| `GET`   | `/nodes/:id/content`                                               | Stream a file (range-aware; `?disposition=attachment` to download) |
| `POST`  | `/nodes/folder`                                                    | Create a folder                                                    |
| `PATCH` | `/nodes/:id`                                                       | Rename / move a node                                               |
| `POST`  | `/nodes/move` · `/nodes/copy`                                      | Move / copy nodes (batch)                                          |
| `POST`  | `/nodes/upload`                                                    | Upload files (multipart)                                           |
| `POST`  | `/nodes/:id/extract`                                               | Extract an archive                                                 |
| `POST`  | `/nodes/trash` · `/restore` · `/permanent-delete` · `/trash/empty` | Recycle-bin operations                                             |

---

## 🧪 Testing

The project is covered by unit, integration, component, and end-to-end tests.

### 1. Backend unit tests

```bash
cd backend
bun run test:unit
```

Example output:

```
bun test v1.3

 src/.../path.util.test.ts:
 ✓ joinPath > joins under a root
 ...
 42 pass
 0 fail
 Ran 42 tests across 6 files.
```

### 2. Backend integration tests

These hit the live API, so start the server first (in another terminal) with the database seeded:

```bash
# Terminal 1
cd backend
bun run dev

# Terminal 2
cd backend
bun run test:integration
```

Example output:

```
 ✓ GET /api/v1/nodes/tree > returns 6 root folders
 ✓ folder lifecycle: create → rename → trash → restore → permanent-delete
 21 pass
 0 fail
```

### 3. Frontend unit & component tests

```bash
cd frontend
bun run test
```

Example output:

```
 ✓ src/stores/explorerStore.test.ts (37 tests)
 ✓ src/components/TreeNode.spec.ts (6 tests)
 ...
 Test Files  11 passed (11)
      Tests  88 passed (88)
```

### 4. Frontend end-to-end tests (Playwright)

With the backend running and seeded:

```bash
cd frontend
bunx playwright test
```

Example output:

```
Running 8 tests using 1 worker
 ✓ explorer.spec.ts ...
 ✓ file-manager.spec.ts ...
 ✓ real-files.spec.ts ...
 8 passed
```

### Writing your own unit test

Backend tests use Bun's built-in runner. Create a file ending in `.test.ts` under `backend/tests/unit/`:

```typescript
import { describe, it, expect } from "bun:test";
import { joinPath } from "../../src/application/path.util";

describe("joinPath", () => {
  it("joins a name under a parent path", () => {
    expect(joinPath("/Documents", "Projects")).toBe("/Documents/Projects");
  });
});
```

Run it with `bun test tests/unit/your-file.test.ts`. A passing run prints `1 pass / 0 fail`; a failing assertion prints the expected vs. received values and a non-zero exit code.

Frontend tests use Vitest with the same `describe / it / expect` API (file names end in `.test.ts` or `.spec.ts`); run them with `bun run test`.

---

## 📜 Available Scripts

### Backend (`cd backend`)

| Script                                            | Description                                  |
| ------------------------------------------------- | -------------------------------------------- |
| `bun run dev`                                     | Start the API with hot reload                |
| `bun run start`                                   | Start the API                                |
| `bun run db:generate`                             | Generate a Drizzle migration from the schema |
| `bun run db:migrate`                              | Apply migrations                             |
| `bun run db:seed` / `bun run db:reset`            | Reset + seed the database and sample files   |
| `bun run test` · `test:unit` · `test:integration` | Run tests                                    |

### Frontend (`cd frontend`)

| Script               | Description                     |
| -------------------- | ------------------------------- |
| `bun run dev`        | Start the Vite dev server       |
| `bun run build`      | Type-check + production build   |
| `bun run preview`    | Preview the production build    |
| `bun run type-check` | Type checking with `vue-tsc`    |
| `bun run test`       | Unit & component tests (Vitest) |
| `bun run test:e2e`   | End-to-end tests (Playwright)   |

---

## 👤 Author

**Fajar Iryanto Putra**

---

<div align="center">
Built with Bun, Elysia, Vue 3 and PostgreSQL.
</div>
