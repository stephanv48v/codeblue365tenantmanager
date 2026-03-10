import { useState, useCallback } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import SectionHeader from '../../Components/SectionHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import StatusBadge from '../../Components/StatusBadge';
import { useAdminAccountsData } from './hooks/useAdminAccountsData';
import type { AdminFilters } from './hooks/useAdminAccountsData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    UserGroupIcon,
    ShieldExclamationIcon,
    KeyIcon,
    ClockIcon,
    ArrowDownTrayIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

// ── Quick Action Card ────────────────────────────────────────────────────────

function QuickActionCard({
    label, count, icon: Icon, color, active, onClick,
}: {
    label: string;
    count: number;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
    active: boolean;
    onClick: () => void;
}) {
    const colorMap: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-400', activeBg: 'bg-amber-50' },
        red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-400', activeBg: 'bg-red-50' },
        cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-400', activeBg: 'bg-cyan-50' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-400', activeBg: 'bg-blue-50' },
        slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-400', activeBg: 'bg-slate-100' },
    };
    const c = colorMap[color] ?? colorMap.slate;

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                active ? `${c.border} ${c.activeBg}` : 'border-slate-200 bg-white'
            }`}
        >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className={`text-lg font-bold ${c.text}`}>{count}</p>
            </div>
            {active && (
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
                    Active
                </span>
            )}
        </button>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function AdminAccounts() {
    const { isFiltered, buildUrl } = useTenantScope();
    const {
        data: d,
        loading,
        filters,
        search,
        page,
        perPage,
        setFilters,
        setSearch,
        setPage,
        setPerPage,
        fetchAdmins,
    } = useAdminAccountsData();

    // Quick-action active state
    const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);

    // ── Filter handlers ─────────────────────────────────────────────────────

    const handleFilterChange = useCallback(
        (key: string, value: string) => {
            const newFilters: AdminFilters = { ...filters, [key]: value };
            setFilters(newFilters);
            setPage(1);
            setActiveQuickAction(null);
            fetchAdmins(1, perPage, newFilters, search);
        },
        [filters, perPage, search, setFilters, setPage, fetchAdmins],
    );

    const handleSearchChange = useCallback(
        (value: string) => {
            setSearch(value);
            setPage(1);
            fetchAdmins(1, perPage, filters, value);
        },
        [perPage, filters, setSearch, setPage, fetchAdmins],
    );

    const handleReset = useCallback(() => {
        const empty: AdminFilters = { role: '', status: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        setActiveQuickAction(null);
        fetchAdmins(1, perPage, empty, '');
    }, [perPage, setFilters, setSearch, setPage, fetchAdmins]);

    const handleQuickAction = useCallback(
        (action: string) => {
            if (activeQuickAction === action) {
                handleReset();
                return;
            }
            setActiveQuickAction(action);
            let newFilters: AdminFilters = { role: '', status: '' };
            if (action === 'global_admins') newFilters = { ...newFilters, role: 'Global Administrator' };
            else if (action === 'pim_eligible') newFilters = { ...newFilters, status: 'eligible' };
            else if (action === 'all_active') newFilters = { ...newFilters, status: 'active' };
            setFilters(newFilters);
            setSearch('');
            setPage(1);
            fetchAdmins(1, perPage, newFilters, '');
        },
        [activeQuickAction, perPage, setFilters, setSearch, setPage, fetchAdmins, handleReset],
    );

    // ── Chart data ──────────────────────────────────────────────────────────

    const roleChartData = d
        ? d.by_role.map((r) => ({
              name: r.role_display_name.length > 25
                  ? r.role_display_name.slice(0, 25) + '...'
                  : r.role_display_name,
              count: r.count,
          }))
        : [];

    // ── Loading state ───────────────────────────────────────────────────────

    if (loading && !d) {
        return (
            <AppLayout title="Admin Accounts">
                <PageHeader
                    title="Admin Accounts"
                    subtitle="Privileged role assignments across tenants"
                    breadcrumbs={[
                        { label: 'Identity', href: '/identity' },
                        { label: 'Admin Accounts' },
                    ]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
            </AppLayout>
        );
    }

    if (!d) {
        return (
            <AppLayout title="Admin Accounts">
                <PageHeader
                    title="Admin Accounts"
                    subtitle="Privileged role assignments across tenants"
                    breadcrumbs={[
                        { label: 'Identity', href: '/identity' },
                        { label: 'Admin Accounts' },
                    ]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    Unable to load admin accounts data.
                </div>
            </AppLayout>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────

    const activeCount = d.total_admins - d.pim_eligible;

    return (
        <AppLayout title="Admin Accounts">
            <PageHeader
                title="Admin Accounts"
                subtitle="Privileged role assignments across tenants"
                breadcrumbs={[
                    { label: 'Identity', href: '/identity' },
                    { label: 'Admin Accounts' },
                ]}
                actions={
                    <button
                        onClick={() => window.open(buildUrl('/api/v1/reports/admin-accounts'), '_blank')}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Export Report
                    </button>
                }
            />

            {/* ── Stat Cards ────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard
                    label="Total Admins"
                    value={d.total_admins}
                    icon={UserGroupIcon}
                    accentColor="blue"
                />
                <StatCard
                    label="Global Admins"
                    value={d.global_admins}
                    icon={ShieldExclamationIcon}
                    accentColor={d.global_admins > 5 ? 'red' : 'amber'}
                />
                <StatCard
                    label="Roles in Use"
                    value={d.roles_in_use}
                    accentColor="purple"
                    icon={KeyIcon}
                />
                <StatCard
                    label="PIM Eligible"
                    value={d.pim_eligible}
                    icon={ClockIcon}
                    accentColor="cyan"
                />
            </div>

            {/* ── Charts ────────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <ChartCard
                    title="Role Distribution"
                    subtitle="Admin assignments by role"
                    className="lg:col-span-7"
                >
                    {roleChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={roleChartData} layout="vertical">
                                <XAxis type="number" />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={180}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip />
                                <Bar dataKey="count" name="Assignments" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                            No role data available
                        </div>
                    )}
                </ChartCard>

                <div className="lg:col-span-5">
                    {d.tenants_with_excessive_admins.length > 0 ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                            <div className="mb-4 flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                                <h3 className="text-sm font-semibold text-amber-800">Excessive Global Admins</h3>
                            </div>
                            <p className="mb-4 text-xs text-amber-700">
                                The following tenants have more than 5 Global Administrator assignments.
                                Microsoft recommends limiting Global Admins to reduce attack surface.
                            </p>
                            <div className="space-y-2">
                                {d.tenants_with_excessive_admins.map((t) => (
                                    <div
                                        key={t.tenant_id}
                                        className="flex items-center justify-between rounded-lg bg-white/70 px-4 py-2.5"
                                    >
                                        <span className="text-sm font-medium text-slate-800">
                                            {t.customer_name}
                                        </span>
                                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                                            {t.global_admin_count} admins
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                            <div className="flex flex-col items-center justify-center text-center w-full">
                                <CheckCircleIcon className="mb-3 h-10 w-10 text-emerald-500" />
                                <h3 className="text-sm font-semibold text-emerald-800">
                                    Admin Counts Look Good
                                </h3>
                                <p className="mt-1 text-xs text-emerald-600">
                                    All tenants have appropriate Global Administrator counts.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Quick Action Cards ──────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <QuickActionCard
                    label="Global Admins"
                    count={d.global_admins}
                    icon={ShieldExclamationIcon}
                    color="red"
                    active={activeQuickAction === 'global_admins'}
                    onClick={() => handleQuickAction('global_admins')}
                />
                <QuickActionCard
                    label="PIM Eligible"
                    count={d.pim_eligible}
                    icon={ClockIcon}
                    color="cyan"
                    active={activeQuickAction === 'pim_eligible'}
                    onClick={() => handleQuickAction('pim_eligible')}
                />
                <QuickActionCard
                    label="All Active"
                    count={activeCount}
                    icon={UserGroupIcon}
                    color="blue"
                    active={activeQuickAction === 'all_active'}
                    onClick={() => handleQuickAction('all_active')}
                />
            </div>

            {/* ── Admin Directory ─────────────────────────────────────────── */}
            <div className="mb-4">
                <SectionHeader title="Admin Directory" subtitle="Browse and filter privileged role assignments" />
            </div>

            {/* Filters */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'role',
                            label: 'All Roles',
                            options: d.by_role.map((r) => ({
                                value: r.role_display_name,
                                label: r.role_display_name,
                            })),
                        },
                        {
                            key: 'status',
                            label: 'All Status',
                            options: [
                                { value: 'active', label: 'Active' },
                                { value: 'eligible', label: 'Eligible' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{
                        value: search,
                        onChange: handleSearchChange,
                        placeholder: 'Search by name or UPN...',
                    }}
                    onReset={handleReset}
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {loading ? (
                    <div className="p-6">
                        <SkeletonLoader variant="table" count={10} />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            UPN
                                        </th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                                Tenant
                                            </th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Role
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d.items.map((admin) => {
                                        const typeBadgeVariant =
                                            admin.assignment_type === 'direct'
                                                ? 'info'
                                                : admin.assignment_type === 'pim'
                                                  ? 'low'
                                                  : 'neutral';
                                        const typeBadgeLabel =
                                            admin.assignment_type === 'pim'
                                                ? 'PIM'
                                                : admin.assignment_type.charAt(0).toUpperCase() +
                                                  admin.assignment_type.slice(1);

                                        const statusBadgeVariant =
                                            admin.status === 'active' ? 'enabled' : 'warning';
                                        const statusBadgeLabel =
                                            admin.status.charAt(0).toUpperCase() + admin.status.slice(1);

                                        return (
                                            <tr key={`${admin.id}-${admin.role_id}`} className="hover:bg-slate-50">
                                                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                                                    {admin.display_name ?? '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">
                                                    {admin.user_principal_name ?? '-'}
                                                </td>
                                                {!isFiltered && (
                                                    <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">
                                                        {admin.customer_name ?? admin.tenant_id.slice(0, 8)}
                                                    </td>
                                                )}
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-600 text-xs">
                                                    {admin.role_display_name}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <StatusBadge variant={typeBadgeVariant} label={typeBadgeLabel} />
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <StatusBadge
                                                        variant={statusBadgeVariant}
                                                        label={statusBadgeLabel}
                                                        dot
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {d.items.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={isFiltered ? 5 : 6}
                                                className="py-12 text-center text-sm text-slate-400"
                                            >
                                                No admin accounts match your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {d.pagination.total > 0 && (
                            <PaginationControls
                                currentPage={d.pagination.current_page}
                                lastPage={d.pagination.last_page}
                                perPage={d.pagination.per_page}
                                total={d.pagination.total}
                                onPageChange={(pg) => {
                                    setPage(pg);
                                    fetchAdmins(pg, perPage, filters, search);
                                }}
                                onPerPageChange={(pp) => {
                                    setPerPage(pp);
                                    setPage(1);
                                    fetchAdmins(1, pp, filters, search);
                                }}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
