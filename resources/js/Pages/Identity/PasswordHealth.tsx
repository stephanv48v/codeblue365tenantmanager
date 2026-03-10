import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { usePasswordHealthData } from './hooks/usePasswordHealthData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { KeyIcon } from '@heroicons/react/24/outline';

function isExpiringSoon(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const expiry = new Date(dateStr);
    const now = new Date();
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30 && diffDays > 0;
}

function isExpired(dateStr: string | null): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
}

export default function PasswordHealth() {
    const { isFiltered } = useTenantScope();
    const { data, loading, error, page, perPage, setPage, setPerPage, fetchData } = usePasswordHealthData();

    if (loading && !data) {
        return (
            <AppLayout title="Password Health">
                <PageHeader
                    title="Password Health"
                    subtitle="Password hygiene and break-glass account monitoring"
                    breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Password Health' }]}
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
            <AppLayout title="Password Health">
                <PageHeader
                    title="Password Health"
                    subtitle="Password hygiene and break-glass account monitoring"
                    breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Password Health' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load password health data. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    const { summary, users, pagination } = data;

    return (
        <AppLayout title="Password Health">
            <PageHeader
                title="Password Health"
                subtitle={isFiltered ? 'Password health for selected tenant' : 'Password hygiene across all tenants'}
                breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Password Health' }]}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Expiring (30d)" value={summary.expiring_within_30d} icon={KeyIcon} accentColor={summary.expiring_within_30d > 0 ? 'amber' : 'emerald'} />
                <StatCard label="Never-Expire" value={summary.never_expire_accounts} accentColor={summary.never_expire_accounts > 0 ? 'amber' : 'slate'} />
                <StatCard label="Legacy Auth Users" value={summary.legacy_auth_users} accentColor={summary.legacy_auth_users > 0 ? 'red' : 'emerald'} />
                <StatCard label="Break-Glass" value={summary.break_glass_accounts} accentColor="purple" />
            </div>

            {/* Users Table */}
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
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Password Last Set</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Expiry Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Never Expires</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Legacy Auth</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Break-Glass</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-slate-900">{user.display_name}</p>
                                                    <p className="text-xs text-slate-400">{user.user_principal_name}</p>
                                                </div>
                                            </td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                    {user.customer_name ?? user.tenant_id.slice(0, 12) + '...'}
                                                </td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                {user.password_last_set ? new Date(user.password_last_set).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                {user.expiry_date ? (
                                                    <span className={
                                                        isExpired(user.expiry_date) ? 'text-sm font-medium text-red-600' :
                                                        isExpiringSoon(user.expiry_date) ? 'text-sm font-medium text-amber-600' :
                                                        'text-sm text-slate-600'
                                                    }>
                                                        {new Date(user.expiry_date).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                {user.never_expires ? (
                                                    <StatusBadge variant="warning" label="Never Expires" />
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                {user.uses_legacy_auth ? (
                                                    <StatusBadge variant="critical" label="Legacy Auth" />
                                                ) : (
                                                    <StatusBadge variant="success" label="Modern" />
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                {user.is_break_glass ? (
                                                    <StatusBadge variant="info" label="Break-Glass" />
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 6 : 7} className="py-12 text-center text-sm text-slate-400">
                                                No users found.
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
