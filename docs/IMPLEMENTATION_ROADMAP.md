# IMPLEMENTATION_ROADMAP.md

Scope: Production-grade implementation of the **Enterprise Universal Platform** (CRM + ERP + WMS + POS + Finance + Loyalty + Reporting + Analytics + Notifications + Mobile + Fiscal), strictly per the canonical TZ (`Enterprise_CRM_ERP_WMS_POS_TZ_v2.docx`).

Repository baseline: `Feruz2404/CRM` on `main` is currently greenfield (no commits prior to documentation bootstrap).

## Roadmap principles (TZ-driven)
- **No feature work** proceeds without: tenant isolation (PostgreSQL RLS), auth (JWT RS256 + refresh), RBAC, audit logging, and CI gates.
- Every delivery must include: validation, authorization/RBAC, tenant isolation, audit logging, OpenAPI, unit + integration tests.
- Fiscal and other critical side-effects must use a **durable outbox** + idempotency.
- Performance target: endpoints **P95 < 200ms** under normal load (TZ).
- Backup/DR targets: **RTO < 1 hour**, **RPO < 15 minutes** (TZ).

## Phase 0 — Foundation (Platform skeleton)
### Objective
Create the baseline architecture and tooling required for a secure multi-tenant SaaS platform.

### Deliverables
- Monorepo structure (backend + workers + shared libs + infra manifests)
- PostgreSQL 15+ local/prod provisioning plan, with extensions: `pgcrypto`, `uuid-ossp`, `pg_trgm`
- Prisma baseline schema + migration workflow
- Authentication: email/password + bcrypt (cost 12) + JWT RS256 (15m access) + refresh tokens (30d)
- MFA (TOTP) enforcement for privileged roles (Org Admin, Accountant, Super Admin)
- Multi-tenancy: `organisation_id` everywhere + PostgreSQL RLS using session variable (TZ)
- RBAC model and enforcement middleware
- Audit logging: append-only immutable audit logs (no UPDATE/DELETE)
- Eventing baseline: Redis + Redis Streams and BullMQ + outbox table + worker
- Object storage baseline: S3-compatible (MinIO dev) + direct upload strategy
- Docker compose for local stack
- Kubernetes base manifests
- CI/CD (GitHub Actions): lint, unit tests, integration tests, security checks
- Health endpoint contract: `{ status, db, redis, ofd, version, uptime }`
- Backup & recovery plan (WAL + PITR) + monthly DR drill runbook

### Dependencies
- None (starting point)

### Blocking issues
- None

### Estimated effort
- High (core platform); must be completed before domain modules.

### Milestones
- M0.1 Repo scaffold + CI baseline
- M0.2 DB + Prisma migrations
- M0.3 Auth + refresh + MFA
- M0.4 RLS + RBAC + audit logging
- M0.5 Eventing (outbox + queues/streams)
- M0.6 Docker + K8s baseline + backup plan

### Risks
- Incorrect RLS/session-variable propagation causing tenant data leakage
- Auth token lifecycle mistakes (refresh token storage/rotation)
- Audit log immutability not enforced at DB level

### Acceptance criteria
- Integration tests prove RLS isolation across organisations
- Auth flows validated, MFA enforced for required roles
- CI pipeline green with minimum test suites enabled
- Audit logs written for required operations

## Phase 1 — CRM
### Objective
Implement CRM lifecycle: Lead → Deal/Pipeline → Activities/Contacts.

### Deliverables
- Prisma models + migrations for CRM entities
- CRUD + workflow endpoints with validation, RBAC, audit logs
- OpenAPI coverage for all endpoints
- Unit + integration tests

### Dependencies
- Phase 0 complete

### Estimated effort
- Medium

### Acceptance criteria
- End-to-end CRM flows pass integration tests and adhere to tenancy + RBAC

## Phase 2 — Customer Management
### Objective
Implement customer master data, relationships to CRM/Sales/POS/Loyalty.

### Deliverables
- Customer entities + endpoints
- Search/indexing strategy (pg_trgm) for fast lookup
- Tests + OpenAPI

### Dependencies
- Phase 0, Phase 1

### Estimated effort
- Medium

### Acceptance criteria
- Customer lookup performant and tenancy-safe

## Phase 3 — Supplier Management + Procurement
### Objective
Implement suppliers and procurement workflows required by TZ.

### Deliverables
- Supplier entities + procurement entities (purchase orders, receiving, etc.)
- Integration to inventory stock movements
- Tests + OpenAPI

### Dependencies
- Phase 0, Product Catalog baseline (Phase 4 may be partially required)

