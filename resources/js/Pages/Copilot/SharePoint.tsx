import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import ChartCard from '../../Components/ChartCard';
import SectionHeader from '../../Components/SectionHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import PaginationControls from '../../Components/PaginationControls';
import FilterBar from '../../Components/FilterBar';
import { useSharePointData } from './hooks/useSharePointData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    GlobeAltIcon,
    EyeIcon,
    UsersIcon,
    ShareIcon,
    ShieldCheckIcon,
    ServerStackIcon,
    ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const val = bytes / Math.pow(1024, i);
    return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

function formatNumber(n: number): string {
    return n.toLocaleString();
}

const SHARING_COLORS: Record<string, string> = {
    anyone: '#ef4444',
    org: '#f59e0b',
    existing: '#3b82f6',
    disabled: '#10b981',
};

const SHARING_LABELS: Record<string, string> = {
    anyone: 'Anyone',
    org: 'Organization',
    existing: 'Existing Guests',
    disabled: 'Disabled',
};

function sharingVariant(sharing: string): 'critical' | 'warning' | 'info' | 'success' {
    if (sharing === 'anyone') return 'critical';
    if (sharing === 'org') return 'warning';
    if (sharing === 'existing') return 'info';
    return 'success';
}

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

export default function CopilotSharePoint() {
    const { isFiltered, buildUrl } = useTenantScope();
    const {
        data, loading, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchSites,
    } = useSharePointData();

    const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);

    // ── Filter handlers ──────────────────────────────────────────────────

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setPage(1);
        setActiveQuickAction(null);
        fetchSites(1, perPage, newFilters, search);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
        fetchSites(1, perPage, filters, value);
    };

    const handleReset = () => {
        const empty = { external_sharing: '', is_public: '', has_guest_access: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        setActiveQuickAction(null);
        fetchSites(1, perPage, empty, '');
    };

    const handleQuickAction = (action: string) => {
        if (activeQuickAction === action) {
            handleReset();
            return;
        }
        setActiveQuickAction(action);
        let newFilters = { external_sharing: '', is_public: '', has_guest_access: '' };
        if (action === 'public') newFilters = { ...newFilters, is_public: '1' };
        else if (action === 'everyone') newFilters = { ...newFilters, external_sharing: 'anyone' };
        else if (action === 'guests') newFilters = { ...newFilters, has_guest_access: '1' };
        setFilters(newFilters);
        setSearch('');
        setPage(1);
        fetchSites(1, perPage, newFilters, '');
    };

    // ── Chart data ───────────────────────────────────────────────────────

    const sharingChartData = (data?.sharing_distribution ?? []).map((d) => ({
        name: SHARING_LABELS[d.external_sharing] ?? d.external_sharing,
        value: d.count,
        fill: SHARING_COLORS[d.external_sharing] ?? '#94a3b8',
    }));

    // ── Render ───────────────────────────────────────────────────────────

    if (loading && !data) {
        return (
            <AppLayout title="SharePoint Readiness">
                <PageHeader
                    title="SharePoint Readiness"
                    subtitle="SharePoint site security posture for Copilot"
                    breadcrumbs={[{ label: 'Copilot', href: '/copilot' }, { label: 'SharePoint' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    <SkeletonLoader variant="stat-card" count={6} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = data;

    return (
        <AppLayout title="SharePoint Readiness">
            <PageHeader
                title="SharePoint Readiness"
                subtitle={isFiltered ? 'SharePoint site security posture' : 'SharePoint security posture across all tenants'}
                breadcrumbs={[{ label: 'Copilot', href: '/copilot' }, { label: 'SharePoint' }]}
                actions={
                    <button
                        onClick={() => window.open(buildUrl('/api/v1/reports/sharepoint-sites'), '_blank')}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Export Report
                    </button>
                }
            />

            {/* ── ROW 1: Stat Cards ────────────────────────────────────────── */}
            {d && (
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    <StatCard
                        label="Total Sites"
                        value={d.total_sites}
                        icon={ServerStackIcon}
                        accentColor="blue"
                    />
                    <StatCard
                        label="Public Sites"
                        value={d.public_sites}
                        icon={GlobeAltIcon}
                        accentColor={d.public_sites > 0 ? 'red' : 'emerald'}
                    />
                    <StatCard
                        label="Everyone Access"
                        value={d.sites_with_everyone}
                        icon={EyeIcon}
                        accentColor={d.sites_with_everyone > 0 ? 'red' : 'emerald'}
                    />
                    <StatCard
                        label="External Sharing"
                        value={d.sites_with_external_sharing}
                        icon={ShareIcon}
                        accentColor="amber"
                    />
                    <StatCard
                        label="Guest Access"
                        value={d.sites_with_guests}
                        icon={UsersIcon}
                        accentColor="amber"
                    />
                    <StatCard
                        label="Label Coverage"
                        value={`${d.sensitivity_labels_coverage_pct}%`}
                        icon={ShieldCheckIcon}
                        accentColor={
                            d.sensitivity_labels_coverage_pct >= 80
                                ? 'emerald'
                                : d.sensitivity_labels_coverage_pct >= 40
                                  ? 'amber'
                                  : 'red'
                        }
                    />
                </div>
            )}

            {/* ── ROW 2: Charts ────────────────────────────────────────────── */}
            {d && (
                <div className="mb-6 grid gap-6 lg:grid-cols-12">
                    <ChartCard
                        title="Sharing Configuration"
                        subtitle="Distribution of external sharing settings"
                        className="lg:col-span-7"
                    >
                        {sharingChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={sharingChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        label
                                    >
                                        {sharingChartData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                                No sharing data available
                            </div>
                        )}
                    </ChartCard>

                    <ChartCard
                        title="Storage Overview"
                        subtitle="Total storage and file counts"
                        className="lg:col-span-5"
                    >
                        <div className="flex h-[280px] flex-col items-center justify-center gap-6">
                            <div className="text-center">
                                <p className="text-sm text-slate-500">Total Storage Used</p>
                                <p className="mt-1 text-3xl font-bold text-slate-800">
                                    {formatBytes(d.total_storage_used)}
                                </p>
                            </div>
                            <div className="h-px w-16 bg-slate-200" />
                            <div className="text-center">
                                <p className="text-sm text-slate-500">Total Files</p>
                                <p className="mt-1 text-3xl font-bold text-slate-800">
                                    {formatNumber(d.total_files)}
                                </p>
                            </div>
                            <div className="h-px w-16 bg-slate-200" />
                            <div className="text-center">
                                <p className="text-sm text-slate-500">Avg. Permissioned Users</p>
                                <p className="mt-1 text-xl font-bold text-slate-800">
                                    {d.average_permissioned_users}
                                </p>
                            </div>
                        </div>
                    </ChartCard>
                </div>
            )}

            {/* ── ROW 3: Quick Action Cards ────────────────────────────────── */}
            {d && (
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <QuickActionCard
                        label="Public Sites"
                        count={d.public_sites}
                        icon={GlobeAltIcon}
                        color="red"
                        active={activeQuickAction === 'public'}
                        onClick={() => handleQuickAction('public')}
                    />
                    <QuickActionCard
                        label="Everyone Access"
                        count={d.sites_with_everyone}
                        icon={EyeIcon}
                        color="red"
                        active={activeQuickAction === 'everyone'}
                        onClick={() => handleQuickAction('everyone')}
                    />
                    <QuickActionCard
                        label="Guest Access"
                        count={d.sites_with_guests}
                        icon={UsersIcon}
                        color="amber"
                        active={activeQuickAction === 'guests'}
                        onClick={() => handleQuickAction('guests')}
                    />
                </div>
            )}

            {/* ── ROW 4: Site Inventory ────────────────────────────────────── */}
            <div className="mb-4">
                <SectionHeader title="Site Inventory" subtitle="Browse and filter SharePoint sites" />
            </div>

            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'external_sharing',
                            label: 'All Sharing',
                            options: [
                                { value: 'anyone', label: 'Anyone' },
                                { value: 'org', label: 'Organization' },
                                { value: 'existing', label: 'Existing Guests' },
                                { value: 'disabled', label: 'Disabled' },
                            ],
                        },
                    ]}
                    values={{ external_sharing: filters.external_sharing }}
                    onChange={handleFilterChange}
                    search={{
                        value: search,
                        onChange: handleSearchChange,
                        placeholder: 'Search by site name, URL, or owner...',
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
                                            Site Name
                                        </th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                                Tenant
                                            </th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Storage
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Files
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Sharing
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Public
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Guests
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Users
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Sensitivity
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Last Activity
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d?.items.map((site) => (
                                        <tr key={site.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-slate-900">{site.display_name}</p>
                                                    <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{site.site_url}</p>
                                                </div>
                                            </td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                    {site.customer_name ?? site.tenant_id.slice(0, 8)}
                                                </td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                                                {formatBytes(site.storage_used_bytes)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                                                {formatNumber(site.file_count)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge
                                                    variant={sharingVariant(site.external_sharing)}
                                                    label={SHARING_LABELS[site.external_sharing] ?? site.external_sharing}
                                                    dot
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs">
                                                {site.is_public ? (
                                                    <span className="font-medium text-red-600">Yes</span>
                                                ) : (
                                                    <span className="text-slate-400">No</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs">
                                                {site.has_guest_access ? (
                                                    <span className="font-medium text-amber-600">Yes</span>
                                                ) : (
                                                    <span className="text-slate-400">No</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                                                {site.permissioned_user_count}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                {site.sensitivity_label ?? (
                                                    <span className="text-slate-300">None</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                {site.last_activity_date
                                                    ? new Date(site.last_activity_date).toLocaleDateString()
                                                    : 'Never'}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!d?.items || d.items.length === 0) && (
                                        <tr>
                                            <td
                                                colSpan={isFiltered ? 9 : 10}
                                                className="py-12 text-center text-sm text-slate-400"
                                            >
                                                No sites match your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {d && d.pagination.total > 0 && (
                            <PaginationControls
                                currentPage={d.pagination.current_page}
                                lastPage={d.pagination.last_page}
                                perPage={d.pagination.per_page}
                                total={d.pagination.total}
                                onPageChange={(pg) => {
                                    setPage(pg);
                                    fetchSites(pg, perPage, filters, search);
                                }}
                                onPerPageChange={(pp) => {
                                    setPerPage(pp);
                                    setPage(1);
                                    fetchSites(1, pp, filters, search);
                                }}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
