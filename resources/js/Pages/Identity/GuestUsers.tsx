import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import SectionHeader from '../../Components/SectionHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import StatusBadge from '../../Components/StatusBadge';
import { useGuestUsersData, type GuestUser } from './hooks/useGuestUsersData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    UserPlusIcon,
    ClockIcon,
    EnvelopeIcon,
    NoSymbolIcon,
    CheckCircleIcon,
    ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

// ── Constants ──────────────────────────────────────────────────────────────

const STALE_DAYS = 90;

function daysSince(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

// ── Quick Action Card ──────────────────────────────────────────────────────

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
        cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-400', activeBg: 'bg-cyan-50' },
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

// ── Guest State Helper ─────────────────────────────────────────────────────

function guestState(guest: GuestUser): { variant: 'disabled' | 'warning' | 'critical' | 'success'; label: string } {
    if (!guest.account_enabled) {
        return { variant: 'disabled', label: 'Disabled' };
    }
    if (guest.external_user_state === 'PendingAcceptance') {
        return { variant: 'warning', label: 'Pending' };
    }
    if (!guest.last_sign_in_at || daysSince(guest.last_sign_in_at) > STALE_DAYS) {
        return { variant: 'critical', label: 'Stale' };
    }
    return { variant: 'success', label: 'Active' };
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function GuestUsers() {
    const { isFiltered, buildUrl } = useTenantScope();
    const {
        data, loading, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchGuests,
    } = useGuestUsersData();

    const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);

    // ── Filter handlers ────────────────────────────────────────────────────

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setPage(1);
        setActiveQuickAction(null);
        fetchGuests(1, perPage, newFilters, search);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
        fetchGuests(1, perPage, filters, value);
    };

    const handleReset = () => {
        const empty = { state: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        setActiveQuickAction(null);
        fetchGuests(1, perPage, empty, '');
    };

    const handleQuickAction = (action: string) => {
        if (activeQuickAction === action) {
            handleReset();
            return;
        }
        setActiveQuickAction(action);
        const newFilters = { state: action };
        setFilters(newFilters);
        setSearch('');
        setPage(1);
        fetchGuests(1, perPage, newFilters, '');
    };

    // ── Chart data ─────────────────────────────────────────────────────────

    const d = data;

    const domainChartData = d?.by_domain.slice(0, 10).map((item) => ({
        name: item.domain,
        count: item.count,
    })) ?? [];

    const stateDistribution = d ? [
        { name: 'Active', value: d.active_guests, fill: '#10b981' },
        { name: 'Stale', value: d.stale_guests, fill: '#ef4444' },
        { name: 'Pending', value: d.pending_acceptance, fill: '#f59e0b' },
        { name: 'Disabled', value: d.disabled_guests, fill: '#94a3b8' },
    ].filter((x) => x.value > 0) : [];

    // ── Render ─────────────────────────────────────────────────────────────

    if (loading && !d) {
        return (
            <AppLayout title="Guest Users">
                <PageHeader
                    title="Guest Users"
                    subtitle="External user management and lifecycle tracking"
                    breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Guest Users' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Guest Users">
            <PageHeader
                title="Guest Users"
                subtitle="External user management and lifecycle tracking"
                breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Guest Users' }]}
                actions={
                    <button
                        onClick={() => window.open(buildUrl('/api/v1/reports/guest-users'), '_blank')}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Export Report
                    </button>
                }
            />

            {/* ── Stat Cards ────────────────────────────────────────────── */}
            {d && (
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <StatCard label="Total Guests" value={d.total_guests} icon={UserPlusIcon} accentColor="blue" />
                    <StatCard label="Active" value={d.active_guests} icon={CheckCircleIcon} accentColor="emerald" />
                    <StatCard
                        label="Stale (90+ days)"
                        value={d.stale_guests}
                        icon={ClockIcon}
                        accentColor={d.stale_guests > 0 ? 'red' : 'emerald'}
                    />
                    <StatCard
                        label="Pending Acceptance"
                        value={d.pending_acceptance}
                        icon={EnvelopeIcon}
                        accentColor={d.pending_acceptance > 0 ? 'amber' : 'emerald'}
                    />
                    <StatCard label="Disabled" value={d.disabled_guests} icon={NoSymbolIcon} accentColor="slate" />
                </div>
            )}

            {/* ── Charts ────────────────────────────────────────────────── */}
            {d && (
                <div className="mb-6 grid gap-6 lg:grid-cols-12">
                    <ChartCard title="Top Domains" className="lg:col-span-7">
                        {domainChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={domainChartData} layout="vertical">
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" name="Guests" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                                No domain data available
                            </div>
                        )}
                    </ChartCard>

                    <ChartCard title="Guest State Distribution" className="lg:col-span-5">
                        {stateDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={stateDistribution}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        label
                                    >
                                        {stateDistribution.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                                No guest users found
                            </div>
                        )}
                    </ChartCard>
                </div>
            )}

            {/* ── Quick Action Cards ────────────────────────────────────── */}
            {d && (
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <QuickActionCard
                        label="Stale Guests"
                        count={d.stale_guests}
                        icon={ClockIcon}
                        color="red"
                        active={activeQuickAction === 'stale'}
                        onClick={() => handleQuickAction('stale')}
                    />
                    <QuickActionCard
                        label="Pending Invitations"
                        count={d.pending_acceptance}
                        icon={EnvelopeIcon}
                        color="amber"
                        active={activeQuickAction === 'pending'}
                        onClick={() => handleQuickAction('pending')}
                    />
                    <QuickActionCard
                        label="Disabled Guests"
                        count={d.disabled_guests}
                        icon={NoSymbolIcon}
                        color="slate"
                        active={activeQuickAction === 'disabled'}
                        onClick={() => handleQuickAction('disabled')}
                    />
                </div>
            )}

            {/* ── Filter Bar ────────────────────────────────────────────── */}
            <div className="mb-4">
                <SectionHeader title="Guest Directory" subtitle="Browse and filter external users" />
            </div>

            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'state',
                            label: 'All States',
                            options: [
                                { value: 'active', label: 'Active' },
                                { value: 'stale', label: 'Stale' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'disabled', label: 'Disabled' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{
                        value: search,
                        onChange: handleSearchChange,
                        placeholder: 'Search by name, email, or domain...',
                    }}
                    onReset={handleReset}
                />
            </div>

            {/* ── Table ─────────────────────────────────────────────────── */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {loading ? (
                    <div className="p-6"><SkeletonLoader variant="table" count={10} /></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Email</th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Domain</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Company</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">State</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Created</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Sign-In</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d?.items.map((guest) => {
                                        const state = guestState(guest);
                                        return (
                                            <tr key={guest.id} className="hover:bg-slate-50">
                                                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                                                    {guest.display_name || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">
                                                    {guest.mail || guest.user_principal_name || '-'}
                                                </td>
                                                {!isFiltered && (
                                                    <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">
                                                        {guest.customer_name ?? guest.tenant_id.slice(0, 8)}
                                                    </td>
                                                )}
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">
                                                    {guest.domain || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">
                                                    {guest.company_name || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <StatusBadge variant={state.variant} label={state.label} dot />
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                    {guest.created_datetime ? new Date(guest.created_datetime).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                    {guest.last_sign_in_at ? new Date(guest.last_sign_in_at).toLocaleDateString() : 'Never'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {(!d?.items || d.items.length === 0) && (
                                        <tr>
                                            <td colSpan={isFiltered ? 7 : 8} className="py-12 text-center text-sm text-slate-400">
                                                No guest users match your filters.
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
                                onPageChange={(pg) => { setPage(pg); fetchGuests(pg, perPage, filters, search); }}
                                onPerPageChange={(pp) => { setPerPage(pp); setPage(1); fetchGuests(1, pp, filters, search); }}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
