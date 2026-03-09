# CodeBlue 365 Tenant Manager - Build Checklist

Status: **Phase 1 implementation scaffold is complete in-repo**. Remaining items are production integration and deployment hardening tasks.

## 1) Foundation and Bootstrap
- [ ] Install and bootstrap a full Laravel 12 application skeleton (blocked by package registry/network restrictions in this environment)
- [x] Wire module namespaces and provider scaffolding (`CodeBlueServiceProvider`)
- [x] Define environment-driven config for auth/scoring in `config/codeblue365.php`

## 2) Identity and Access
- [x] Add Entra callback controller + JIT provisioning service
- [x] Add tenant allow-list config for Entra logins
- [x] Add audit entries for auth success/denial
- [x] Add permission middleware scaffold (`RequirePermission`)
- [x] Apply permission middleware to API routes
- [~] Implement production-grade OIDC token verification (issuer/audience/nonce/signature) — issuer/audience/nonce scaffold implemented; signature verification pending
- [x] Implement Entra group-to-role mapping sync (config-driven scaffold)

## 3) RBAC and Core Data Model
- [x] Create foundational operational tables
- [x] Add RBAC tables and relationship pivots
- [x] Add GDAP + tenant integration relationship tables
- [x] Add model layer for core entities
- [x] Add idempotent seeders for roles/permissions and integration catalog

## 4) Tenant, Integration, and Playbook APIs
- [x] Implement tenant list/detail/create endpoints
- [x] Implement integration list/validate endpoints
- [x] Implement playbook list/detail/validate endpoints
- [x] Implement tenant sync trigger endpoint
- [x] Add API versioning (`/api/v1`)
- [x] Add standardized error/success response envelope
- [x] Add OpenAPI contract for tenants/integrations/playbooks

## 5) Ingestion, Scoring, and Findings
- [x] Add queue job scaffolds for sync, scoring, and findings
- [x] Chain sync jobs using a pipeline service
- [x] Add Graph client abstraction with stub transport implementation
- [x] Add scoring config and persisted score writes
- [x] Add finding lifecycle logic (open/update/resolved) using rule keys
- [~] Implement real Graph connector clients and robust retry/backoff — retry/backoff client wrapper implemented; real Graph transport pending

## 6) Frontend and UX
- [x] Add Inertia page scaffolds for dashboard, tenants, integrations, findings, and playbooks
- [x] Implement real data-fetching and forms in the React pages (tenant create/sync, integration validation, playbook validation)
- [x] Add role-aware navigation and route guards in frontend shell (navigation-level gating scaffold)

## 7) Testing and Quality
- [x] Add static PHP syntax checks for all code in repo
- [x] Add baseline API contract test scaffolding
- [x] Add runnable contract validation script (`scripts/validate_contracts.php`)
- [ ] Add end-to-end feature tests once full Laravel bootstrap and testing stack are installed

## 8) Operations and Security
- [ ] Integrate secret management for Entra/Graph credentials
- [ ] Configure Horizon, queue workers, and scheduler in deployment targets
- [ ] Add observability stack (structured logs, metrics, alerts)
- [ ] Define tenant onboarding runbook and production cutover checklist