### Estimated effort
- Medium/High

### Acceptance criteria
- Procurement operations produce correct inventory/audit trails

## Phase 4 — Product Catalog + Pricing + MXIK
### Objective
Implement catalog with variants, barcodes, units, pricing rules, MXIK classifier.

### Deliverables
- Product/variant/barcode/UOM models
- Pricing model + endpoints
- MXIK mapping + validation rules (blocks fiscal sale for missing MXIK)

### Dependencies
- Phase 0

### Estimated effort
- High

### Acceptance criteria
- Products are usable by WMS/Sales/POS; MXIK enforcement test-covered

## Phase 5 — WMS + Inventory
### Objective
Warehouses/zones/bins + stock movements + counting + transfers; FIFO/FEFO.

### Deliverables
- Warehouse topology models
- Stock, stock movement ledger
- FIFO/FEFO allocation algorithms
- Stock counting & reconciliation
- Transfers between warehouses/branches

### Dependencies
- Phase 0, Phase 4

### Estimated effort
- High

### Acceptance criteria
- Inventory integrity invariants validated with integration tests

## Phase 6 — Sales
### Objective
Quotations → Orders → Deliveries → Invoices → Payments.

### Deliverables
- Sales docs models + endpoints
- Posting hooks to finance outbox (later phase)
- Integration tests across sales lifecycle

### Dependencies
- Phase 0, Phase 2, Phase 4, Phase 5

### Estimated effort
- High

### Acceptance criteria
- Full sales lifecycle consistent with stock reservations and billing rules

## Phase 7 — POS
### Objective
Sessions/shifts + fast checkout + offline mode + sync engine.

### Deliverables
- POS shift/session lifecycle
- Transaction processing, returns/refunds
- Offline queue + conflict resolution + sync state model
- Receipt printing integration points

### Dependencies
- Phase 0, Phase 4, Phase 5, Phase 6

### Estimated effort
- High

### Risks
- Offline/sync correctness and idempotency

### Acceptance criteria
- POS operations are idempotent and recoverable from offline queues

## Phase 8 — Fiscal Integration (OFD / Soliq.uz)
### Objective
Uzbekistan fiscal compliance: fiscal receipts, signatures, QR, Z-reports; SLA and recovery.

### Deliverables
- OFD client + strict request/response persistence
- Fiscal receipt generation from POS transaction
- Transmit within required window; retries + offline queue
- Z-report flow at shift close
- Health endpoint includes OFD status

### Dependencies
- Phase 0 eventing/outbox, Phase 7 POS

### Estimated effort
- High

### Risks
- Regulatory compliance errors; operational outages without robust retry/reconciliation

### Acceptance criteria
- Automated tests for payload mapping; simulated OFD failures prove recovery path

## Phase 9 — Finance + Cross-cutting (Loyalty, Notifications, Reporting, Analytics, Monitoring)
### Objective
Implement double-entry accounting and platform-wide capabilities.

### Deliverables
- Double-entry accounting core (chart of accounts, journal entries, postings)
- AR/AP + reconciliation
- Financial reports
- Loyalty engine (tiers/earn/redeem)
- Notifications (email/SMS/push/Telegram) via event pipeline
- Reporting + analytics (materialized views; role-based dashboards)
- Monitoring/observability stack and alerting
- Load testing and performance tuning to hit P95 target

### Dependencies
- Sales/Procurement/POS stabilized, Phase 0 monitoring baseline

### Estimated effort
- Very high

### Acceptance criteria
- Finance invariants enforced and auditable
- Reporting/analytics refresh pipeline reliable
- Observability + backups verified against TZ RTO/RPO

## Global milestones (program-level)
- G1: Phase 0 complete, security baseline enforced
- G2: CRM + Customer + Product foundation usable
- G3: WMS + Sales operational
- G4: POS operational (non-fiscal)
- G5: OFD fiscal compliance achieved
- G6: Finance + reporting + analytics complete
- G7: Mobile apps + sync hardening (post-stable APIs)

## Program risks (TZ-critical)
- Tenant isolation failures (RLS gaps)
- Fiscal compliance gaps (OFD payloads/SLA/offline recovery)
- Performance failure to meet P95 target without caching/indexing discipline
- Insufficient automated tests causing regressions

## Acceptance criteria (overall)
- Tenant isolation proven by automated negative tests
- Security controls implemented as specified (RS256 JWT, MFA, bcrypt, secure cookies)
- Fiscal compliance flows validated and recoverable
- CI gates enforce test/lint/security checks
- Backups & DR runbook meets RTO/RPO targets
