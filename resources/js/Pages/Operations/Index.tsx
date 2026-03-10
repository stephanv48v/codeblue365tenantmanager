import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { useOperationsData } from './hooks/useOperationsData';
import {
    CogIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    BellAlertIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export default function OperationsIndex() {
    const { data, loading } = useOperationsData();

    if (loading || !data) {
        return (
            <AppLayout title="Operations">
                <PageHeader title="Operations" subtitle="Sync pipeline monitoring" breadcrumbs={[{ label: 'Operations' }]} actions={<ExportButton csvEndpoint="/api/v1/reports/sync-runs" />} />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const { syncRuns, summary, staleTenants, openAlerts, trends } = data;
    const successRate = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;
    const pieData = [
        { name: 'Completed', value: summary.completed ?? 0, fill: PIE_COLORS[0] },
        { name: 'Failed', value: summary.failed ?? 0, fill: PIE_COLORS[1] },
        { name: 'Pending', value: summary.pending ?? 0, fill: PIE_COLORS[2] },
    ].filter((d) => d.value > 0);

    const trendData = trends.map((t) => ({
        date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Success: t.success,
        Failed: t.failed,
        Partial: t.partial,
    }));

    return (
        <AppLayout title="Operations">
            <PageHeader
                title="Operations"
                subtitle="Sync pipeline monitoring and health"
                breadcrumbs={[{ label: 'Operations' }]}
                actions={<ExportButton csvEndpoint="/api/v1/reports/sync-runs" />}
            />

            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Total Sync Runs" value={summary.total} icon={CogIcon} accentColor="blue" />
                <StatCard label="Completed" value={summary.completed ?? 0} icon={CheckCircleIcon} accentColor="emerald" subtitle={`${successRate}% success rate`} />
                <StatCard label="Failed" value={summary.failed ?? 0} icon={ExclamationTriangleIcon} accentColor={summary.failed > 0 ? 'red' : 'emerald'} />
                <StatCard label="Open Alerts" value={openAlerts} icon={BellAlertIcon} href="/alerts" accentColor={openAlerts > 0 ? 'amber' : 'emerald'} />
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <ChartCard title="Sync Success Rate" className="lg:col-span-4">
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">No sync data</div>
                    )}
                </ChartCard>

                {/* Sync Trend Chart */}
                <ChartCard title="Sync Trends (30 Days)" className="lg:col-span-8">
                    {trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="Success" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                <Area type="monotone" dataKey="Failed" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                                <Area type="monotone" dataKey="Partial" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">No trend data available</div>
                    )}
                </ChartCard>
            </div>

            {/* Stale Tenants */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-sm font-semibold text-slate-800">Stale Tenants <span className="font-normal text-slate-400">(No sync in 7+ days)</span></h3>
                {staleTenants.length === 0 ? (
                    <div className="flex h-[80px] items-center justify-center text-sm text-emerald-600">All tenants are up to date</div>
                ) : (
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {staleTenants.map((t) => (
                            <div key={t.tenant_id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="h-4 w-4 text-amber-600" />
                                    <span className="text-sm font-medium text-slate-800">{t.customer_name}</span>
                                </div>
                                <span className="text-xs text-slate-400">
                                    {t.last_sync_at ? `Last: ${new Date(t.last_sync_at).toLocaleDateString()}` : 'Never synced'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Sync Runs Table */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h3 className="text-sm font-semibold text-slate-800">Recent Sync Runs</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Job</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Records</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Started</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {syncRuns.map((run) => (
                                <tr key={run.id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                                        {run.sync_job.replace('SyncTenant', '').replace('Job', '')}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{run.tenant_id.slice(0, 12)}...</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <StatusBadge
                                            variant={run.status === 'completed' ? 'success' : run.status === 'failed' ? 'critical' : 'warning'}
                                            label={run.status}
                                            dot
                                        />
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">{run.records_processed}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">{new Date(run.started_at).toLocaleString()}</td>
                                </tr>
                            ))}
                            {syncRuns.length === 0 && (
                                <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">No sync runs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tenant Sync Health */}
            {staleTenants.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h3 className="text-sm font-semibold text-slate-800">
                            Tenant Sync Health
                            <span className="ml-2 font-normal text-slate-400">({staleTenants.length} tenant{staleTenants.length !== 1 ? 's' : ''} requiring attention)</span>
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Sync</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {staleTenants.map((tenant) => {
                                    const lastSync = tenant.last_sync_at ? new Date(tenant.last_sync_at) : null;
                                    const now = new Date();
                                    const daysSinceSync = lastSync
                                        ? Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24))
                                        : Infinity;
                                    const statusColor =
                                        daysSinceSync >= 7 ? 'bg-red-500'
                                        : daysSinceSync >= 3 ? 'bg-amber-500'
                                        : 'bg-emerald-500';
                                    const statusLabel =
                                        !lastSync ? 'Never synced'
                                        : daysSinceSync >= 7 ? `${daysSinceSync}d stale`
                                        : daysSinceSync >= 3 ? `${daysSinceSync}d ago`
                                        : 'Recent';

                                    return (
                                        <tr key={tenant.tenant_id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                                                {tenant.customer_name}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                {lastSync ? lastSync.toLocaleString() : 'Never'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusColor}`} />
                                                    <span className="text-xs text-slate-600">{statusLabel}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
