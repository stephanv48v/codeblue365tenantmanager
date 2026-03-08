# CodeBlue 365 Tenant Manager
## Comprehensive Technical Architecture, Specification, and Build Blueprint

## 1) Executive Overview
CodeBlue 365 Tenant Manager is an internal MSP operations platform that provides CodeBlue a single pane of glass for Microsoft 365 tenant posture, integration readiness, access visibility, and cross-tenant operational insights.

The platform is intentionally focused on Microsoft 365 tenant intelligence (not PSA/ticketing replacement):
- Tenant health and governance posture visibility
- GDAP relationship and access coverage monitoring
- Integration readiness and validation workflows
- Actionable findings, recommendations, and remediation guidance

## 2) Core Goals
- Centralized visibility of all managed Microsoft 365 tenants
- Continuous monitoring of tenant posture and readiness
- GDAP relationship and role coverage tracking
- Microsoft integration and consent readiness validation
- Step-by-step integration guidance via playbooks
- Automated findings and recommendations generation
- Executive and engineering dashboards across tenants

## 3) Technology Stack
### Backend
- Laravel 12
- PHP 8.3+
- PostgreSQL
- Redis
- Laravel Horizon

### Frontend
- React
- TypeScript
- Inertia.js
- Tailwind CSS

### Infrastructure
- Queue-driven ingestion architecture
- Microsoft Graph API integration layer
- Multi-tenant data model and isolation controls
- Secure secret handling and token lifecycle management

## 4) High-Level Architecture
```text
┌──────────────────────────┐
│ Entra ID (OIDC / Groups) │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────┐
│ Laravel App (API + Inertia Controllers + Domain Modules)│
│                                                          │
│  Modules: Identity, Tenants, GDAP, Integrations,        │
│           Ingestion, Scoring, Findings, Reports, Alerts │
└───────┬──────────────────────────────┬───────────────────┘
        │                              │
        ▼                              ▼
┌──────────────┐               ┌──────────────┐
│ PostgreSQL   │               │ Redis/Horizon│
│ Source +     │               │ Queues/Jobs  │
│ normalized   │               │ Scheduling   │
└───────┬──────┘               └───────┬──────┘
        │                              │
        └──────────────┬───────────────┘
                       ▼
          ┌───────────────────────────────┐
          │ Graph Connectors + Sync Jobs  │
          │ (Tenant/User/Device/License/  │
          │ ServiceHealth/Secure Score)   │
          └───────────────────────────────┘
```

## 5) Core Platform Modules
1. **Identity & Access**: Entra login, JIT provisioning, RBAC authorization
2. **Managed Tenants**: tenant registry, ownership, tiering, metadata
3. **GDAP Relationship Center**: relationship status, expiry, role coverage
4. **Integration Management**: catalog, statuses, prerequisites, validations
5. **Integration Playbooks**: guided setup, troubleshooting, reusable content
6. **Data Ingestion Engine**: queue-driven Graph synchronization orchestration
7. **Normalization Layer**: transform external objects into stable internal schema
8. **Tenant Health Scoring**: weighted category scoring and trend tracking
9. **Findings & Recommendations**: rule-driven detection and remediation output
10. **Dashboards & Reporting**: executive, operations, security, tenant drill-downs
11. **Alerts & Notifications**: thresholds and event-based notifications
12. **Audit & Compliance**: immutable security and admin activity logs
13. **Administration**: settings, role management, governance controls

## 6) Identity and Access Architecture (Entra ID)
### Authentication
- OpenID Connect (Authorization Code + PKCE where applicable)
- Tenant-restricted login (allow-list of trusted Entra tenant IDs)
- ID token and userinfo claim validation: issuer, audience, nonce, exp

### JIT User Provisioning
- On first successful login:
  - Create local `users` record if not present
  - Populate profile fields (name, email, Entra object ID, tenant)
  - Assign default role or mapped role(s) from Entra groups
- On subsequent logins:
  - Sync mutable profile fields
  - Update `last_login_at`, `last_login_ip`, `last_mfa_claim`

### Session and Access Controls
- Session issue and revocation tracking
- Optional conditional access awareness through claims
- MFA claim awareness (store and surface at session level)
- Forced re-authentication for privileged actions

