import { useMemo } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import ChartCard from '../../Components/ChartCard';
import SkeletonLoader from '../../Components/SkeletonLoader';
import PaginationControls from '../../Components/PaginationControls';
import FilterBar from '../../Components/FilterBar';
import { useCopilotUsage } from './hooks/useCopilotUsage';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    UsersIcon,
    ChartBarIcon,
    SparklesIcon,
    ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────────────────

const APP_LABELS: Record<string, string> = {
    teams: 'Teams',
    word: 'Word',
    excel: 'Excel',
    powerpoint: 'PowerPoint',
    outlook: 'Outlook',
    onenote: 'OneNote',
    copilot_chat: 'Copilot Chat',
};

const APP_COLORS: Record<string, string> = {
    teams: '#6366f1',
    word: '#2563eb',
    excel: '#16a34a',
    powerpoint: '#dc2626',
    outlook: '#0ea5e9',
    onenote: '#7c3aed',
    copilot_chat: '#8b5cf6',
};

const LICENSE_COLORS = {
    active: '#10b981',
    inactive: '#f59e0b',
    unlicensed: '#94a3b8',
};

function isRecentActivity(dateStr: string | null, days = 30): boolean {
    if (!dateStr) return false;
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff <= days * 86_400_000;
}

function ActivityDot({ date }: { date: string | null }) {
    const recent = isRecentActivity(date);
    return (
        <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${recent ? 'bg-emerald-500' : 'bg-slate-300'}`}
            title={date ? new Date(date).toLocaleDateString() : 'No activity'}
        />
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CopilotUsage() {
    const { isFiltered, buildUrl } = useTenantScope();
    const {
        data,
        loading,
        filters,
        search,
        page,
        perPage,
        setFilters,
        setSearch,
        setPage,
        setPerPage,
        fetchUsage,
    } = useCopilotUsage();

    // ── Filter handlers ──────────────────────────────────────────────────────

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setPage(1);
        fetchUsage(1, perPage, newFilters, search);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
        fetchUsage(1, perPage, filters, value);
    };

    const handleReset = () => {
        const empty = { licensed: '', active: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        fetchUsage(1, perPage, empty, '');
    };

    // ── Derived data ─────────────────────────────────────────────────────────

    const mostUsedApp = useMemo(() => {
        if (!data?.usage_by_app) return 'N/A';
        const entries = Object.entries(data.usage_by_app) as Array<[string, number]>;
        if (entries.length === 0) return 'N/A';
        const max = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
        return APP_LABELS[max[0]] ?? max[0];
    }, [data]);

    const appChartData = useMemo(() => {
        if (!data?.usage_by_app) return [];
        return Object.entries(data.usage_by_app).map(([key, value]) => ({
            name: APP_LABELS[key] ?? key,
            users: value,
            fill: APP_COLORS[key] ?? '#6366f1',
        }));
    }, [data]);

    const licenseChartData = useMemo(() => {
        if (!data) return [];
        const active = data.total_active;
        const licensedInactive = data.total_licensed - data.total_active;
        const totalUsers = data.pagination.total;
        const unlicensed = Math.max(0, totalUsers - data.total_licensed);
        return [
            { name: 'Licensed Active', value: active, fill: LICENSE_COLORS.active },
            { name: 'Licensed Inactive', value: Math.max(0, licensedInactive), fill: LICENSE_COLORS.inactive },
            { name: 'Not Licensed', value: unlicensed, fill: LICENSE_COLORS.unlicensed },
        ].filter((d) => d.value > 0);
    }, [data]);

    // ── Loading State ────────────────────────────────────────────────────────

    if (loading && !data) {
        return (
            <AppLayout title="Copilot Usage">
                <PageHeader
                    title="Copilot Usage"
                    subtitle="Copilot adoption and activity"
                    breadcrumbs={[{ label: 'Copilot', href: '/copilot' }, { label: 'Usage' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
                <SkeletonLoader variant="chart" count={2} />
            </AppLayout>
        );
    }

    if (!data) {
        return (
            <AppLayout title="Copilot Usage">
                <PageHeader
                    title="Copilot Usage"
                    subtitle="Copilot adoption and activity"
                    breadcrumbs={[{ label: 'Copilot', href: '/copilot' }, { label: 'Usage' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    Unable to load usage data. Please try again later.
                </div>
            </AppLayout>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <AppLayout title="Copilot Usage">
            <PageHeader
                title="Copilot Usage"
                subtitle={isFiltered ? 'Copilot adoption and activity' : 'Copilot adoption across all tenants'}
                breadcrumbs={[{ label: 'Copilot', href: '/copilot' }, { label: 'Usage' }]}
                actions={
                    <button
                        onClick={() => window.open(buildUrl('/api/v1/reports/copilot-usage'), '_blank')}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Export Report
                    </button>
                }
            />

            {/* ── ROW 1: Stat Cards ─────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard
                    label="Licensed Users"
                    value={data.total_licensed}
                    icon={UsersIcon}
                    accentColor="blue"
                />
                <StatCard
                    label="Active Users"
                    value={data.total_active}
                    icon={UsersIcon}
                    accentColor="emerald"
                    subtitle={`${data.adoption_rate}% adoption rate`}
                />
                <StatCard
                    label="Most Used App"
                    value={mostUsedApp}
                    icon={SparklesIcon}
                    accentColor="purple"
                />
                <StatCard
                    label="Adoption Rate"
                    value={`${data.adoption_rate}%`}
                    icon={ChartBarIcon}
                    accentColor={data.adoption_rate >= 70 ? 'emerald' : data.adoption_rate >= 40 ? 'amber' : 'red'}
                />
            </div>

            {/* ── ROW 2: Charts ──────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <ChartCard
                    title="Usage by App"
                    subtitle="Active users per Copilot-enabled application"
                    className="lg:col-span-7"
                >
                    {appChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={appChartData} layout="vertical">
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="users" name="Active Users" radius={[0, 4, 4, 0]}>
                                    {appChartData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                            No usage data available
                        </div>
                    )}
                </ChartCard>

                <ChartCard
                    title="License Status"
                    subtitle="Distribution of Copilot licenses"
                    className="lg:col-span-5"
                >
                    {licenseChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={licenseChartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    label
                                >
                                    {licenseChartData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                            No license data available
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* ── ROW 3: User Table ──────────────────────────────────────────── */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'licensed',
                            label: 'All Licenses',
                            options: [
                                { value: 'licensed', label: 'Licensed' },
                                { value: 'not_licensed', label: 'Not Licensed' },
                            ],
                        },
                        {
                            key: 'active',
                            label: 'All Activity',
                            options: [
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
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
                                            Licensed
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Last Activity
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Teams
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Word
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Excel
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
                                            PPT
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Outlook
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.items.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                                                {user.display_name}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                {user.user_principal_name}
                                            </td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                    {user.customer_name ?? user.tenant_id.slice(0, 8)}
                                                </td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge
                                                    variant={user.copilot_license_assigned ? 'success' : 'neutral'}
                                                    label={user.copilot_license_assigned ? 'Licensed' : 'No License'}
                                                    dot
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                {user.last_activity_date
                                                    ? new Date(user.last_activity_date).toLocaleDateString()
                                                    : 'Never'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <ActivityDot date={user.last_activity_teams} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <ActivityDot date={user.last_activity_word} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <ActivityDot date={user.last_activity_excel} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <ActivityDot date={user.last_activity_powerpoint} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <ActivityDot date={user.last_activity_outlook} />
                                            </td>
                                        </tr>
                                    ))}
                                    {data.items.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={isFiltered ? 9 : 10}
                                                className="py-12 text-center text-sm text-slate-400"
                                            >
                                                No users match your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {data.pagination.total > 0 && (
                            <PaginationControls
                                currentPage={data.pagination.current_page}
                                lastPage={data.pagination.last_page}
                                perPage={data.pagination.per_page}
                                total={data.pagination.total}
                                onPageChange={(pg) => {
                                    setPage(pg);
                                    fetchUsage(pg, perPage, filters, search);
                                }}
                                onPerPageChange={(pp) => {
                                    setPerPage(pp);
                                    setPage(1);
                                    fetchUsage(1, pp, filters, search);
                                }}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
