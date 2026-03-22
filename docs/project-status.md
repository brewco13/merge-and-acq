# Merge_and_ACQ Tool – Project Status

## 🎯 Objective
Build a self-hosted internal application for merger application rationalization:
- inventory applications
- capture ownership
- track disposition decisions
- manage notes
- support CSV ingestion
- deploy to Synology for internal use

---

## 🧱 Current Architecture

### App
- Next.js (App Router) + TypeScript
- Located at: `app/web`
- API routes under: `src/app/api/...`

### Database
- PostgreSQL (Docker)
- Prisma ORM (v7)
- Uses `prisma.config.ts` + `@prisma/adapter-pg`

### Local Runtime
- Next dev server: `localhost:3000`
- Docker Compose for Postgres

---

## 📦 Data Model (Active)

- Application
- Ownership
- DispositionDecision
- Note

### Important (Post `db pull`)
Prisma introspection changed relation field names:

| Old | New |
|-----|-----|
| ownerships | Ownership |
| decisions | DispositionDecision |
| notes | Note |

Also, some models now require explicit values on create:
- `id`
- `createdAt`
- `updatedAt`

---

## ✅ Verified Working Features

### Core
- Application list page
- Application detail page
- Create application
- CSV import (applications + ownership + notes)

### Ownership
- Edit ownership page
- Save via PATCH
- Preload existing values

### Disposition
- Edit disposition page
- Upsert TSA + Long-term decisions
- Save via POST route

### Notes (v1)
- Import from CSV (`CMDB Active Notes`)
- Display on detail page
- Edit via dedicated page
- Separate sources:
  - `CMDB_IMPORT`
  - `USER_EDIT`

---

## ⚠️ Known Technical Quirks

### Prisma Introspection Impact
- Relation names are capitalized (e.g., `Application.Note`)
- Must use exact field names in queries and UI
- Some models lost default values → require manual fields in `create()`

### Required Fields on Create
Currently needed in some routes:
```ts
id: crypto.randomUUID()
createdAt: new Date()
updatedAt: new Date()