### Auditing
- Log successful and failed authentication attempts
- Log role assignments and privilege elevation events

## 7) RBAC Model
### Roles
- Platform Super Admin
- Security Admin
- Integration Admin
- MSP Operations Manager
- Senior Engineer
- Engineer
- Service Desk
- Account Manager
- Auditor
- Read Only Analyst

### Permission Catalog
- `users.manage`
- `roles.manage`
- `tenants.view`
- `tenants.manage`
- `integrations.view`
- `integrations.manage`
- `graph.sync.run`
- `reports.export`
- `audit.view`
- `findings.manage`
- `alerts.manage`

### Authorization Design
- Route middleware: `auth`, `tenant.scope`, `can:<permission>`
- Policy-based object access checks
- Optional role inheritance to minimize duplication

## 8) Tenant Domain Model
Each managed tenant should track:
- Tenant ID
- Customer Name
- Primary Domain
- Additional Domains
- GDAP Relationship Status
- GDAP Expiry Date
- Integration Status
- Last Sync Timestamp
- Assigned Engineer
- Support Tier

## 9) GDAP Relationship Center
### Capabilities
- Active GDAP relationships inventory
- Expiring-soon and expired relationship detection
- Access assignment and required role coverage matrix
- Integration readiness indicators tied to GDAP state
- Relationship history/event timeline

### Key KPIs
- % tenants with active GDAP
- # relationships expiring in 30/60/90 days
- % tenants missing required GDAP roles for integrations

## 10) Integration Framework
Every integration should include:
- Status indicators (Not Configured, Pending, Healthy, Degraded, Failed)
- Prerequisite validation rules
- Permission and scope validation
- Consent validation status
- Troubleshooting guidance
- Sync history and telemetry
- Error logging with actionable remediation

## 11) Integration Playbooks (CMS-driven)
### Components
- Integration catalog entries (metadata + compatibility)
- Setup wizard with step gating
- Validation toolkit (API tests + claim/scope checks)
- Troubleshooting guides with known errors
- Editable CMS content for instructions and runbooks
- Human-readable error explanation and next actions

### Suggested Playbook Data Shape
- `slug`, `title`, `version`, `owner`
- `prerequisites[]`
- `steps[]` (instruction, expected result, validation endpoint)
- `permissions[]`
- `gdap_requirements[]`
- `consent_requirements[]`
- `troubleshooting[]`

## 12) Microsoft Integrations (Priority)
- Microsoft Graph
- Microsoft Entra ID
- Microsoft Intune
- Microsoft 365 Usage Reporting
- Microsoft Secure Score
- Identity Secure Score
- Service Health / Message Center
- License Data
- Device Inventory

## 13) Data Ingestion Engine
### Services
- `GraphIngestionService`
- `TenantSyncService`
- `DeviceSyncService`
- `UserSyncService`
- `LicenseSyncService`
- `ServiceHealthSyncService`

### Jobs
- `SyncTenantDevicesJob`
- `SyncTenantUsersJob`
- `SyncTenantLicensingJob`
- `SyncTenantHealthJob`
- `CalculateTenantScoreJob`
- `GenerateFindingsJob`

### Ingestion Design
- Scheduler enqueues tenant-specific jobs
- Jobs use retry/backoff and dead-letter behavior
- Raw ingestion snapshots retained for traceability
- Normalized tables receive canonical transformed entities
- Sync run records capture duration, counts, and failure reasons

## 14) Scoring Engine
### Score Categories
- Identity Currency
- Device Currency
- App Currency
- Security Posture
- Governance Readiness
- Integration Readiness

### Method
- Weighted signals from normalized ingestion data
- Category scores rolled into composite tenant score
- Store score history for trend analytics
- Trigger findings when thresholds or regressions occur

## 15) Findings and Recommendations Engine
Each finding includes:
- Category
- Severity
- Description
- Evidence
- Impact
- Recommended remediation
- First detected timestamp
- Last detected timestamp

Design principles:
- Deterministic rule versioning
- De-duplication and lifecycle state (open, acknowledged, resolved)
- Link findings to evidence artifacts and run IDs

## 16) Dashboards and Reporting
### Dashboard Set
- Executive Dashboard
- Tenant Overview Dashboard
- Integration Health Dashboard
- Security Dashboard
- Operations Dashboard

