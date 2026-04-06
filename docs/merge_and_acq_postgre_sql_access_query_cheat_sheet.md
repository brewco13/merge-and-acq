# Merge\_and\_ACQ – PostgreSQL DB Admin & Diagnostic Kit

## Navigation

Parent:

- Merge\_and\_ACQ – Project Index

Purpose:

- Direct PostgreSQL access, inspection, and diagnostics

Related (future):

- Application Data Model
- Prisma Schema / Migrations

Last Used For:

- (add quick note + date when used)

---

## Purpose

Quick reference for safely accessing and querying the PostgreSQL database running in Docker on Synology.

---

# 1) Accessing PostgreSQL (Primary Method – Recommended)

SSH into Synology, then:

```bash
docker ps
```

Identify container (likely):

```
merge-and-acq-db
```

Connect directly to Postgres:

```bash
docker exec -it merge-and-acq-db psql -U mergeapp -d merge_and_acq
```

---

# 2) Core psql Commands (Navigation & Inspection)

```sql
\l                  -- list databases
\dn                 -- list schemas
\dt                 -- list tables
\dt+                -- tables with size/details
\d "Application"     -- describe table
\q                  -- quit
```

Check context:

```sql
SELECT current_database(), current_user;
```

---

# 3) Expected Core Tables

```text
"Application"
"Ownership"
"DispositionDecision"
"Note"
"_prisma_migrations"
```

⚠️ Prisma uses quoted, case-sensitive names

Always use quotes:

```sql
SELECT * FROM "Application";
```

---

# 4) Starter Safe Queries (READ-ONLY)

## Row Counts

```sql
SELECT COUNT(*) FROM "Application";
SELECT COUNT(*) FROM "Ownership";
SELECT COUNT(*) FROM "DispositionDecision";
SELECT COUNT(*) FROM "Note";
```

## Preview Applications

```sql
SELECT id, name, "businessArea", "updatedAt"
FROM "Application"
ORDER BY "updatedAt" DESC
LIMIT 20;
```

## Search Applications

```sql
SELECT id, name, "businessArea"
FROM "Application"
WHERE name ILIKE '%oracle%'
ORDER BY name;
```

## Application + Ownership

```sql
SELECT
  a.id,
  a.name,
  o."businessOwner",
  o."technicalOwner",
  o."businessDecisionOwner",
  o."technicalDecisionOwner"
FROM "Application" a
LEFT JOIN "Ownership" o
  ON o."applicationId" = a.id
ORDER BY a.name
LIMIT 50;
```

## Application + Disposition

```sql
SELECT
  a.name,
  d."decisionHorizon",
  d."targetDisposition",
  d.status,
  d."targetDate",
  d.rationale
FROM "Application" a
LEFT JOIN "DispositionDecision" d
  ON d."applicationId" = a.id
ORDER BY a.name;
```

## Notes by Application

```sql
SELECT
  a.name,
  n.id,
  n.content,
  n."createdAt",
  n."updatedAt"
FROM "Application" a
LEFT JOIN "Note" n
  ON n."applicationId" = a.id
ORDER BY n."updatedAt" DESC
LIMIT 50;
```

---

# 5) Data Quality Checks (Very Useful)

## Applications Missing Ownership

```sql
SELECT a.id, a.name
FROM "Application" a
LEFT JOIN "Ownership" o
  ON o."applicationId" = a.id
WHERE o.id IS NULL
ORDER BY a.name;
```

## Applications Missing Disposition

```sql
SELECT a.id, a.name
FROM "Application" a
LEFT JOIN "DispositionDecision" d
  ON d."applicationId" = a.id
WHERE d.id IS NULL
ORDER BY a.name;
```

---

# 6) Dev vs Prod Rules

## DEV (Flexible)

- SELECT, INSERT, UPDATE allowed
- experiment and learn
- test joins and logic

## PROD (Strict)

- SELECT only (default)
- avoid direct writes
- never change schema directly

---

# 7) Safe Write Pattern (If Ever Needed)

```sql
BEGIN;

SELECT * FROM "Application" WHERE id = '...';

UPDATE "Application"
SET name = 'New Name'
WHERE id = '...';

SELECT * FROM "Application" WHERE id = '...';

ROLLBACK;  -- use COMMIT only when 100% sure
```

---

# 8) Backup Before Risky Changes

From Synology shell:

```bash
docker exec merge-and-acq-db pg_dump -U mergeapp -d merge_and_acq > backup.sql
```

