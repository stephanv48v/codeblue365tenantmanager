import { useEffect, useState, useCallback, useRef } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import ChartCard from '../../Components/ChartCard';
import SectionHeader from '../../Components/SectionHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import PaginationControls from '../../Components/PaginationControls';
import FilterBar from '../../Components/FilterBar';
import { useIdentityData } from './hooks/useIdentityData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    UsersIcon,
    ShieldCheckIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    KeyIcon,
    CheckCircleIcon,
    NoSymbolIcon,
    ArrowDownTrayIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────

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

// ── Constants ──────────────────────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3b82f6',
    none: '#94a3b8',
};

const MFA_COLORS = { registered: '#10b981', notRegistered: '#ef4444' };

const STALE_DAYS = 90;

function daysSince(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function isStale(user: User): boolean {
    return user.account_enabled && (!user.last_sign_in_at || daysSince(user.last_sign_in_at) > STALE_DAYS);
}

// ── Export Dropdown ────────────────────────────────────────────────────────

function ExportDropdown({ buildUrl }: { buildUrl: (base: string, extra?: Record<string, string>) => string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const exports: Array<{ label: string; params: Record<string, string> }> = [
        { label: 'All Users (CSV)', params: {} },
        { label: 'Stale Users Only (CSV)', params: { stale: '1' } },
        { label: 'MFA Gap Report (CSV)', params: { mfa_status: 'not_registered', account_enabled: 'enabled' } },
    ];

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export Report
                <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {exports.map((exp) => (
                        <button
                            key={exp.label}
                            onClick={() => {
                                window.open(buildUrl('/api/v1/reports/identity', exp.params), '_blank');
                                setOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                            {exp.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
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

// ── Main Component ─────────────────────────────────────────────────────────

export default function IdentityUsers() {
    const { selectedTenantId, isFiltered, buildUrl } = useTenantScope();
    const { overview, loading: overviewLoading } = useIdentityData();

    // Table state
    const [data, setData] = useState<PaginatedUsers | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ mfa_status: '', account_enabled: '', stale: '' });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    // Quick-action active state
    const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);

    const fetchUsers = useCallback((pg = page, pp = perPage, f = filters, s = search) => {
        setLoading(true);
        const params = new URLSearchParams({ per_page: String(pp), page: String(pg) });
        if (selectedTenantId) params.set('tenant_id', selectedTenantId);
        if (s) params.set('search', s);
        if (f.mfa_status) params.set('mfa_status', f.mfa_status);
        if (f.account_enabled) params.set('account_enabled', f.account_enabled);
        if (f.stale === 'stale') params.set('stale', '1');

        fetch(`/api/v1/identity/users?${params}`)
            .then((r) => r.json())
            .then((res) => {
                setData(res.success ? res.data : null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [page, perPage, filters, search, selectedTenantId]);

    useEffect(() => {
        fetchUsers();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Filter handlers ────────────────────────────────────────────────────

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setPage(1);
        setActiveQuickAction(null);
        fetchUsers(1, perPage, newFilters, search);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
        fetchUsers(1, perPage, filters, value);
    };

    const handleReset = () => {
        const empty = { mfa_status: '', account_enabled: '', stale: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        setActiveQuickAction(null);
        fetchUsers(1, perPage, empty, '');
    };

    const handleQuickAction = (action: string) => {
        if (activeQuickAction === action) {
            // Toggle off
            handleReset();
            return;
        }
        setActiveQuickAction(action);
        let newFilters = { mfa_status: '', account_enabled: '', stale: '' };
        if (action === 'stale') newFilters = { ...newFilters, stale: 'stale' };
        else if (action === 'no_mfa') newFilters = { ...newFilters, mfa_status: 'not_registered' };
        else if (action === 'disabled') newFilters = { ...newFilters, account_enabled: 'disabled' };
        setFilters(newFilters);
        setSearch('');
        setPage(1);
        fetchUsers(1, perPage, newFilters, '');
    };

    // ── Chart data ─────────────────────────────────────────────────────────

    const d = overview;

    const mfaByTenant = d?.mfa_by_tenant.map((t) => ({
        name: t.customer_name.length > 15 ? t.customer_name.slice(0, 15) + '...' : t.customer_name,
        mfa: t.mfa_users,
        noMfa: t.total_users - t.mfa_users,
    })) ?? [];

    const riskyByLevel = d?.risky_by_level.map((r) => ({
        name: r.risk_level.charAt(0).toUpperCase() + r.risk_level.slice(1),
        value: r.count,
        fill: RISK_COLORS[r.risk_level] ?? '#94a3b8',
    })) ?? [];

    // Single-tenant MFA donut data
    const mfaDonut = d ? [
        { name: 'MFA Registered', value: d.mfa_registered, fill: MFA_COLORS.registered },
        { name: 'No MFA', value: d.enabled_no_mfa, fill: MFA_COLORS.notRegistered },
    ] : [];

    // ── Render ─────────────────────────────────────────────────────────────

    if (overviewLoading) {
        return (
            <AppLayout title="Identity">
                <PageHeader
                    title="Identity"
                    subtitle="User identity health and directory"
                    breadcrumbs={[{ label: 'Identity' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    <SkeletonLoader variant="stat-card" count={6} className="contents" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Identity">
            <PageHeader
                title="Identity"
                subtitle={isFiltered ? 'User identity health and directory' : 'User identity health across all tenants'}
                breadcrumbs={[{ label: 'Identity' }]}
                actions={<ExportDropdown buildUrl={buildUrl} />}
            />

            {/* ── Stat Cards ────────────────────────────────────────────── */}
            {d && (
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    <StatCard label="Total Users" value={d.total_users} icon={UsersIcon} accentColor="blue" />
                    <StatCard
                        label="Enabled"
                        value={d.enabled_users}
                        icon={CheckCircleIcon}
                        accentColor="emerald"
                        subtitle={`${d.disabled_users} disabled`}
                    />
                    <StatCard
                        label="MFA Coverage"
                        value={`${d.mfa_coverage_percent}%`}
                        icon={ShieldCheckIcon}
                        accentColor={d.mfa_coverage_percent >= 90 ? 'emerald' : d.mfa_coverage_percent >= 70 ? 'amber' : 'red'}
                        subtitle={`${d.enabled_no_mfa} without MFA`}
                    />
                    <StatCard
                        label="Stale Users"
                        value={d.stale_users}
                        icon={ClockIcon}
                        accentColor={d.stale_users > 0 ? 'amber' : 'emerald'}
                        subtitle="90+ days inactive"
                    />
                    <StatCard
                        label="Risky Users"
                        value={d.risky_users_count}
                        icon={ExclamationTriangleIcon}
                        href="/identity/risky-users"
                        accentColor={d.risky_users_count > 0 ? 'red' : 'emerald'}
                    />
                    <StatCard
                        label="CA Policies"
                        value={d.ca_policies_count}
                        icon={KeyIcon}
                        href="/identity/conditional-access"
                        accentColor="blue"
                    />
                </div>
            )}

            {/* ── Charts ────────────────────────────────────────────────── */}
            {d && (
                <div className="mb-6 grid gap-6 lg:grid-cols-12">
                    <ChartCard
                        title={isFiltered ? 'MFA Coverage' : 'MFA Coverage by Tenant'}
                        subtitle={isFiltered ? 'Registered vs not registered' : 'Users with MFA vs without'}
                        className="lg:col-span-8"
                    >
                        {isFiltered ? (
                            /* Single-tenant: donut chart */
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={mfaDonut}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        label
                                    >
                                        {mfaDonut.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            /* All tenants: horizontal bar chart */
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={mfaByTenant} layout="vertical">
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="mfa" name="MFA Registered" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="noMfa" name="No MFA" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                    <ChartCard title="Risky Users by Level" className="lg:col-span-4">
                        {riskyByLevel.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={riskyByLevel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                                        {riskyByLevel.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                                No risky users detected
                            </div>
                        )}
                    </ChartCard>
                </div>
            )}

            {/* ── Quick Action Cards ────────────────────────────────────── */}
            {d && (
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <QuickActionCard
                        label="Stale Users"
                        count={d.stale_users}
                        icon={ClockIcon}
                        color="amber"
                        active={activeQuickAction === 'stale'}
                        onClick={() => handleQuickAction('stale')}
                    />
                    <QuickActionCard
                        label="No MFA"
                        count={d.enabled_no_mfa}
                        icon={ShieldCheckIcon}
                        color="red"
                        active={activeQuickAction === 'no_mfa'}
                        onClick={() => handleQuickAction('no_mfa')}
                    />
                    <QuickActionCard
                        label="Disabled Accounts"
                        count={d.disabled_users}
                        icon={NoSymbolIcon}
                        color="slate"
                        active={activeQuickAction === 'disabled'}
                        onClick={() => handleQuickAction('disabled')}
                    />
                </div>
            )}

            {/* ── User Directory ─────────────────────────────────────────── */}
            <div className="mb-4">
                <SectionHeader title="User Directory" subtitle="Browse and filter the full user list" />
            </div>

            {/* Filters */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'mfa_status',
                            label: 'All MFA Status',
                            options: [
                                { value: 'registered', label: 'MFA Registered' },
                                { value: 'not_registered', label: 'No MFA' },
                            ],
                        },
                        {
                            key: 'account_enabled',
                            label: 'All Accounts',
                            options: [
                                { value: 'enabled', label: 'Enabled' },
                                { value: 'disabled', label: 'Disabled' },
                            ],
                        },
                        {
                            key: 'stale',
                            label: 'All Activity',
                            options: [
                                { value: 'stale', label: 'Stale (90+ days)' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{
                        value: search,
                        onChange: handleSearchChange,
                        placeholder: 'Search by name, UPN, or tenant...',
                    }}
                    onReset={handleReset}
                />
            </div>

            {/* Table */}
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
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">UPN</th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">MFA</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Activity</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Roles</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Sign-In</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data?.items.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{user.display_name}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">{user.user_principal_name}</td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">{user.customer_name ?? user.tenant_id.slice(0, 8)}</td>
                                            )}
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
                                            <td className="whitespace-nowrap px-4 py-3">
                                                {isStale(user) ? (
                                                    <StatusBadge variant="warning" label="Stale" dot />
                                                ) : (
                                                    <StatusBadge variant="success" label="Active" dot />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate">
                                                {user.assigned_roles || '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-400 text-xs">
                                                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data?.items || data.items.length === 0) && (
                                        <tr>
                                            <td colSpan={isFiltered ? 7 : 8} className="py-12 text-center text-sm text-slate-400">
                                                No users match your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {data && data.pagination.total > 0 && (
                            <PaginationControls
                                currentPage={data.pagination.current_page}
                                lastPage={data.pagination.last_page}
                                perPage={data.pagination.per_page}
                                total={data.pagination.total}
                                onPageChange={(pg) => { setPage(pg); fetchUsers(pg, perPage, filters, search); }}
                                onPerPageChange={(pp) => { setPerPage(pp); setPage(1); fetchUsers(1, pp, filters, search); }}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
