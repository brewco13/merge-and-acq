# Merge_and_ACQ – Synology Deployment

## Repo location on Synology
`/volume1/docker/merge-and-acq/apps`

## Prerequisites
- Repo cloned on Synology
- Git working on Synology
- Docker / Container Manager working
- Reverse proxy and certificate configured in DSM
- DNS record created for `merge-and-acq.brewco13.com`

## Files used
- `app/web/Dockerfile`
- `infra/compose/docker-compose.prod.yml`
- `infra/compose/.env.prod`

## Create environment file on Synology
Create:

`/volume1/docker/merge-and-acq/apps/infra/compose/.env.prod`

Example contents:

```env
POSTGRES_PASSWORD=replace_with_strong_password
