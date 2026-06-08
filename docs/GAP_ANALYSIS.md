# GAP_ANALYSIS.md

## 1. Executive Summary
This repository (`Feruz2404/CRM`, branch `main`) is currently **empty** (no commits, no code, no infrastructure as code, no documentation). Therefore, the current implementation status for the Enterprise Universal Platform defined in the canonical Technical Specification (TZ) is **0% complete**.

The gap is not incremental—this is a **greenfield implementation**. All functional modules (CRM/ERP/WMS/POS/Finance/Loyalty/etc.) and all non-functional requirements (multi-tenancy with PostgreSQL RLS, RS256 JWT auth, audit logging, CI/CD, Kubernetes, fiscal OFD integration, performance targets, and test coverage) must be implemented from scratch.

Key high-risk areas (TZ-driven):
- **Multi-tenant isolation**: shared DB/shared schema with `organisation_id` on every table + PostgreSQL **Row-Level Security (RLS)** enforced via a session variable.
- **Uzbekistan fiscal compliance (OFD)**: every POS transaction must produce and transmit fiscal receipts within required SLA; offline queue + recovery.
- **Security baseline**: JWT **RS256**, MFA (TOTP) for privileged roles, bcrypt (cost 12), immutable audit log.
- **Performance targets**: endpoints P95 < 200ms (TZ).
- **Event architecture**: Redis Streams and/or BullMQ + durable outbox.

## 2. Current Repository Assessment
### 2.1 Repository state
- Repository exists: `Feruz2404/CRM`
- Default branch: `main`
- Visibility: public
- Repository size: 0 (empty)

### 2.2 Commit history status
- **No commits**. GitHub reports: *Git Repository is empty* (HTTP 409 when reading branch).

### 2.3 Existing codebase status
- **None**. No backend, frontend, mobile, database schema, tests, or build tooling present.

### 2.4 Existing infrastructure status
- **None**. No Docker compose, Kubernetes manifests, CI/CD workflows, or runtime configuration.

### 2.5 Existing documentation status
- **None**. No README, ADRs, runbooks, architecture docs, or module docs.

## 3. Target Architecture Assessment (canonical TZ)
The target system is a unified multi-tenant SaaS platform combining CRM + ERP + WMS + POS, targeting Uzbekistan/CIS.

### 3.1 Tenancy model
- Shared database, shared schema.
- Every table contains `organisation_id`.
- PostgreSQL RLS policies enforce tenant isolation using a session variable.
- Hierarchy: Platform → Organisation → Branch → Department → User.

### 3.2 Identity & Access
- Email/password login with bcrypt verification.
- Access token: JWT RS256, 15 minutes.
- Refresh token: 30 days, stored HttpOnly cookie + hashed in DB.
- MFA (TOTP) required for Org Admin and above.
- Optional Google SSO for enterprise.

### 3.3 Core domain modules (TZ)
- CRM: leads, deals, pipelines, activities, contacts.
- Customer management.
- Supplier management + procurement.
- Product catalog: variants, barcodes, units, MXIK.
- WMS: warehouses/zones/bins, inventory, stock movements, counting, transfers; FIFO/FEFO.
- Sales: quotations, orders, deliveries, invoices, payments.
- POS: sessions, transactions, returns/refunds, receipt printing, offline mode + sync engine.
- Fiscal integration (OFD/Soliq.uz): receipts, signatures, QR, Z-reports; offline queue and retry.
- Finance: double-entry accounting, journal, AR/AP, reconciliation, reports.
- Loyalty: cards, tiers, earn/redeem rules.
- Notifications: email/SMS/push/Telegram.
- Reporting + analytics: dashboards, materialized views.
- Mobile apps: customer, staff, POS.

### 3.4 Data layer
- PostgreSQL 15+ with required extensions (pgcrypto, uuid-ossp, pg_trgm).
- Prisma as ORM, migrations for all changes.
- Soft delete where specified.
- Immutable audit log table(s).

### 3.5 Eventing & async
- Redis Streams and/or BullMQ.
- Durable outbox for critical events (especially fiscal).

