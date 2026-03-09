import { useEffect, useState } from 'react';

export type ScoreEntry = {
    tenant_id: string;
    customer_name: string;
    composite_score: number;
    identity_currency: number;
    device_currency: number;
    app_currency: number;
    security_posture: number;
    governance_readiness: number;
    integration_readiness: number;
    calculated_at: string;
};

export type StatsData = {
    tenants: number;
    open_findings: number;
    critical_findings: number;
    high_findings: number;
    playbooks: number;
    integrations: number;
    gdap_active: number;
    gdap_expiring_soon: number;
    avg_composite_score: number;
    recent_scores: ScoreEntry[];
};

export type IntegrationHealthData = {
    integrations: Array<{ id: number; slug: string; name: string; status: string }>;
    sync_stats: Array<{
        sync_job: string;
        total_runs: number;
        successful: number;
        failed: number;
        last_run: string | null;
    }>;
    recent_errors: Array<{ tenant_id: string; sync_job: string; started_at: string; finished_at: string | null }>;
};

export type SecurityData = {
    findings_by_severity: Array<{ severity: string; count: number }>;
    findings_by_category: Array<{ category: string; count: number }>;
    score_distribution: Array<{
        tenant_id: string;
        customer_name: string;
        security_posture: number;
        composite_score: number;
        calculated_at: string;
    }>;
    gdap_coverage: { active: number; expired: number; unknown: number; total: number };
};

export type OperationsData = {
    recent_sync_runs: Array<{
        id: number;
        tenant_id: string;
        sync_job: string;
        status: string;
        records_processed: number;
        started_at: string;
        finished_at: string | null;
    }>;
    sync_summary: { completed: number; failed: number; pending: number; total: number };
    stale_tenants: Array<{ tenant_id: string; customer_name: string; last_sync_at: string | null }>;
    open_alerts: number;
};

export type IdentityLicensingData = {
    mfa_coverage_percent: number;
    stale_users: number;
    risky_users: number;
    total_licenses: number;
    assigned_licenses: number;
    license_waste_percent: number;
};

export type DashboardData = {
    stats: StatsData | null;
    integrationHealth: IntegrationHealthData | null;
    security: SecurityData | null;
    operations: OperationsData | null;
    identityLicensing: IdentityLicensingData | null;
    loading: boolean;
};

const emptyStats: StatsData = {
    tenants: 0, open_findings: 0, critical_findings: 0, high_findings: 0,
    playbooks: 0, integrations: 0, gdap_active: 0, gdap_expiring_soon: 0,
    avg_composite_score: 0, recent_scores: [],
};

export function useDashboardData(): DashboardData {
    const [data, setData] = useState<DashboardData>({
        stats: null, integrationHealth: null, security: null, operations: null, identityLicensing: null, loading: true,
    });

    useEffect(() => {
        Promise.allSettled([
            fetch('/api/v1/dashboard/stats').then((r) => r.json()),
            fetch('/api/v1/dashboard/integration-health').then((r) => r.json()),
            fetch('/api/v1/dashboard/security').then((r) => r.json()),
            fetch('/api/v1/dashboard/operations').then((r) => r.json()),
            fetch('/api/v1/dashboard/identity-licensing').then((r) => r.json()),
        ]).then(([statsR, intR, secR, opsR, idLicR]) => {
            setData({
                stats: statsR.status === 'fulfilled' && statsR.value.success ? statsR.value.data : emptyStats,
                integrationHealth: intR.status === 'fulfilled' && intR.value.success ? intR.value.data : null,
                security: secR.status === 'fulfilled' && secR.value.success ? secR.value.data : null,
                operations: opsR.status === 'fulfilled' && opsR.value.success ? opsR.value.data : null,
                identityLicensing: idLicR.status === 'fulfilled' && idLicR.value.success ? idLicR.value.data : null,
                loading: false,
            });
        });
    }, []);

    return data;
}
