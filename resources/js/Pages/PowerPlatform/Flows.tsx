import { useState, useMemo } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import FilterBar from '../../Components/FilterBar';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { usePowerPlatformData, type PowerFlow } from './hooks/usePowerPlatformData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { CpuChipIcon } from '@heroicons/react/24/outline';

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

export default function PowerPlatformFlows() {
    const { isFiltered } = useTenantScope();
    const { data, loading, error } = usePowerPlatformData();
    const [filters, setFilters] = useState<Record<string, string>>({ status: '', flow_type: '' });
    const [search, setSearch] = useState('');

    const filteredFlows = useMemo(() => {
        if (!data?.flows) return [];
        return data.flows.filter((flow: PowerFlow) => {
            if (filters.status && flow.status.toLowerCase() !== filters.status.toLowerCase()) return false;
            if (filters.flow_type && flow.type.toLowerCase() !== filters.flow_type.toLowerCase()) return false;
            if (search && !flow.display_name.toLowerCase().includes(search.toLowerCase())
                && !flow.owner.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [data, filters, search]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setFilters({ status: '', flow_type: '' });
        setSearch('');
    };

    if (loading) {
        return (
            <AppLayout title="Power Automate Flows">
                <PageHeader
                    title="Power Automate Flows"
                    subtitle="Detailed flow management"
                    breadcrumbs={[{ label: 'Power Platform', href: '/power-platform' }, { label: 'Flows' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
                <SkeletonLoader variant="table" count={10} />
            </AppLayout>
        );
    }

    if (!data || error) {
        return (
            <AppLayout title="Power Automate Flows">
                <PageHeader
                    title="Power Automate Flows"
                    subtitle="Detailed flow management"
                    breadcrumbs={[{ label: 'Power Platform', href: '/power-platform' }, { label: 'Flows' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load flows data. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    const { summary, flows } = data;
    const activeFlows = flows.filter((f) => f.status.toLowerCase() === 'started' || f.status.toLowerCase() === 'running' || f.status.toLowerCase() === 'active').length;

    return (
        <AppLayout title="Power Automate Flows">
            <PageHeader
                title="Power Automate Flows"
                subtitle={isFiltered ? 'Flows for selected tenant' : 'All Power Automate flows across tenants'}
                breadcrumbs={[{ label: 'Power Platform', href: '/power-platform' }, { label: 'Flows' }]}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Total Flows" value={summary.total_flows} icon={CpuChipIcon} accentColor="blue" />
                <StatCard label="Active Flows" value={activeFlows} accentColor="emerald" />
                <StatCard label="With Failures" value={summary.flows_with_failures} accentColor="red" />
                <StatCard label="Premium Connectors" value={summary.premium_connector_usage} accentColor="amber" />
            </div>

            {/* Filter Bar */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'status',
                            label: 'All Statuses',
                            options: [
                                { value: 'started', label: 'Started' },
                                { value: 'stopped', label: 'Stopped' },
                                { value: 'suspended', label: 'Suspended' },
                                { value: 'draft', label: 'Draft' },
                            ],
                        },
                        {
                            key: 'flow_type',
                            label: 'All Types',
                            options: [
                                { value: 'automated', label: 'Automated' },
                                { value: 'instant', label: 'Instant' },
                                { value: 'scheduled', label: 'Scheduled' },
                                { value: 'button', label: 'Button' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{ value: search, onChange: setSearch, placeholder: 'Search flows...' }}
                    onReset={handleReset}
                />
            </div>

            {/* Flows Table */}
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
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Failure Rate</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Premium</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">External</th>
                                {!isFiltered && (
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredFlows.map((flow) => {
                                const failureRate = flow.runs_30d > 0
                                    ? ((flow.failures_30d / flow.runs_30d) * 100).toFixed(1)
                                    : '0.0';
                                const failureRateNum = parseFloat(failureRate);

                                return (
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
                                            <span className={
                                                failureRateNum > 20 ? 'font-medium text-red-600' :
                                                failureRateNum > 5 ? 'font-medium text-amber-600' :
                                                'text-slate-500'
                                            }>
                                                {failureRate}%
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {flow.is_premium ? <StatusBadge variant="warning" label="Premium" /> : <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {flow.is_external ? <StatusBadge variant="high" label="External" /> : <span className="text-slate-400">-</span>}
                                        </td>
                                        {!isFiltered && (
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                {flow.customer_name ?? flow.tenant_id.slice(0, 12) + '...'}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            {filteredFlows.length === 0 && (
                                <tr>
                                    <td colSpan={isFiltered ? 9 : 10} className="py-12 text-center text-sm text-slate-400">
                                        No flows match your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
