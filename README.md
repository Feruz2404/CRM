# Enterprise Universal Platform (CRM + ERP + WMS + POS)

Canonical source of truth: `Enterprise_CRM_ERP_WMS_POS_TZ_v2.docx`.

## Repo layout
- `apps/api` — backend API
- `apps/web` — web frontend
- `apps/worker` — background workers (BullMQ / outbox)
- `packages/db` — Prisma schema + migrations
- `packages/shared` — shared utilities/types
- `infrastructure/docker` — local dev stack

## Local development
1) Install pnpm + dependencies:

```bash
pnpm install
```

2) Start local infrastructure:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

3) Run migrations:

```bash
pnpm db:migrate
```

4) Start apps:

```bash
pnpm dev
```
