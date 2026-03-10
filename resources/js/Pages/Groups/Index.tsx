import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import ChartCard from '../../Components/ChartCard';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { useGroupsData, type GroupsFilters } from './hooks/useGroupsData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    UserGroupIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    CogIcon,
    BoltIcon,
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ── Helpers ─────────────────────────────────────────────────────────────────

const GROUP_TYPE_COLORS: Record<string, string> = {
    'm365': '#3b82f6',
    'security': '#10b981',
    'distribution': '#f59e0b',
    'mail_enabled_security': '#8b5cf6',
    'dynamic': '#06b6d4',
};

const groupTypeVariant = (type: string) => {
    switch (type) {
        case 'm365': return 'info' as const;
        case 'security': return 'success' as const;
        case 'distribution': return 'warning' as const;
        case 'mail_enabled_security': return 'low' as const;
        case 'dynamic': return 'info' as const;
        default: return 'neutral' as const;
    }
};

// ── Main Component ──────────────────────────────────────────────────────────

export default function GroupsIndex() {
    const { isFiltered } = useTenantScope();
    const {
        data, loading, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchData,
    } = useGroupsData();

    // ── Filter handlers ─────────────────────────────────────────────────────

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: GroupsFilters = { ...filters, [key]: value };
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
        const empty: GroupsFilters = { group_type: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        fetchData(1, perPage, empty, '');
    };

    // ── Loading state ───────────────────────────────────────────────────────

    if (loading && !data) {
        return (
            <AppLayout title="Groups">
                <PageHeader
                    title="Groups"
                    subtitle="Microsoft 365 group inventory and management"
                    breadcrumbs={[{ label: 'Groups', href: '/groups' }, { label: 'Overview' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
                <SkeletonLoader variant="chart" count={1} />
            </AppLayout>
        );
    }

    const d = data!;

    // ── Chart data ──────────────────────────────────────────────────────────

    const typeDistribution = (d.type_distribution ?? []).map((item) => ({
        name: item.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: item.count,
        fill: GROUP_TYPE_COLORS[item.type] ?? '#94a3b8',
    }));

    return (
        <AppLayout title="Groups">
            <PageHeader
                title="Groups"
                subtitle="Microsoft 365 group inventory and management"
                breadcrumbs={[{ label: 'Groups', href: '/groups' }, { label: 'Overview' }]}
                actions={<ExportButton csvEndpoint="/api/v1/groups/overview" />}
            />

            {/* ── Stat Cards ────────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Total Groups" value={d.total_groups} icon={UserGroupIcon} accentColor="blue" />
                <StatCard label="M365 Groups" value={d.m365_groups} accentColor="blue" />
                <StatCard label="Security Groups" value={d.security_groups} icon={ShieldCheckIcon} accentColor="emerald" />
                <StatCard
                    label="Ownerless Groups"
                    value={d.ownerless_groups}
                    icon={ExclamationTriangleIcon}
                    accentColor={d.ownerless_groups > 0 ? 'amber' : 'emerald'}
                    subtitle="No assigned owners"
                />
                <StatCard label="Dynamic Groups" value={d.dynamic_groups} icon={BoltIcon} accentColor="cyan" />
            </div>

            {/* ── Chart ─────────────────────────────────────────────────────── */}
            {typeDistribution.length > 0 && (
                <div className="mb-6 grid gap-6 lg:grid-cols-12">
                    <ChartCard title="Group Type Distribution" subtitle="Breakdown by group type" className="lg:col-span-5">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={typeDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={95}
                                    label
                                >
                                    {typeDistribution.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Ownerless groups warning */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        {d.ownerless_groups > 0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                        <ExclamationTriangleIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800">
                                            {d.ownerless_groups} group{d.ownerless_groups !== 1 ? 's' : ''} without owners
                                        </p>
                                        <p className="text-xs text-amber-600">
                                            Ownerless groups may lack proper governance. Assign owners to ensure accountability.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard label="Distribution Groups" value={d.distribution_groups} accentColor="amber" />
                            <StatCard label="Mail-Enabled Security" value={d.mail_enabled_security} icon={CogIcon} accentColor="purple" />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Filter Bar ────────────────────────────────────────────────── */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'group_type',
                            label: 'All Group Types',
                            options: [
                                { value: 'm365', label: 'Microsoft 365' },
                                { value: 'security', label: 'Security' },
                                { value: 'distribution', label: 'Distribution' },
                                { value: 'mail_enabled_security', label: 'Mail-Enabled Security' },
                                { value: 'dynamic', label: 'Dynamic' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{
                        value: search,
                        onChange: handleSearchChange,
                        placeholder: 'Search by group name...',
                    }}
                    onReset={handleReset}
                />
            </div>

            {/* ── Table ─────────────────────────────────────────────────────── */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {loading ? (
                    <div className="p-6"><SkeletonLoader variant="table" count={10} /></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Display Name</th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Group Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Membership</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Members</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Owners</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Visibility</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d.items.map((group) => (
                                        <tr key={group.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{group.display_name}</td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{group.customer_name ?? group.tenant_id.slice(0, 8)}</td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge
                                                    variant={groupTypeVariant(group.group_type)}
                                                    label={group.group_type.replace(/_/g, ' ')}
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{group.membership_type}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{group.member_count}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span className={group.owner_count === 0 ? 'font-medium text-amber-600' : 'text-slate-500'}>
                                                    {group.owner_count}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge
                                                    variant={group.visibility === 'Private' ? 'neutral' : 'info'}
                                                    label={group.visibility}
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                {group.last_activity ? new Date(group.last_activity).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {d.items.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 7 : 8} className="py-12 text-center text-sm text-slate-400">
                                                No groups match your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {d.pagination && d.pagination.total > 0 && (
                            <PaginationControls
                                currentPage={d.pagination.current_page}
                                lastPage={d.pagination.last_page}
                                perPage={d.pagination.per_page}
                                total={d.pagination.total}
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