Compressed:

```bash
docker exec merge-and-acq-db pg_dump -U mergeapp -d merge_and_acq | gzip > backup.sql.gz
```

---

# 9) Common Gotchas

## Case Sensitivity

```sql
-- Works
SELECT * FROM "Application";

-- Fails
SELECT * FROM application;
```

## Prisma vs Database

- Prisma field names ≠ always DB column names
- Always trust `\d "Table"`

## Avoid Schema Drift

- Do NOT manually ALTER tables in prod
- Use Prisma migrations for structure changes

---

# 10) Recommended Workflow

## Development

- build and test SQL
- understand relationships
- validate queries

## Production

- reuse known queries
- inspect only
- avoid experimentation

---

# 11) DB Diagnostic Kit (Operational Queries)

These are higher-value queries tailored to your M&A workflow.

## 1) Applications Missing Key Fields

```sql
SELECT id, name, "businessArea"
FROM "Application"
WHERE name IS NULL
   OR "businessArea" IS NULL
ORDER BY name;
```

## 2) Applications Without Ownership or Disposition (Critical Gaps)

```sql
SELECT
  a.id,
  a.name,
  CASE WHEN o.id IS NULL THEN 'Missing Ownership' END AS ownership_gap,
  CASE WHEN d.id IS NULL THEN 'Missing Disposition' END AS disposition_gap
FROM "Application" a
LEFT JOIN "Ownership" o ON o."applicationId" = a.id
LEFT JOIN "DispositionDecision" d ON d."applicationId" = a.id
WHERE o.id IS NULL OR d.id IS NULL
ORDER BY a.name;
```

## 3) Stale Applications (No Updates Recently)

```sql
SELECT name, "updatedAt"
FROM "Application"
WHERE "updatedAt" < NOW() - INTERVAL '90 days'
ORDER BY "updatedAt";
```

## 4) Disposition by Target State (Portfolio View)

```sql
SELECT
  d."targetDisposition",
  COUNT(*) AS count
FROM "DispositionDecision" d
GROUP BY d."targetDisposition"
ORDER BY count DESC;
```

## 5) Applications by Business Area

```sql
SELECT
  "businessArea",
  COUNT(*) AS app_count
FROM "Application"
GROUP BY "businessArea"
ORDER BY app_count DESC;
```

## 6) TSA / Horizon Tracking (If Used)

```sql
SELECT
  a.name,
  d."decisionHorizon",
  d."targetDate"
FROM "Application" a
JOIN "DispositionDecision" d ON d."applicationId" = a.id
ORDER BY d."targetDate" NULLS LAST;
```

## 7) Notes Activity (Recent Engagement)

```sql
SELECT
  a.name,
  COUNT(n.id) AS note_count,
  MAX(n."updatedAt") AS last_note_update
FROM "Application" a
LEFT JOIN "Note" n ON n."applicationId" = a.id
GROUP BY a.name
ORDER BY last_note_update DESC NULLS LAST;
```

## 8) Orphan Notes (Data Integrity Check)

```sql
SELECT n.id, n.content
FROM "Note" n
LEFT JOIN "Application" a ON a.id = n."applicationId"
WHERE a.id IS NULL;
```

## 9) Recently Updated Records (System Activity Pulse)

```sql
SELECT 'Application' AS table_name, COUNT(*)
FROM "Application"
WHERE "updatedAt" > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 'DispositionDecision', COUNT(*)
FROM "DispositionDecision"
WHERE "updatedAt" > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 'Note', COUNT(*)
FROM "Note"
WHERE "updatedAt" > NOW() - INTERVAL '7 days';
```

## 10) Duplicate Name Check (Common Data Issue)

```sql
SELECT name, COUNT(*)
FROM "Application"
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
```

---

# 12) Recommended Placement in Your Project

**Best structure:**

- Keep this as a **separate canvas**
- Link it from your main Merge\_and\_ACQ Project Index

Why:

- this is operational (DBA-style) knowledge
- grows over time (queries, fixes, scripts)
- avoids cluttering main architecture canvas

Suggested naming in your index:

```
Appendix: PostgreSQL Access & Admin Cheat Sheet
```

---

# 13) Mental Model

- Prisma = application contract
- PostgreSQL = source of truth
- Docker = runtime container

When debugging data → go to PostgreSQL When changing behavior → go through app/Prisma

---

**Last Updated:** 2026-03-28

