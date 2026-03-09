import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { UsersIcon, ShieldCheckIcon, ClockIcon, NoSymbolIcon } from '@heroicons/react/24/outline';

type User = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    display_name: string;
    user_principal_name: string;
    account_enabled: boolean;
    mfa_registered: boolean;
    last_sign_in_at: string | null;
    assigned_roles: string | null;
};

type PaginatedUsers = {
    items: User[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
};

export default function IdentityUsers() {
    const [data, setData] = useState<PaginatedUsers | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [mfaFilter, setMfaFilter] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ per_page: '25', page: String(page) });
        if (search) params.set('search', search);
        if (mfaFilter) params.set('mfa_status', mfaFilter);

        fetch(`/api/v1/identity/users?${params}`)
            .then((r) => r.json())
            .then((res) => {
                setData(res.success ? res.data : null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [search, mfaFilter, page]);

    const total = data?.pagination.total ?? 0;

    return (
        <AppLayout title="Users">
            <PageHeader
                title="Users"
                subtitle="All user accounts across managed tenants"
                breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Users' }]}
            />

            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <input
                    type="text"
                    placeholder="Search by name or UPN..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <select
                    value={mfaFilter}
                    onChange={(e) => { setMfaFilter(e.target.value); setPage(1); }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                    <option value="">All MFA Status</option>
                    <option value="registered">MFA Registered</option>
                    <option value="not_registered">No MFA</option>
                </select>
                <span className="text-xs text-slate-400">{total} users</span>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">UPN</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">MFA</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Sign-In</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-0"><SkeletonLoader variant="table-row" count={10} /></td></tr>
                            ) : data?.items.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{user.display_name}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{user.user_principal_name}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{user.customer_name ?? user.tenant_id.slice(0, 8)}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <StatusBadge
                                            variant={user.account_enabled ? 'enabled' : 'disabled'}
                                            label={user.account_enabled ? 'Enabled' : 'Disabled'}
                                            dot
                                        />
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <StatusBadge
                                            variant={user.mfa_registered ? 'success' : 'warning'}
                                            label={user.mfa_registered ? 'Registered' : 'Not Registered'}
                                        />
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-400 text-xs">
                                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data && data.pagination.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                        <span className="text-xs text-slate-400">
                            Page {data.pagination.current_page} of {data.pagination.last_page}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="rounded border border-slate-300 px-3 py-1 text-xs disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= data.pagination.last_page}
                                className="rounded border border-slate-300 px-3 py-1 text-xs disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
