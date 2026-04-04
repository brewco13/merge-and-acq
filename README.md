# Merge_and_ACQ

Merge_and_ACQ is a self-hosted internal application for managing merger-related application rationalization decisions.

The tool is designed to move merger analysis out of spreadsheets and into a structured, database-backed workflow that supports:

- application inventory management
- business and technical ownership tracking
- merger disposition planning
- candidate target application analysis
- notes and rationale capture
- staged deployment to Synology

---

## Current State (March 2026)

- Application is deployed to Synology
- Production URL: https://merge-and-acq.brewco13.com
- Dashboard implemented
- Client-side dashboard data fetching via API
- PostgreSQL + Prisma backend
- Docker-based deployment--



## Dev Startup (Local Development)
Overview

Dev environment consists of:

PostgreSQL (Docker)
Next.js app (local Node process)
🚀 Step-by-Step
1. Start Postgres (Docker)

From repo root:

docker compose -f infra/compose/docker-compose.dev.yml up -d db

👉 Starts only the database container

2. Verify database is running
docker ps

You should see something like:

merge-and-acq-db
3. Ensure environment file exists

File:

app/web/.env

Example:

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/merge_and_acq"
4. Start the app
cd app/web
npm run dev
5. Open in browser
http://localhost:3000
⚠️ Common Issues
Docker not running

Error:

failed to connect to docker API

Fix:

Start Docker Desktop
Port already in use

Run on different port:

PORT=3008 npm run dev
Prisma / DATABASE_URL errors
Ensure .env exists in app/web
Ensure DATABASE_URL is valid
Don’t use --build for normal dev
docker compose ... up -d

✔ correct for dev
❌ --build will try to build the web container and may fail

🧠 Dev vs Prod (quick mental model)
Component	Dev	Prod
App	npm run dev	Docker
DB	Docker	Docker
Env file	.env	.env.prod
Build step	none	required
✅ Recommendation

Add this as a section in your README.md:

## Local Development
🔥 Optional (but very useful)

Also add to your canvas:

👉 Dev Startup Checklist

So future-you doesn’t have to rediscover this after every reboot.






## Local Development

cd app/web
npm run dev

App runs at:
http://localhost:3000--

docker compose -p mergeandacq-dev -f docker-compose.dev.yml up -d --build
docker compose --env-file .env.dev -p mergeandacq-dev -f docker-compose.dev.yml up -d --build

## Production Deployment (Synology)

git pull

docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d

---

## Core Use Case

During a merger, a large number of applications need to be reviewed and rationalized.

For each application, the tool is intended to answer questions such as:

- What is the application?
- What legacy inventory record did it come from?
- What business area and capability does it support?
- Who owns the application from business and technical perspectives?
- What is the near-term disposition at TSA expiration?
- What is the longer-term target disposition?
- What candidate application(s) may replace, absorb, or consolidate it?
- What notes, rationale, and decisions have been recorded?

---

## Current Data Model

### Application
Tracks the core application inventory record.

Key fields currently include:

- `id`
- `legacyId`
- `name`
- `businessArea`
- `l1Capability`
- `l2Capability`
- `l3Capability`
- `description`

### Ownership
Tracks application-level ownership.

Current ownership fields:

- `businessOwner`
- `technicalOwner`
- `businessDecisionOwner`
- `technicalDecisionOwner`

## Architecture

- UI: Next.js (App Router)
- API: Next.js route handlers
- Data Layer: Prisma + PostgreSQL
- Dashboard:
  - UI: client-side fetch
  - API: /api/dashboard/summary
  - Queries: src/lib/dashboard/queries.ts

---

### Planned / Designed Entities
The following entities are already designed and partially modeled, but not yet fully implemented in UI:

- `DispositionDecision`
- `DecisionCandidateApplication`
- `Note`

---

## Technology Stack

- **Frontend / backend:** Next.js (App Router) + TypeScript
- **Database:** PostgreSQL
- **ORM / migrations:** Prisma
- **Runtime DB adapter:** `@prisma/adapter-pg`
- **Local dev infrastructure:** Docker Compose
- **Target deployment:** Synology Container Manager

---

## Repository Structure

```text
merge_and_acq/
  README.md
  app/
    web/
      prisma/
      src/
      package.json
      prisma.config.ts
  infra/
    compose/
      docker-compose.dev.yml
  scripts/
    import/
      import-applications.ts
  sample-data/
    applications.csv
