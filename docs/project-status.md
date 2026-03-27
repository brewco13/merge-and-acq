# Merge_and_ACQ Tool – Project Status

## Objective
Build a self-hosted internal application for merger application rationalization:
- inventory applications
- capture ownership
- track disposition decisions
- manage notes
- support CSV ingestion
- deploy to Synology for internal use

## Current Status
- Deployed and working on Synology
- Live URL: `https://merge-and-acq.brewco13.com/applications`
- Local development working on PC
- Production deployment pattern established
- Search and filters added to applications page

## Current Architecture

### App
- Next.js App Router + TypeScript
- App path: `app/web`
- API routes: `app/web/src/app/api/...`

### Database
- PostgreSQL
- Prisma ORM
- Prisma config via `prisma.config.ts`

### Deployment
- Synology Docker / Container Manager
- `infra/compose/docker-compose.prod.yml`
- Reverse proxy in DSM
- TLS certificate configured for app hostname

## Verified Working Features
- Application list page
- Application detail page
- Create application
- Ownership edit/save
- Disposition edit/save
- Notes edit/save
- CSV import
- Search on applications page
- Filters on applications page:
  - Business Area
  - TSA disposition

## Important Technical Notes

### Prisma Introspection
After `prisma db pull`, relation names changed and code had to align:
- `Ownership`
- `DispositionDecision`
- `Note`

### Build/Deploy Lessons
- Build-time Prisma generation required `DATABASE_URL` via Docker build args
- `.dockerignore` materially reduced Synology build context and build time
- `.env.prod` is for compose-level secrets only
- App runtime environment is passed through Docker Compose
- Do not commit `.env.prod`

### Environment Separation
- PC = development / testing
- GitHub = source of truth
- Synology = production runtime

## Deployment Notes
See `docs/deployment-synology.md` for:
- compose commands
- migration commands
- reverse proxy config
- update workflow

## Deferred / Planned
- Tailscale-only access hardening
- Full notes history / timeline
- Dynamic filter values sourced from DB
- Dashboard / summary counts
- Additional UX improvements