### 3.6 Infra/deployment
- Docker (dev via docker-compose).
- Kubernetes manifests for production.
- Object storage: S3-compatible (MinIO local/dev; Yandex Object Storage or MinIO on-prem in prod).
- Health endpoint includes db/redis/ofd status.
- Backup & recovery with RTO < 1 hour and RPO < 15 minutes (WAL + PITR); monthly DR drill.

## 4. Module Coverage Matrix
Status legend: Current status is assessed against repository (empty) + TZ. Therefore all modules are **Missing**.

| Module | Required by TZ | Current status | Gap | Priority | Dependencies |
|---|---:|---|---|---|---|
| Authentication | Yes | Missing | Full implementation | P0 | Foundation DB, crypto, config, API framework |
| RBAC / Authorization | Yes | Missing | Full implementation | P0 | Auth, roles/permissions model, tenancy |
| Multi-Tenancy (org/branch scoping + RLS) | Yes | Missing | Full implementation | P0 | DB schema, RLS policies, request context |
| Audit Logging | Yes | Missing | Full implementation | P0 | Auth context, DB schema, event/outbox |
| CI/CD (GitHub Actions) | Yes | Missing | Full implementation | P0 | Repo structure, build/test tooling |
| Security baseline (RS256 JWT, MFA, bcrypt, OWASP) | Yes | Missing | Full implementation | P0 | Auth, config/secrets, infra |
| Monitoring / Observability | Yes | Missing | Full implementation | P0 | Services running, metrics/logging stack |
| Backup & Recovery | Yes | Missing | Full implementation | P0 | PostgreSQL + storage + runbooks |
| CRM | Yes | Missing | Full implementation | P1 | Foundation + auth/RBAC + DB models |
| Customer Management | Yes | Missing | Full implementation | P1 | Foundation + CRM primitives |
| Supplier Management | Yes | Missing | Full implementation | P2 | Foundation + procurement models |
| Procurement | Yes | Missing | Full implementation | P2 | Suppliers, products, inventory |
| Product Catalog | Yes | Missing | Full implementation | P1 | Foundation + pricing + MXIK |
| Pricing | Yes | Missing | Full implementation | P1 | Product catalog |
| WMS | Yes | Missing | Full implementation | P2 | Product catalog, branches/warehouses |
| Inventory | Yes | Missing | Full implementation | P2 | WMS, stock movements |
| Sales | Yes | Missing | Full implementation | P3 | Customers, products, inventory |
| POS | Yes | Missing | Full implementation | P3 | Sales, inventory, fiscal |
| Fiscal Integration (OFD) | Yes | Missing | Full implementation | P3 | POS, outbox/queue, product MXIK |
| Finance | Yes | Missing | Full implementation | P4 | Sales, procurement, payments |
| Loyalty | Yes | Missing | Full implementation | P4 | Customers, POS |
| Notifications | Yes | Missing | Full implementation | P4 | Eventing, templates, providers |
| Reporting | Yes | Missing | Full implementation | P5 | Data model stabilized, materialized views |
| Analytics | Yes | Missing | Full implementation | P5 | Reporting, event pipeline, MV strategy |
| Mobile Applications | Yes | Missing | Full implementation | P6 | Stable APIs, auth, offline sync spec |

## 5. Database Gap Analysis
### 5.1 PostgreSQL
- Required: PostgreSQL 15+ and extensions.
- Current: Missing.
- Gap: Provisioning (local + prod), connection pooling, backup strategy, RLS.

### 5.2 Prisma
- Required: Prisma models + migrations.
- Current: Missing.
- Gap: Monorepo integration, prisma schema, migration workflow, CI checks.

