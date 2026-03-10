import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { usePimData } from './hooks/usePimData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const activationTypeVariant = (type: string) => {
    switch (type.toLowerCase()) {
        case 'eligible': return 'info' as const;
        case 'active': return 'success' as const;
        case 'permanent': return 'warning' as const;
        default: return 'neutral' as const;
    }
};

const statusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'activated':
        case 'active': return 'success' as const;
        case 'expired': return 'expired' as const;
        case 'pending': return 'pending' as const;
        case 'revoked': return 'critical' as const;
        default: return 'neutral' as const;
    }
};

export default function PimActivations() {
    const { isFiltered } = useTenantScope();
    const { data, loading, error, page, perPage, setPage, setPerPage, fetchData } = usePimData();

    if (loading && !data) {
        return (
            <AppLayout title="PIM Activations">
                <PageHeader
                    title="PIM Activations"
                    subtitle="Privileged Identity Management role activations"
                    breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'PIM Activations' }]}
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
            <AppLayout title="PIM Activations">
                <PageHeader
                    title="PIM Activations"
                    subtitle="Privileged Identity Management role activations"
                    breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'PIM Activations' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load PIM data. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    const { summary, activations, pagination } = data;
    const topRoles = summary.roles.slice(0, 3);

    return (
        <AppLayout title="PIM Activations">
            <PageHeader
                title="PIM Activations"
                subtitle={isFiltered ? 'PIM activations for selected tenant' : 'Privileged Identity Management across all tenants'}
                breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'PIM Activations' }]}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Eligible Assignments" value={summary.total_eligible} icon={ShieldCheckIcon} accentColor="blue" />
                <StatCard label="Active Assignments" value={summary.total_active} accentColor="emerald" />
                {topRoles.map((role) => (
                    <StatCard key={role.role_name} label={role.role_name} value={role.count} accentColor="purple" />
                ))}
            </div>

            {/* Role Breakdown */}
            {summary.roles.length > 0 && (
                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">Role Breakdown</h3>
                    <div className="flex flex-wrap gap-3">
                        {summary.roles.map((role) => (
                            <div key={role.role_name} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <span className="text-sm font-medium text-slate-700">{role.role_name}</span>
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{role.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Activations Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {loading ? (
                    <div className="p-6"><SkeletonLoader variant="table" count={10} /></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">User</th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Role</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Start Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">End Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Justification</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activations.map((activation) => (
                                        <tr key={activation.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-slate-900">{activation.display_name}</p>
                                                    <p className="text-xs text-slate-400">{activation.user_principal_name}</p>
                                                </div>
                                            </td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                    {activation.customer_name ?? activation.tenant_id.slice(0, 12) + '...'}
                                                </td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">{activation.role_name}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={activationTypeVariant(activation.activation_type)} label={activation.activation_type} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={statusVariant(activation.status)} label={activation.status} dot />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                {new Date(activation.start_date).toLocaleDateString()}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                {activation.end_date ? new Date(activation.end_date).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="max-w-[200px] truncate px-4 py-3 text-xs text-slate-400">
                                                {activation.justification ?? '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {activations.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 7 : 8} className="py-12 text-center text-sm text-slate-400">
                                                No PIM activations found.
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
