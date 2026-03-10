import { useState, useMemo } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import SkeletonLoader from '../../Components/SkeletonLoader';
import StatusBadge from '../../Components/StatusBadge';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import ExportButton from '../../Components/ExportButton';
import { useRiskyUsersData, type RiskyFilters } from './hooks/useRiskyUsersData';
import { ExclamationTriangleIcon, ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { useTenantScope } from '../../hooks/useTenantScope';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ── Helpers ─────────────────────────────────────────────────────────────────

const riskLevelVariant = (level: string) => {
    switch (level) {
        case 'high': return 'critical' as const;
        case 'medium': return 'warning' as const;
        case 'low': return 'info' as const;
        default: return 'neutral' as const;
    }
};

const riskStateVariant = (state: string) => {
    switch (state) {
        case 'atRisk': return 'critical' as const;
        case 'remediated': return 'success' as const;
        case 'confirmedCompromised': return 'critical' as const;
        default: return 'neutral' as const;
    }
};

// ── Quick Action Card ───────────────────────────────────────────────────────

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

export default function RiskyUsers() {
    const { isFiltered } = useTenantScope();
    const {
        data, loading, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchRiskyUsers,
    } = useRiskyUsersData();

    const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);

    // ── Filter handlers ─────────────────────────────────────────────────────

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: RiskyFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setPage(1);
        setActiveQuickAction(null);
        fetchRiskyUsers(1, perPage, newFilters, search);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
        fetchRiskyUsers(1, perPage, filters, value);
    };

    const handleReset = () => {
        const empty: RiskyFilters = { risk_level: '', risk_state: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        setActiveQuickAction(null);
        fetchRiskyUsers(1, perPage, empty, '');
    };

    const handleQuickAction = (action: string) => {
        if (activeQuickAction === action) {
            handleReset();
            return;
        }
        setActiveQuickAction(action);
        let newFilters: RiskyFilters = { risk_level: '', risk_state: '' };
        if (action === 'high') newFilters = { ...newFilters, risk_level: 'high' };
        else if (action === 'medium') newFilters = { ...newFilters, risk_level: 'medium' };
        else if (action === 'remediated') newFilters = { ...newFilters, risk_state: 'remediated' };
        setFilters(newFilters);
        setSearch('');
        setPage(1);
        fetchRiskyUsers(1, perPage, newFilters, '');
    };

    // ── Loading state ───────────────────────────────────────────────────────

    if (loading && !data) {
        return (
            <AppLayout title="Risky Users">
                <PageHeader
                    title="Risky Users"
                    subtitle="Identity Protection flagged accounts"
                    breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Risky Users' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = data!;

    return (
        <AppLayout title="Risky Users">
            <PageHeader
                title="Risky Users"
                subtitle="Identity Protection flagged accounts"
                breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Risky Users' }]}
                actions={<ExportButton csvEndpoint="/api/v1/reports/risky-users" />}
            />

            {/* ── Stat Cards ────────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Total Risky" value={d.total} icon={ExclamationTriangleIcon} accentColor="red" />
                <StatCard label="High Risk" value={d.high} accentColor="red" />
                <StatCard label="Medium Risk" value={d.medium} accentColor="amber" />
                <StatCard label="Remediated" value={d.remediated} icon={ShieldCheckIcon} accentColor="emerald" />
            </div>

            {/* ── Risk Distribution Charts ──────────────────────────────────── */}
            {d.total > 0 && (() => {
                const lowCount = Math.max(0, d.total - d.high - d.medium);
                const riskLevelData = [
                    { name: 'High', value: d.high, fill: '#ef4444' },
                    { name: 'Medium', value: d.medium, fill: '#f59e0b' },
                    { name: 'Low', value: lowCount, fill: '#3b82f6' },
                ].filter((item) => item.value > 0);

                const stateCounts: Record<string, number> = {};
                d.items.forEach((u) => {
                    const label =
                        u.risk_state === 'atRisk' ? 'At Risk'
                        : u.risk_state === 'confirmedCompromised' ? 'Compromised'
                        : u.risk_state === 'remediated' ? 'Remediated'
                        : u.risk_state === 'dismissed' ? 'Dismissed'
                        : u.risk_state;
                    stateCounts[label] = (stateCounts[label] ?? 0) + 1;
                });
                const stateColors: Record<string, string> = {
                    'At Risk': '#ef4444',
                    'Compromised': '#dc2626',
                    'Remediated': '#10b981',
                    'Dismissed': '#94a3b8',
                };
                const riskStateData = Object.entries(stateCounts).map(([name, value]) => ({
                    name,
                    value,
                    fill: stateColors[name] ?? '#64748b',
                }));

                return (
                    <div className="mb-6 grid gap-6 lg:grid-cols-2">
                        <ChartCard title="Risk Level Distribution" subtitle="Users by risk severity">
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={riskLevelData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={85}
                                        label
                                    >
                                        {riskLevelData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Risk State Breakdown" subtitle="Users by current risk state">
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={riskStateData} layout="horizontal">
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" name="Users" radius={[4, 4, 0, 0]}>
                                        {riskStateData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                );
            })()}

            {/* ── Quick Action Cards ────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <QuickActionCard
                    label="High Risk"
                    count={d.high}
                    icon={ShieldExclamationIcon}
                    color="red"
                    active={activeQuickAction === 'high'}
                    onClick={() => handleQuickAction('high')}
                />
                <QuickActionCard
                    label="Medium Risk"
                    count={d.medium}
                    icon={ExclamationTriangleIcon}
                    color="amber"
                    active={activeQuickAction === 'medium'}
                    onClick={() => handleQuickAction('medium')}
                />
                <QuickActionCard
                    label="Remediated"
                    count={d.remediated}
                    icon={ShieldCheckIcon}
                    color="slate"
                    active={activeQuickAction === 'remediated'}
                    onClick={() => handleQuickAction('remediated')}
                />
            </div>

            {/* ── Filter Bar ────────────────────────────────────────────────── */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'risk_level',
                            label: 'All Risk Levels',
                            options: [
                                { value: 'high', label: 'High' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'low', label: 'Low' },
                            ],
                        },
                        {
                            key: 'risk_state',
                            label: 'All States',
                            options: [
                                { value: 'atRisk', label: 'At Risk' },
                                { value: 'confirmedCompromised', label: 'Compromised' },
                                { value: 'remediated', label: 'Remediated' },
                                { value: 'dismissed', label: 'Dismissed' },
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
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">UPN</th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Risk Level</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">State</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Detail</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d.items.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{user.display_name ?? '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{user.user_principal_name ?? '-'}</td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{user.customer_name ?? user.tenant_id.slice(0, 8)}</td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={riskLevelVariant(user.risk_level)} label={user.risk_level} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={riskStateVariant(user.risk_state)} label={user.risk_state} dot />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">{user.risk_detail ?? '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                {user.risk_last_updated_at ? new Date(user.risk_last_updated_at).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {d.items.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 6 : 7} className="py-12 text-center text-sm text-slate-400">
                                                No risky users match your filters.
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
                                onPageChange={(pg) => { setPage(pg); fetchRiskyUsers(pg, perPage, filters, search); }}
                                onPerPageChange={(pp) => { setPerPage(pp); setPage(1); fetchRiskyUsers(1, pp, filters, search); }}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
