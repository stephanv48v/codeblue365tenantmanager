import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useDefenderAlertsData, type DefenderFilters } from './hooks/useDefenderAlertsData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

const severityVariant = (severity: string) => {
    switch (severity.toLowerCase()) {
        case 'high': return 'critical' as const;
        case 'medium': return 'warning' as const;
        case 'low': return 'info' as const;
        case 'informational': return 'neutral' as const;
        default: return 'neutral' as const;
    }
};

const statusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'new': return 'critical' as const;
        case 'inprogress':
        case 'in_progress': return 'info' as const;
        case 'resolved': return 'success' as const;
        case 'dismissed': return 'neutral' as const;
        default: return 'neutral' as const;
    }
};

const severityBorder: Record<string, string> = {
    high: 'border-l-red-500',
    medium: 'border-l-amber-500',
    low: 'border-l-blue-400',
    informational: 'border-l-slate-300',
};

export default function DefenderAlerts() {
    const { isFiltered } = useTenantScope();
    const {
        data, loading, error, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchData,
    } = useDefenderAlertsData();

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: DefenderFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setPage(1);
        fetchData(1, perPage, newFilters, search);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
        fetchData(1, perPage, filters, value);
    };

    const handleReset = () => {
        const empty: DefenderFilters = { severity: '', status: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        fetchData(1, perPage, empty, '');
    };

    if (loading && !data) {
        return (
            <AppLayout title="Defender Alerts">
                <PageHeader
                    title="Defender Alerts"
                    subtitle="Microsoft Defender security alerts"
                    breadcrumbs={[{ label: 'Security & Compliance', href: '/security' }, { label: 'Defender Alerts' }]}
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
            <AppLayout title="Defender Alerts">
                <PageHeader
                    title="Defender Alerts"
                    subtitle="Microsoft Defender security alerts"
                    breadcrumbs={[{ label: 'Security & Compliance', href: '/security' }, { label: 'Defender Alerts' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load Defender alerts. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    const { summary, alerts, pagination } = data;

    return (
        <AppLayout title="Defender Alerts">
            <PageHeader
                title="Defender Alerts"
                subtitle={isFiltered ? 'Alerts for selected tenant' : 'Microsoft Defender alerts across all tenants'}
                breadcrumbs={[{ label: 'Security & Compliance', href: '/security' }, { label: 'Defender Alerts' }]}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Total Alerts" value={summary.total_alerts} icon={ShieldExclamationIcon} accentColor="blue" />
                <StatCard label="High Severity" value={summary.high_severity} accentColor={summary.high_severity > 0 ? 'red' : 'emerald'} />
                <StatCard label="In Progress" value={summary.in_progress} accentColor="amber" />
                <StatCard label="Resolved" value={summary.resolved} accentColor="emerald" />
            </div>

            {/* Filter Bar */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'severity',
                            label: 'All Severities',
                            options: [
                                { value: 'high', label: 'High' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'low', label: 'Low' },
                                { value: 'informational', label: 'Informational' },
                            ],
                        },
                        {
                            key: 'status',
                            label: 'All Statuses',
                            options: [
                                { value: 'new', label: 'New' },
                                { value: 'inProgress', label: 'In Progress' },
                                { value: 'resolved', label: 'Resolved' },
                                { value: 'dismissed', label: 'Dismissed' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{ value: search, onChange: handleSearchChange, placeholder: 'Search alerts...' }}
                    onReset={handleReset}
                />
            </div>

            {/* Alerts Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {loading ? (
                    <div className="p-6"><SkeletonLoader variant="table" count={10} /></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Title</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Severity</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Service Source</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Assigned To</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">First Activity</th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {alerts.map((alert) => (
                                        <tr
                                            key={alert.id}
                                            className={`border-b border-l-4 ${severityBorder[alert.severity.toLowerCase()] ?? 'border-l-slate-300'} last:border-b-0 hover:bg-slate-50/50`}
                                        >
                                            <td className="max-w-xs truncate px-4 py-3 font-medium text-slate-900">{alert.title}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={severityVariant(alert.severity)} label={alert.severity} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-600 capitalize">{alert.category}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={statusVariant(alert.status)} label={alert.status} dot />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">{alert.service_source}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{alert.assigned_to ?? '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                {new Date(alert.first_activity_date).toLocaleDateString()}
                                            </td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                    {alert.customer_name ?? alert.tenant_id.slice(0, 12) + '...'}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {alerts.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 7 : 8} className="py-12 text-center text-sm text-slate-400">
                                                No Defender alerts match your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {pagination && pagination.total > 0 && (
                            <PaginationControls
                                currentPage={pagination.current_page}
                                lastPage={pagination.last_page}
                                perPage={pagination.per_page}
                                total={pagination.total}
                                onPageChange={(pg) => { setPage(pg); fetchData(pg, perPage, filters, search); }}
                                onPerPageChange={(pp) => { setPerPage(pp); setPage(1); fetchData(1, pp, filters, search); }}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
