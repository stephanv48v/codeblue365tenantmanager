import { useState, useMemo } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SectionHeader from '../../Components/SectionHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { usePowerPlatformData } from './hooks/usePowerPlatformData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { BoltIcon, CpuChipIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const statusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'started':
        case 'running':
        case 'active': return 'success' as const;
        case 'stopped':
        case 'suspended': return 'critical' as const;
        case 'draft': return 'neutral' as const;
        default: return 'info' as const;
    }
};

export default function PowerPlatformIndex() {
    const { isFiltered } = useTenantScope();
    const { data, loading, error } = usePowerPlatformData();
    const [search, setSearch] = useState('');

    const apps = data?.apps ?? [];
    const flows = data?.flows ?? [];
    const summary = data?.summary ?? { total_apps: 0, total_flows: 0, flows_with_failures: 0, premium_connector_usage: 0, external_connections: 0 };

    const filteredApps = useMemo(() => {
        if (!search) return apps;
        const q = search.toLowerCase();
        return apps.filter((a) => a.display_name.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q));
    }, [apps, search]);

    const filteredFlows = useMemo(() => {
        if (!search) return flows;
        const q = search.toLowerCase();
        return flows.filter((f) => f.display_name.toLowerCase().includes(q) || f.owner.toLowerCase().includes(q));
    }, [flows, search]);

    if (loading) {
        return (
            <AppLayout title="Power Platform">
                <PageHeader
                    title="Power Platform"
                    subtitle="Power Apps and Power Automate overview"
                    breadcrumbs={[{ label: 'Power Platform' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
                <SkeletonLoader variant="table" count={8} />
            </AppLayout>
        );
    }

    if (!data || error) {
        return (
            <AppLayout title="Power Platform">
                <PageHeader
                    title="Power Platform"
                    subtitle="Power Apps and Power Automate overview"
                    breadcrumbs={[{ label: 'Power Platform' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load Power Platform data. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Power Platform">
            <PageHeader
                title="Power Platform"
                subtitle={isFiltered ? 'Power Platform for selected tenant' : 'Power Apps and Power Automate across all tenants'}
                breadcrumbs={[{ label: 'Power Platform' }]}
                actions={<ExportButton csvEndpoint="/api/v1/power-platform/overview" />}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Total Apps" value={summary.total_apps} icon={BoltIcon} accentColor="purple" />
                <StatCard label="Total Flows" value={summary.total_flows} icon={CpuChipIcon} accentColor="blue" />
                <StatCard label="Flows with Failures" value={summary.flows_with_failures} accentColor="red" />
                <StatCard label="Premium Connectors" value={summary.premium_connector_usage} accentColor="amber" />
                <StatCard label="External Connections" value={summary.external_connections} accentColor={summary.external_connections > 0 ? 'amber' : 'slate'} />
            </div>

            {/* Search */}
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search apps and flows..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border-0 bg-transparent text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-0"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="text-xs text-blue-600 hover:text-blue-800">Clear</button>
                )}
            </div>

            {/* Power Apps Table */}
            <div className="mb-6">
                <SectionHeader title="Power Apps" subtitle={`${filteredApps.length} of ${apps.length} apps`} />
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Owner</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Environment</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Sessions (30d)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Shared Users</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                    {!isFiltered && (
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredApps.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{app.display_name}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{app.owner}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{app.environment}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 capitalize">{app.type}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{app.sessions_30d}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{app.shared_users}</td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <StatusBadge variant={statusVariant(app.status)} label={app.status} />
                                        </td>
                                        {!isFiltered && (
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                {app.customer_name ?? app.tenant_id.slice(0, 12) + '...'}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {filteredApps.length === 0 && (
                                    <tr>
                                        <td colSpan={isFiltered ? 7 : 8} className="py-12 text-center text-sm text-slate-400">
                                            No Power Apps found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Power Automate Flows Table */}
            <div className="mb-6">
                <SectionHeader title="Power Automate Flows" subtitle={`${filteredFlows.length} of ${flows.length} flows`} href="/power-platform/flows" linkText="View All Flows" />
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Owner</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Runs (30d)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Failures (30d)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Premium</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">External</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredFlows.slice(0, 10).map((flow) => (
                                    <tr key={flow.id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{flow.display_name}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{flow.owner}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 capitalize">{flow.type}</td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <StatusBadge variant={statusVariant(flow.status)} label={flow.status} />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{flow.runs_30d}</td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span className={flow.failures_30d > 0 ? 'font-medium text-red-600' : 'text-slate-400'}>
                                                {flow.failures_30d}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {flow.is_premium && (
                                                <StatusBadge variant="warning" label="Premium" />
                                            )}
                                            {!flow.is_premium && <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {flow.is_external && (
                                                <StatusBadge variant="high" label="External" />
                                            )}
                                            {!flow.is_external && <span className="text-slate-400">-</span>}
                                        </td>
                                    </tr>
                                ))}
                                {filteredFlows.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                                            No Power Automate flows found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
