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

## Current Status

Current working baseline includes:

- application list page
- application detail page
- create application form
- CSV import for core application records
- ownership display and edit flow
- local Docker + PostgreSQL development environment
- Prisma schema, migrations, and runtime client

This project is currently in active MVP build-out.

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
