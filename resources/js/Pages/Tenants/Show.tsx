import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import ChartCard from '../../Components/ChartCard';
import SkeletonLoader from '../../Components/SkeletonLoader';
import PaginationControls from '../../Components/PaginationControls';
import ScoreGauge from '../Dashboard/components/ScoreGauge';
import {
    HeartIcon,
    ShieldCheckIcon,
    ShieldExclamationIcon,
    ArrowPathIcon,
    ClockIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

type TenantDetail = {
    id: number;
    tenant_id: string;
    customer_name: string;
    primary_domain: string;
    gdap_status: string;
    gdap_expiry_at: string | null;
    integration_status: string | null;
    last_sync_at: string | null;
    assigned_engineer: string | null;
    support_tier: string | null;
};

type GdapRelationship = {
    id: number;
    status: string;
    starts_at: string | null;
    expires_at: string | null;
    role_assignments: Record<string, unknown>;
};

type Score = {
    identity_currency: number;
    device_currency: number;
    app_currency: number;
    security_posture: number;
    governance_readiness: number;
    integration_readiness: number;
    composite_score: number;
    calculated_at: string;
};

type Finding = {
    category: string;
    severity: string;
    description: string;
    status: string;
    recommended_remediation: string;
};

type SyncRun = {
    id: number;
    tenant_id: string;
    sync_job: string;
    status: string;
    records_processed: number;
    started_at: string;
    finished_at: string | null;
};

type PageProps = {
    tenantId: string;
};

type Tab = 'overview' | 'security' | 'sync';

const gdapVariant = (status: string) => {
    switch (status) {
        case 'active': return 'active' as const;
        case 'pending': return 'pending' as const;
        case 'expired': return 'expired' as const;
        default: return 'neutral' as const;
    }
};

const severityVariant = (severity: string) => {
    switch (severity) {
        case 'critical': return 'critical' as const;
        case 'high': return 'high' as const;
        case 'medium': return 'medium' as const;
        case 'low': return 'low' as const;
        default: return 'info' as const;
    }
};

function relativeTime(dateStr: string | null): string {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

type SyncPagination = {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

export default function TenantShow({ tenantId }: PageProps) {
    const [tenant, setTenant] = useState<TenantDetail | null>(null);
    const [gdapRelationships, setGdapRelationships] = useState<GdapRelationship[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [findings, setFindings] = useState<Finding[]>([]);
    const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
    const [syncPagination, setSyncPagination] = useState<SyncPagination>({ total: 0, per_page: 25, current_page: 1, last_page: 1 });
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncStatusFilter, setSyncStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const fetchSyncHistory = useCallback(async (page = 1, perPage = 25, status?: string) => {
        setSyncLoading(true);
        const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
        const s = status ?? syncStatusFilter;
        if (s) params.set('status', s);
        try {
            const res = await fetch(`/api/v1/sync/tenant/${tenantId}/history?${params}`);
            const data = await res.json();
            if (data.success) {
                setSyncRuns(data.data.items ?? []);
                setSyncPagination(data.data.pagination ?? { total: 0, per_page: perPage, current_page: 1, last_page: 1 });
            }
        } finally {
            setSyncLoading(false);
        }
    }, [tenantId, syncStatusFilter]);

    useEffect(() => {
        async function load() {
            try {
                const tenantRes = await fetch(`/api/v1/tenants/${tenantId}`).then((r) => r.json());
                if (tenantRes.success) {
                    setTenant(tenantRes.data.tenant ?? null);
                    setGdapRelationships(tenantRes.data.gdap_relationships ?? []);
                    setScores(tenantRes.data.scores ?? []);
                    setFindings(tenantRes.data.findings ?? []);
                }
            } finally {
                setLoading(false);
            }
        }

        void load();
        fetchSyncHistory();
    }, [tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    const onSync = async () => {
        setSyncing(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/v1/sync/tenant/${tenantId}`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
            });
            const payload = await res.json();
            setMessage(payload.success ? 'Sync pipeline queued.' : payload.error?.message ?? 'Sync failed.');
        } finally {
            setSyncing(false);
        }
    };

    const latestScore = scores.length > 0 ? scores[0] : null;
    const openFindings = findings.filter((f) => f.status === 'open');
    const criticalFindings = openFindings.filter((f) => f.severity === 'critical').length;

    if (loading) {
        return (
            <AppLayout title="Tenant Detail">
                <PageHeader
                    title="Loading..."
                    breadcrumbs={[{ label: 'Customers' }, { label: 'Tenants', href: '/tenants' }, { label: '...' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
                <SkeletonLoader variant="chart" count={2} />
            </AppLayout>
        );
    }

    if (!tenant) {
        return (
            <AppLayout title="Tenant Detail">
                <PageHeader
                    title="Tenant Not Found"
                    breadcrumbs={[{ label: 'Customers' }, { label: 'Tenants', href: '/tenants' }]}
                />
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                    <p className="text-sm text-slate-500">The requested tenant could not be found.</p>
                </div>
            </AppLayout>
        );
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'security', label: 'Security & Findings' },
        { key: 'sync', label: 'Sync History' },
    ];

    const scoreChartData = [...scores].reverse().map((s) => ({
        date: new Date(s.calculated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        composite: s.composite_score,
        identity: s.identity_currency,
        security: s.security_posture,
        device: s.device_currency,
    }));

    return (
        <AppLayout title={tenant.customer_name}>
            <PageHeader
                title={tenant.customer_name}
                subtitle={tenant.primary_domain}
                breadcrumbs={[
                    { label: 'Customers' },
                    { label: 'Tenants', href: '/tenants' },
                    { label: tenant.customer_name },
                ]}
                actions={
                    <button
                        onClick={() => void onSync()}
                        disabled={syncing}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                        type="button"
                    >
                        <ArrowPathIcon className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Queue Sync'}
                    </button>
                }
            />

            {message && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div>
            )}

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard
                    label="Composite Score"
                    value={latestScore?.composite_score ?? '—'}
                    icon={HeartIcon}
                    accentColor={latestScore && latestScore.composite_score >= 70 ? 'emerald' : latestScore && latestScore.composite_score >= 50 ? 'amber' : 'red'}
                />
                <StatCard
                    label="GDAP Status"
                    value={tenant.gdap_status}
                    icon={ShieldCheckIcon}
                    accentColor={tenant.gdap_status === 'active' ? 'emerald' : tenant.gdap_status === 'expired' ? 'red' : 'amber'}
                />
                <StatCard
                    label="Open Findings"
                    value={openFindings.length}
                    icon={ShieldExclamationIcon}
                    accentColor={criticalFindings > 0 ? 'red' : openFindings.length > 0 ? 'amber' : 'emerald'}
                    badge={criticalFindings > 0 ? { text: `${criticalFindings} critical`, color: 'red' } : undefined}
                />
                <StatCard
                    label="Last Sync"
                    value={relativeTime(tenant.last_sync_at)}
                    icon={ClockIcon}
                    accentColor="blue"
                    subtitle={tenant.assigned_engineer ? `Eng: ${tenant.assigned_engineer}` : undefined}
                />
            </div>

            {/* Tenant Info Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4">
                <span className="text-xs text-slate-400">Tenant ID:</span>
                <code className="text-xs font-mono text-slate-600">{tenant.tenant_id}</code>
                <span className="mx-2 h-4 w-px bg-slate-200" />
                <StatusBadge variant={gdapVariant(tenant.gdap_status)} label={`GDAP: ${tenant.gdap_status}`} dot />
                {tenant.support_tier && (
                    <>
                        <span className="mx-2 h-4 w-px bg-slate-200" />
                        <StatusBadge variant="info" label={tenant.support_tier} />
                    </>
                )}
                {tenant.assigned_engineer && (
                    <>
                        <span className="mx-2 h-4 w-px bg-slate-200" />
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <UserIcon className="h-3.5 w-3.5" />
                            {tenant.assigned_engineer}
                        </span>
                    </>
                )}
                {tenant.gdap_expiry_at && (
                    <>
                        <span className="mx-2 h-4 w-px bg-slate-200" />
                        <span className="text-xs text-slate-400">
                            GDAP expires: {new Date(tenant.gdap_expiry_at).toLocaleDateString()}
                        </span>
                    </>
                )}
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-1 border-b border-slate-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                            activeTab === tab.key
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                        type="button"
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Score Gauge */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-4">
                        <h3 className="mb-4 text-sm font-semibold text-slate-800">Health Score</h3>
                        {latestScore ? (
                            <ScoreGauge
                                compositeScore={latestScore.composite_score}
                                subScores={{
                                    identity_currency: latestScore.identity_currency,
                                    device_currency: latestScore.device_currency,
                                    app_currency: latestScore.app_currency,
                                    security_posture: latestScore.security_posture,
                                    governance_readiness: latestScore.governance_readiness,
                                    integration_readiness: latestScore.integration_readiness,
                                }}
                            />
                        ) : (
                            <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
                                No score data available
                            </div>
                        )}
                    </div>

                    {/* Score Trend */}
                    <ChartCard title="Score History" className="lg:col-span-8">
                        {scoreChartData.length > 1 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={scoreChartData}>
                                    <defs>
                                        <linearGradient id="compositeGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="securityGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                    <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }} />
                                    <Area type="monotone" dataKey="composite" name="Composite" stroke="#3b82f6" fill="url(#compositeGrad)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="security" name="Security" stroke="#10b981" fill="url(#securityGrad)" strokeWidth={1.5} />
                                    <Area type="monotone" dataKey="identity" name="Identity" stroke="#8b5cf6" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
                                Not enough data points for trend
                            </div>
                        )}
                    </ChartCard>

                    {/* GDAP Relationships */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-12">
                        <h3 className="mb-4 text-sm font-semibold text-slate-800">GDAP Relationships</h3>
                        {gdapRelationships.length === 0 ? (
                            <div className="flex h-[80px] items-center justify-center text-sm text-slate-400">
                                No GDAP relationships configured
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {gdapRelationships.map((gdap) => (
                                    <div key={gdap.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <StatusBadge variant={gdapVariant(gdap.status)} label={gdap.status} dot />
                                            {gdap.expires_at && (
                                                <span className="text-xs text-slate-400">
                                                    Expires {new Date(gdap.expires_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        {gdap.starts_at && (
                                            <p className="mt-2 text-xs text-slate-400">
                                                Started {new Date(gdap.starts_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="space-y-6">
                    {/* Findings */}
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Active Findings
                                {openFindings.length > 0 && (
                                    <span className="ml-2 text-xs font-normal text-slate-400">({openFindings.length})</span>
                                )}
                            </h3>
                        </div>
                        {openFindings.length === 0 ? (
                            <div className="px-6 py-12 text-center text-sm text-emerald-600">
                                No active findings — tenant is in good health
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {openFindings.map((finding, idx) => (
                                    <div
                                        key={`${finding.category}-${idx}`}
                                        className={`flex items-start gap-4 px-6 py-4 border-l-4 ${
                                            finding.severity === 'critical' ? 'border-l-red-500 bg-red-50/30' :
                                            finding.severity === 'high' ? 'border-l-orange-500 bg-orange-50/30' :
                                            finding.severity === 'medium' ? 'border-l-amber-500 bg-amber-50/30' :
                                            'border-l-blue-500 bg-blue-50/30'
                                        }`}
                                    >
                                        <StatusBadge variant={severityVariant(finding.severity)} label={finding.severity} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-800">
                                                {finding.category.replace(/_/g, ' ')}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-600">{finding.description}</p>
                                            {finding.recommended_remediation && (
                                                <p className="mt-1.5 text-xs text-slate-400">
                                                    Remediation: {finding.recommended_remediation}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'sync' && (
                <div className="space-y-4">
                    {/* Status filter */}
                    <div className="flex items-center gap-3">
                        <select
                            value={syncStatusFilter}
                            onChange={(e) => {
                                setSyncStatusFilter(e.target.value);
                                fetchSyncHistory(1, syncPagination.per_page, e.target.value);
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="partial">Partial</option>
                            <option value="running">Running</option>
                        </select>
                        {syncStatusFilter && (
                            <button
                                onClick={() => {
                                    setSyncStatusFilter('');
                                    fetchSyncHistory(1, syncPagination.per_page, '');
                                }}
                                className="text-xs text-slate-500 hover:text-slate-700"
                            >
                                Clear filter
                            </button>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        {syncLoading ? (
                            <div className="p-6"><SkeletonLoader variant="table" count={8} /></div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-b border-slate-200 bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Job</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Records</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Started</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Finished</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {syncRuns.map((run) => (
                                                <tr key={run.id} className="hover:bg-slate-50">
                                                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                                                        {run.sync_job.replace('SyncTenant', '').replace('Job', '')}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <StatusBadge
                                                            variant={run.status === 'completed' ? 'success' : run.status === 'failed' ? 'critical' : 'warning'}
                                                            label={run.status}
                                                            dot
                                                        />
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">{run.records_processed}</td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                        {new Date(run.started_at).toLocaleString()}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                        {run.finished_at ? new Date(run.finished_at).toLocaleString() : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {syncRuns.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                                                        No sync runs found for this tenant.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {syncPagination.total > 0 && (
                                    <PaginationControls
                                        currentPage={syncPagination.current_page}
                                        lastPage={syncPagination.last_page}
                                        perPage={syncPagination.per_page}
                                        total={syncPagination.total}
                                        onPageChange={(p) => fetchSyncHistory(p, syncPagination.per_page)}
                                        onPerPageChange={(pp) => fetchSyncHistory(1, pp)}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