### UX Patterns
- Fleet-level KPIs with tenant drill-down
- Status chips and risk heatmaps
- Time series trends for score and sync reliability
- Exportable reports for leadership and account teams

## 17) Database Schema (Logical)
Core tables:
- `users`
- `roles`
- `permissions`
- `user_roles`
- `managed_tenants`
- `tenant_domains`
- `gdap_relationships`
- `integrations`
- `tenant_integrations`
- `sync_jobs`
- `sync_runs`
- `devices`
- `users_normalized`
- `licenses`
- `scores`
- `findings`
- `recommendations`
- `alerts`
- `audit_logs`
- `settings`

## 18) Laravel Project Structure
```text
app/
Modules/
  Identity/
  Tenants/
  Integrations/
  Ingestion/
  Scoring/
  Findings/
  Reports/
  Alerts/
  Admin/
```

Suggested module internals:
- `Domain/` entities, value objects, services
- `Application/` use cases + DTOs
- `Infrastructure/` repositories, APIs, jobs
- `Http/` controllers, requests, resources, policies

## 19) API Design (Examples)
### Tenant APIs
- `GET /api/tenants`
- `GET /api/tenants/{id}`
- `POST /api/tenants`

### Integration APIs
- `GET /api/integrations`
- `POST /api/integrations/validate`

### Sync and Findings APIs
- `POST /api/sync/tenant`
- `GET /api/findings`

API standards:
- Versioned routes (`/api/v1/...`)
- Cursor pagination for large result sets
- Consistent error envelope with correlation IDs
- Authorization by permission and tenant scope

## 20) Security Architecture
- Encrypted secrets at rest (KMS-backed in production)
- Role-based authorization and policy enforcement
- Comprehensive audit logging for sensitive operations
- Secure token storage and rotation strategy
- Tenant data isolation rules and query scoping
- Admin action confirmation and step-up auth for risky operations

## 21) MVP (Phase 1)
- Entra login
- RBAC system
- Tenant management
- GDAP dashboard
- Graph connectivity validation
- Integration playbooks
- Basic scoring
- Executive dashboards

## 22) Phase 2 Roadmap
- Secure Score ingestion
- Intune device insights
- Identity Secure Score
- Cross-tenant benchmarking
- Advanced reporting
- Customer-facing reporting portal

## 23) Build Prompt (Master Prompt)
Use this prompt to generate implementation plans and scaffolding:

> You are a senior Laravel 12 architect and Microsoft 365 integration specialist.
> 
> Design and generate a production-grade MSP platform called CodeBlue 365 Tenant Manager.
> 
> The system must include:
> - Laravel 12 backend
> - React + Inertia frontend
> - Microsoft Entra authentication
> - RBAC permissions system
> - Microsoft Graph ingestion
> - GDAP-aware tenant management
> - Integration playbooks inside the UI
> - Tenant scoring engine
> - Findings and recommendations
> - Cross-tenant dashboards
> 
> Provide architecture, database schema, modules, APIs, jobs, UI pages, and deployment plan.

## 24) Focus Prompt: Entra Authentication
> Design Entra authentication with:
> - OIDC login
> - Tenant restriction
> - JIT user provisioning
> - Role mapping from Entra groups
> - Authorization middleware
> - Audit logging

## 25) Focus Prompt: Integration Playbooks
> Design the Integration Playbooks system.
> 
> Include:
> - Integration catalog
> - Setup wizard
> - Validation tools
> - Troubleshooting guides
> - CMS editable content
> - Error explanations

## 26) Deployment Plan (Pragmatic)
1. **Environment provisioning**: app, db, redis, worker, scheduler
2. **CI/CD pipeline**: lint, static analysis, tests, migrations, deploy gates
3. **Secrets bootstrap**: Entra app credentials + Graph secrets in vault
4. **Initial RBAC seeding**: roles, permissions, baseline assignments
5. **Tenant onboarding runbook**: import tenant metadata and GDAP checks
6. **First sync dry run**: execute ingestion + scoring + findings
7. **Observability hardening**: logs, metrics, alerts, dashboard SLOs
8. **Production cutover**: gradual tenant enablement and rollback plan
