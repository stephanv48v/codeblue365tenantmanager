import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import StatusBadge from '../../Components/StatusBadge';
import {
    BuildingOfficeIcon,
    ShieldExclamationIcon,
    HeartIcon,
    ShieldCheckIcon,
    BellAlertIcon,
    UsersIcon,
    CreditCardIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    GlobeAltIcon,
    ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../Components/PageHeader';
import { useDashboardData } from './hooks/useDashboardData';
import type { ScoreEntry } from './hooks/useDashboardData';
import { useTenantScope } from '../../hooks/useTenantScope';
import StatCard from './components/StatCard';
import SectionHeader from './components/SectionHeader';
import ScoreTrendChart from './components/ScoreTrendChart';
import FindingsSeverityChart from './components/FindingsSeverityChart';
import ScoreGauge from './components/ScoreGauge';
import TenantRiskTable from './components/TenantRiskTable';
import GdapCoverageChart from './components/GdapCoverageChart';
import SyncHealthChart from './components/SyncHealthChart';
import IntegrationStatusGrid from './components/IntegrationStatusGrid';

function computeAverageSubScores(scores: ScoreEntry[]) {
    if (scores.length === 0) {
        return { identity_currency: 0, device_currency: 0, app_currency: 0, security_posture: 0, governance_readiness: 0, integration_readiness: 0 };
    }
    // Take latest per tenant
    const byTenant = new Map<string, ScoreEntry>();
    for (const s of scores) {
        if (!byTenant.has(s.tenant_id)) byTenant.set(s.tenant_id, s);
    }
    const values = [...byTenant.values()];
    const avg = (key: keyof ScoreEntry) =>
        Math.round(values.reduce((sum, v) => sum + (v[key] as number), 0) / values.length);
    return {
        identity_currency: avg('identity_currency'),
        device_currency: avg('device_currency'),
        app_currency: avg('app_currency'),
        security_posture: avg('security_posture'),
        governance_readiness: avg('governance_readiness'),
        integration_readiness: avg('integration_readiness'),
    };
}

const gdapVariant = (status: string) => {
    switch (status) {
        case 'active': return 'success' as const;
        case 'pending': return 'warning' as const;
        case 'expired': return 'critical' as const;
        default: return 'neutral' as const;
    }
};

/* ------------------------------------------------------------------ */
/*  Single-Tenant Dashboard View                                       */
/* ------------------------------------------------------------------ */
function TenantDashboard({
    s, sec, ops, intHealth, identityLicensing, selectedTenant,
}: {
    s: NonNullable<ReturnType<typeof useDashboardData>['stats']>;
    sec: ReturnType<typeof useDashboardData>['security'];
    ops: ReturnType<typeof useDashboardData>['operations'];
    intHealth: ReturnType<typeof useDashboardData>['integrationHealth'];
    identityLicensing: ReturnType<typeof useDashboardData>['identityLicensing'];
    selectedTenant: { customer_name: string; primary_domain: string; gdap_status: string; tenant_id: string };
}) {
    const subScores = computeAverageSubScores(s.recent_scores);
    const syncSuccess = ops?.sync_summary
        ? ops.sync_summary.total > 0
            ? Math.round((ops.sync_summary.completed / ops.sync_summary.total) * 100)
            : 0
        : 0;

    return (
        <AppLayout title={`${selectedTenant.customer_name} — Dashboard`}>
            <PageHeader title={`${selectedTenant.customer_name} — Dashboard`} subtitle="Tenant overview" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: selectedTenant.customer_name }]} />
            {/* Tenant Banner */}
            <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
                            {selectedTenant.customer_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{selectedTenant.customer_name}</h2>
                            <div className="flex items-center gap-3 mt-0.5">
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <GlobeAltIcon className="h-3.5 w-3.5" />
                                    {selectedTenant.primary_domain}
                                </div>
                                <StatusBadge variant={gdapVariant(selectedTenant.gdap_status)} label={`GDAP ${selectedTenant.gdap_status}`} dot />
                            </div>
                        </div>
                    </div>
                    <Link
                        href={`/tenants/${selectedTenant.tenant_id}`}
                        className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                        Full Tenant Profile
                    </Link>
                </div>
            </div>

            {/* ROW 1: Key Metrics */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard
                    label="Composite Score"
                    value={s.avg_composite_score}
                    icon={HeartIcon}
                    accentColor={s.avg_composite_score >= 70 ? 'emerald' : s.avg_composite_score >= 50 ? 'amber' : 'red'}
                />
                <StatCard
                    label="Open Findings"
                    value={s.open_findings}
                    icon={ShieldExclamationIcon}
                    href="/findings"
                    accentColor={s.critical_findings > 0 ? 'red' : s.open_findings > 0 ? 'amber' : 'emerald'}
                    badge={s.critical_findings > 0 ? { text: `${s.critical_findings} critical`, color: 'red' } : undefined}
                />
                <StatCard
                    label="GDAP Status"
                    value={selectedTenant.gdap_status === 'active' ? 'Active' : selectedTenant.gdap_status}
                    icon={ShieldCheckIcon}
                    accentColor={selectedTenant.gdap_status === 'active' ? 'emerald' : 'red'}
                />
                <StatCard
                    label="Open Alerts"
                    value={ops?.open_alerts ?? 0}
                    icon={BellAlertIcon}
                    href="/alerts"
                    accentColor={(ops?.open_alerts ?? 0) > 0 ? 'amber' : 'emerald'}
                />
            </div>

            {/* ROW 2: Score Gauge + Score Trend */}
            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-4">
                    <SectionHeader title="Health Score" />
                    <ScoreGauge
                        compositeScore={s.avg_composite_score}
                        subScores={subScores}
                    />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-8">
                    <SectionHeader title="Score History" subtitle="Composite score over time" />
                    <ScoreTrendChart scores={s.recent_scores} />
                </div>
            </div>

            {/* ROW 3: Findings by Severity + Category */}
            <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <SectionHeader title="Findings by Severity" href="/findings" />
                    <FindingsSeverityChart data={sec?.findings_by_severity ?? []} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <SectionHeader title="GDAP & Integration Health" />
                    <div className="grid gap-4 grid-cols-2 mt-2">
                        <div className="rounded-lg bg-slate-50 p-4">
                            <p className="text-xs text-slate-500 mb-1">GDAP Coverage</p>
                            <GdapCoverageChart
                                coverage={sec?.gdap_coverage ?? { active: 0, expired: 0, unknown: 0, total: 0 }}
                                expiringSoon={s.gdap_expiring_soon}
                            />
                        </div>
                        <div className="rounded-lg bg-slate-50 p-4">
                            <p className="text-xs text-slate-500 mb-1">Integration Status</p>
                            <IntegrationStatusGrid
                                integrations={intHealth?.integrations ?? []}
                                recentErrors={intHealth?.recent_errors ?? []}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 4: Identity + Licensing */}
            {identityLicensing && (
                <div className="mb-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <SectionHeader title="Identity Health" subtitle="MFA coverage and risk indicators" href="/identity" />
                        <div className="grid gap-3 grid-cols-3">
                            <div className="rounded-lg bg-slate-50 p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                                        <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{identityLicensing.mfa_coverage_percent}%</p>
                                <p className="text-xs text-slate-500 mt-0.5">MFA Coverage</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${identityLicensing.risky_users > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                                        <ExclamationTriangleIcon className={`h-4 w-4 ${identityLicensing.risky_users > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{identityLicensing.risky_users}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Risky Users</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${identityLicensing.stale_users > 0 ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                                        <ClockIcon className={`h-4 w-4 ${identityLicensing.stale_users > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{identityLicensing.stale_users}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Stale Accounts</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <SectionHeader title="License Efficiency" subtitle="Utilization and waste tracking" href="/licensing" />
                        <div className="grid gap-3 grid-cols-3">
                            <div className="rounded-lg bg-slate-50 p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                        <CreditCardIcon className="h-4 w-4 text-blue-600" />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{identityLicensing.total_licenses.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Total Licenses</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                                        <UsersIcon className="h-4 w-4 text-emerald-600" />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{identityLicensing.assigned_licenses.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Assigned</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${identityLicensing.license_waste_percent > 10 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                                        <ExclamationTriangleIcon className={`h-4 w-4 ${identityLicensing.license_waste_percent > 10 ? 'text-red-600' : 'text-emerald-600'}`} />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{identityLicensing.license_waste_percent}%</p>
                                <p className="text-xs text-slate-500 mt-0.5">Waste</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ROW 5: Sync Operations */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
                <SectionHeader title="Sync Operations" subtitle="Job success and failure rates" href="/operations" />
                <SyncHealthChart
                    syncStats={intHealth?.sync_stats ?? []}
                    syncSummary={ops?.sync_summary ?? { completed: 0, failed: 0, pending: 0, total: 0 }}
                />
            </div>
        </AppLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard Component                                           */
/* ------------------------------------------------------------------ */
export default function DashboardIndex() {
    const { isFiltered, selectedTenant } = useTenantScope();
    const { stats, integrationHealth, security, operations, identityLicensing, loading } = useDashboardData();

    if (loading) {
        return (
            <AppLayout title="Executive Dashboard">
                <PageHeader title="Executive Dashboard" subtitle="Overview of managed tenants" breadcrumbs={[{ label: 'Dashboard' }]} />
                <div className="mb-6 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-28 animate-pulse rounded-xl border bg-slate-100" />
                    ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-8 h-72 animate-pulse rounded-xl border bg-slate-100" />
                    <div className="lg:col-span-4 h-72 animate-pulse rounded-xl border bg-slate-100" />
                </div>
            </AppLayout>
        );
    }

    const s = stats!;
    const sec = security;
    const ops = operations;
    const intHealth = integrationHealth;

    /* ---- Single-Tenant View ---- */
    if (isFiltered && selectedTenant) {
        return (
            <TenantDashboard
                s={s}
                sec={sec}
                ops={ops}
                intHealth={intHealth}
                identityLicensing={identityLicensing}
                selectedTenant={selectedTenant}
            />
        );
    }

    /* ---- All-Tenants View (unchanged) ---- */
    return (
        <AppLayout title="Executive Dashboard">
            <PageHeader title="Executive Dashboard" subtitle="Overview across all managed tenants" breadcrumbs={[{ label: 'Dashboard' }]} />
            {/* ROW 1: Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatCard
                    label="Managed Tenants"
                    value={s.tenants}
                    icon={BuildingOfficeIcon}
                    href="/tenants"
                    accentColor="blue"
                />
                <StatCard
                    label="Open Findings"
                    value={s.open_findings}
                    icon={ShieldExclamationIcon}
                    href="/findings"
                    accentColor="red"
                    badge={s.critical_findings > 0 ? { text: `${s.critical_findings} critical`, color: 'red' } : undefined}
                />
                <StatCard
                    label="Fleet Health"
                    value={s.avg_composite_score}
                    icon={HeartIcon}
                    accentColor="emerald"
                />
                <StatCard
                    label="Active GDAP"
                    value={s.gdap_active}
                    icon={ShieldCheckIcon}
                    href="/security"
                    accentColor="emerald"
                    badge={s.gdap_expiring_soon > 0 ? { text: `${s.gdap_expiring_soon} expiring`, color: 'amber' } : undefined}
                />
                <StatCard
                    label="Open Alerts"
                    value={ops?.open_alerts ?? 0}
                    icon={BellAlertIcon}
                    href="/alerts"
                    accentColor="amber"
                />
            </div>

            {/* ROW 2: Score Trend + Findings Donut */}
            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-8">
                    <SectionHeader title="Score Trends" subtitle="Recent composite scores across tenants" href="/tenants" />
                    <ScoreTrendChart scores={s.recent_scores} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-4">
                    <SectionHeader title="Findings Distribution" href="/findings" />
                    <FindingsSeverityChart data={sec?.findings_by_severity ?? []} />
                </div>
            </div>

            {/* ROW 3: Score Gauge + Tenant Risk Table */}
            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-4">
                    <SectionHeader title="Fleet Health Score" />
                    <ScoreGauge
                        compositeScore={s.avg_composite_score}
                        subScores={computeAverageSubScores(s.recent_scores)}
                    />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-8">
                    <SectionHeader title="Tenant Risk Rankings" subtitle="Sorted by composite score (lowest first)" href="/tenants" />
                    <TenantRiskTable scoreDistribution={sec?.score_distribution ?? []} />
                </div>
            </div>

            {/* ROW 4: GDAP + Integrations */}
            <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <SectionHeader title="GDAP Coverage" href="/security" />
                    <GdapCoverageChart
                        coverage={sec?.gdap_coverage ?? { active: 0, expired: 0, unknown: 0, total: 0 }}
                        expiringSoon={s.gdap_expiring_soon}
                    />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <SectionHeader title="Integration Health" href="/integrations/health" />
                    <IntegrationStatusGrid
                        integrations={intHealth?.integrations ?? []}
                        recentErrors={intHealth?.recent_errors ?? []}
                    />
                </div>
            </div>

            {/* ROW 5: Sync Operations */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
                <SectionHeader title="Sync Operations" subtitle="Job success and failure rates" href="/operations" />
                <SyncHealthChart
                    syncStats={intHealth?.sync_stats ?? []}
                    syncSummary={ops?.sync_summary ?? { completed: 0, failed: 0, pending: 0, total: 0 }}
                />
            </div>

            {/* ROW 6: Identity & Licensing Summary */}
            {identityLicensing && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <SectionHeader title="Identity Health" subtitle="MFA coverage and risk indicators" href="/identity" />
                        <div className="grid gap-3 grid-cols-3">
                            <div className="rounded-lg bg-slate-50 p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                                        <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{identityLicensing.mfa_coverage_percent}%</p>
                                <p className="text-xs text-slate-500 mt-0.5">MFA Coverage</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${identityLicensing.risky_users > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                                        <ExclamationTriangleIcon className={`h-4 w-4 ${identityLicensing.risky_users > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{identityLicensing.risky_users}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Risky Users</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${identityLicensing.stale_users > 0 ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                                        <ClockIcon className={`h-4 w-4 ${identityLicensing.stale_users > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{identityLicensing.stale_users}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Stale Accounts</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <SectionHeader title="License Efficiency" subtitle="Utilization and waste tracking" href="/licensing" />
                        <div className="grid gap-3 grid-cols-3">
                            <div className="rounded-lg bg-slate-50 p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                        <CreditCardIcon className="h-4 w-4 text-blue-600" />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{identityLicensing.total_licenses.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Total Licenses</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                                        <UsersIcon className="h-4 w-4 text-emerald-600" />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{identityLicensing.assigned_licenses.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Assigned</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${identityLicensing.license_waste_percent > 10 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                                        <ExclamationTriangleIcon className={`h-4 w-4 ${identityLicensing.license_waste_percent > 10 ? 'text-red-600' : 'text-emerald-600'}`} />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{identityLicensing.license_waste_percent}%</p>
                                <p className="text-xs text-slate-500 mt-0.5">Waste</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