### 5.3 Schema design
Required (TZ-driven, non-exhaustive):
- Organisation, Branch, Department, User
- IAM: refresh tokens, MFA secrets, sessions
- CRM: Lead, Deal, Pipeline, Stage, Activity, Contact
- Customer, Supplier
- Product: Category, Product, Variant, Barcode, Unit, MXIK
- WMS: Warehouse, Zone, Bin, Stock, StockMovement, StockCount, Transfer
- Sales: Quote, Order, Delivery, Invoice, Payment
- POS: Shift/Session, Transaction, LineItem, Return/Refund, Offline queue, Sync state
- Fiscal: FiscalReceipt, OFD requests/responses, signatures, Z-report
- Finance: Accounts, JournalEntry, Ledger, AR/AP, Reconciliation
- Loyalty: Card, Tier, EarnRule, RedeemRule
- Notifications: Template, Message, ProviderLog
- Reporting/Analytics: materialized view definitions and refresh tracking

Current: none.
Gap: everything.

### 5.4 Multi-tenant strategy
- Required: `organisation_id` on every table + PostgreSQL RLS.
- Current: Missing.
- Gap: session variable strategy, policy generation, test harness, safe admin bypass rules.

### 5.5 Audit schema
- Required: append-only immutable audit log; no UPDATE/DELETE.
- Current: Missing.
- Gap: audit_log table(s), indexing, storage policy, retention, access controls.

### 5.6 Event schema / outbox
- Required: durable outbox for critical events.
- Current: Missing.
- Gap: outbox table, publisher worker, idempotency keys, retry policy.

### 5.7 Fiscal schema
- Required: OFD receipt payloads/responses, fiscal signatures, QR data, offline queue.
- Current: Missing.
- Gap: modeling and strict SLA tracking.

### 5.8 Finance schema
- Required: double-entry accounting.
- Current: Missing.
- Gap: chart of accounts, postings, constraints, auditability.

## 6. Infrastructure Gap Analysis
- Docker (compose): Missing → implement local stack (api, db, redis, minio, worker, migrations).
- Kubernetes: Missing → manifests/helm/kustomize, namespaces, secrets, HPA, ingress.
- Redis: Missing → required for cache + streams.
- BullMQ: Missing → required for jobs.
- MinIO/S3: Missing → required for file storage.
- GitHub Actions: Missing → build/test/lint/security scanning + deployment pipeline.
- Monitoring stack: Missing → metrics + dashboards + alerting.
- Observability stack: Missing → structured logs, tracing, correlation IDs.

## 7. Security Gap Analysis (TZ-driven)
Current status for all: **Missing**.
- JWT RS256 signing + key rotation strategy.
- MFA (TOTP) for Org Admin / Accountant / Super Admin.
- Password policy + bcrypt cost 12.
- Refresh token hashing + HttpOnly cookies.
- Rate limiting + OWASP protections.
- Secure headers (CSP/helmet or equivalent).
- Field-level encryption where required.
- Tenant isolation hardening (RLS tests + negative tests).
- Secret management (K8s secrets + sealed secrets or external vault).

## 8. Performance Gap Analysis
- TZ target: endpoint latency P95 < 200ms (normal load).
Current: Missing.
Gap:
- service baseline performance, caching strategy, query/index discipline, async processing, connection pooling.

## 9. Testing Gap Analysis
Current: Missing.
Gap:
- Unit tests
- Integration tests (DB + API)
- E2E tests
- Load tests (latency SLO validation)
- Security tests (SAST, dependency scanning, basic DAST)

## 10. Recommended Implementation Order (dependency-aware)
1) Repository/monorepo skeleton + standards (lint, format, commit conventions)
2) Docker compose dev environment: PostgreSQL + Redis + MinIO
3) Backend foundation: API framework, config, logging, error handling
4) Auth (RS256 JWT + refresh tokens) + MFA scaffolding
5) Tenancy model + PostgreSQL RLS enforcement + test harness
6) RBAC/permissions and audit logging
7) Prisma schema baseline + migrations pipeline
8) Eventing (outbox + streams/queues) + worker runtime
9) Core domains in order: CRM → Customers → Suppliers/Procurement → Product/Pricing → WMS/Inventory → Sales → POS → OFD fiscal → Finance → Loyalty → Notifications
10) Reporting/Analytics (materialized views) + Monitoring/Observability
11) Mobile apps once APIs are stable; implement offline/sync protocols last for POS/mobile
12) Backup & recovery runbooks + DR drill automation
