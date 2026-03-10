import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useRemediationData } from './hooks/useRemediationData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

const statusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'pending': return 'pending' as const;
        case 'in_progress':
        case 'in-progress': return 'info' as const;
        case 'completed': return 'success' as const;
        case 'failed': return 'critical' as const;
        default: return 'neutral' as const;
    }
};

const actionTypeVariant = (type: string) => {
    switch (type.toLowerCase()) {
        case 'auto': return 'info' as const;
        case 'manual': return 'warning' as const;
        case 'policy': return 'active' as const;
        case 'script': return 'low' as const;
        default: return 'neutral' as const;
    }
};

export default function RemediationIndex() {
    const { isFiltered } = useTenantScope();
    const { data, loading, error, page, perPage, setPage, setPerPage, fetchData } = useRemediationData();

    if (loading && !data) {
        return (
            <AppLayout title="Remediation">
                <PageHeader
                    title="Remediation"
                    subtitle="Remediation actions and automation"
                    breadcrumbs={[{ label: 'Operations', href: '/operations' }, { label: 'Remediation' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
                <SkeletonLoader variant="table" count={10} />
            </AppLayout>
        );
    }

    if (!data || error) {
        return (
            <AppLayout title="Remediation">
                <PageHeader
                    title="Remediation"
                    subtitle="Remediation actions and automation"
                    breadcrumbs={[{ label: 'Operations', href: '/operations' }, { label: 'Remediation' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load remediation data. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    const { summary, actions, pagination } = data;

    return (
        <AppLayout title="Remediation">
            <PageHeader
                title="Remediation"
                subtitle={isFiltered ? 'Remediation actions for selected tenant' : 'Remediation actions across all tenants'}
                breadcrumbs={[{ label: 'Operations', href: '/operations' }, { label: 'Remediation' }]}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-5">
                <StatCard label="Total Actions" value={summary.total_actions} icon={WrenchScrewdriverIcon} accentColor="blue" />
                <StatCard label="Pending" value={summary.pending} accentColor={summary.pending > 0 ? 'amber' : 'slate'} />
                <StatCard label="In Progress" value={summary.in_progress} accentColor={summary.in_progress > 0 ? 'blue' : 'slate'} />
                <StatCard label="Completed" value={summary.completed} accentColor="emerald" />
                <StatCard label="Failed" value={summary.failed} accentColor={summary.failed > 0 ? 'red' : 'slate'} />
            </div>

            {/* Actions Table */}
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
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Action Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Finding</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Initiated By</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Completed At</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {actions.map((action) => (
                                        <tr key={action.id} className="hover:bg-slate-50">
                                            <td className="max-w-xs truncate px-4 py-3 font-medium text-slate-900">{action.title}</td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                    {action.customer_name ?? action.tenant_id.slice(0, 12) + '...'}
                                                </td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={actionTypeVariant(action.action_type)} label={action.action_type} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={statusVariant(action.status)} label={action.status} dot />
                                            </td>
                                            <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-500">{action.finding_title ?? '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{action.initiated_by ?? '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                {action.completed_at ? new Date(action.completed_at).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {actions.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 6 : 7} className="py-12 text-center text-sm text-slate-400">
                                                No remediation actions found.
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
                                onPageChange={(pg) => { setPage(pg); fetchData(pg, perPage); }}
                                onPerPageChange={(pp) => { setPerPage(pp); setPage(1); fetchData(1, pp); }}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
