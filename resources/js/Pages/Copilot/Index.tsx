import { useState, useMemo } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import ChartCard from '../../Components/ChartCard';
import SectionHeader from '../../Components/SectionHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useCopilotData } from './hooks/useCopilotData';
import type { ReadinessCheck } from './hooks/useCopilotData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    UsersIcon,
    ShieldCheckIcon,
    GlobeAltIcon,
    LockOpenIcon,
    ShareIcon,
    TagIcon,
} from '@heroicons/react/24/outline';
import {
    RadialBarChart,
    RadialBar,
    ResponsiveContainer,
    PolarAngleAxis,
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
}

function scoreAccent(score: number): 'emerald' | 'amber' | 'red' {
    if (score >= 80) return 'emerald';
    if (score >= 60) return 'amber';
    return 'red';
}

const CATEGORY_LABELS: Record<string, string> = {
    ai_governance: 'AI Governance',
    data_exposure: 'Data Exposure',
    data_protection: 'Data Protection',
    access_governance: 'Access Governance',
};

const CATEGORY_ORDER = ['data_exposure', 'access_governance', 'data_protection', 'ai_governance'];

// ── Radial Gauge Component ───────────────────────────────────────────────────

function RadialGauge({
    score,
    size = 200,
    label,
}: {
    score: number;
    size?: number;
    label?: string;
}) {
    const fill = scoreColor(score);
    const data = [{ name: 'score', value: score, fill }];

    return (
        <div className="flex flex-col items-center">
            <div style={{ width: size, height: size }} className="relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        barSize={size * 0.12}
                        data={data}
                        startAngle={225}
                        endAngle={-45}
                    >
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar
                            background={{ fill: '#e2e8f0' }}
                            dataKey="value"
                            angleAxisId={0}
                            cornerRadius={size * 0.06}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900" style={{ fontSize: size * 0.18 }}>
                        {score}
                    </span>
                    <span className="text-xs text-slate-400" style={{ fontSize: size * 0.065 }}>
                        / 100
                    </span>
                </div>
            </div>
            {label && (
                <p className="mt-1 text-center text-xs font-medium text-slate-600">{label}</p>
            )}
        </div>
    );
}

// ── Readiness Check Row ──────────────────────────────────────────────────────

function CheckRow({ check }: { check: ReadinessCheck }) {
    const statusIcon =
        check.status === 'pass' ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-sm">
                &#10003;
            </span>
        ) : check.status === 'warning' ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-sm">
                &#9888;
            </span>
        ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 text-sm">
                &#10007;
            </span>
        );

    const badgeVariant: 'success' | 'warning' | 'critical' =
        check.status === 'pass' ? 'success' : check.status === 'warning' ? 'warning' : 'critical';

    return (
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3 transition-colors hover:bg-slate-50">
            {statusIcon}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{check.name}</p>
                <p className="text-xs text-slate-400 truncate">{check.detail}</p>
            </div>
            <StatusBadge
                variant={badgeVariant}
                label={check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                size="sm"
            />
        </div>
    );
}

// ── Sort helpers for tenant table ────────────────────────────────────────────

type SortColumn =
    | 'customer_name'
    | 'overall_score'
    | 'data_exposure_score'
    | 'access_governance_score'
    | 'data_protection_score'
    | 'ai_governance_score'
    | 'copilot_licensed_users'
    | 'copilot_active_users';

type SortDirection = 'asc' | 'desc';

function SortableHeader({
    label,
    column,
    currentSort,
    currentDirection,
    onSort,
}: {
    label: string;
    column: SortColumn;
    currentSort: SortColumn;
    currentDirection: SortDirection;
    onSort: (col: SortColumn) => void;
}) {
    const isActive = currentSort === column;
    return (
        <th
            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 cursor-pointer select-none hover:text-slate-700"
            onClick={() => onSort(column)}
        >
            <span className="inline-flex items-center gap-1">
                {label}
                {isActive && (
                    <span className="text-blue-600">{currentDirection === 'asc' ? '\u2191' : '\u2193'}</span>
                )}
            </span>
        </th>
    );
}

function ScoreBar({ score }: { score: number }) {
    const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2">
            <div className="h-2 w-16 rounded-full bg-slate-200">
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
            </div>
            <span className="text-xs font-medium text-slate-700">{score}</span>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CopilotReadiness() {
    const { isFiltered } = useTenantScope();
    const { readiness, loading } = useCopilotData();

    // Tenant table sort state
    const [sortColumn, setSortColumn] = useState<SortColumn>('overall_score');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (col: SortColumn) => {
        if (sortColumn === col) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(col);
            setSortDirection('desc');
        }
    };

    // Group readiness checks by category
    const groupedChecks = useMemo(() => {
        if (!readiness?.readiness_checks) return {};
        const groups: Record<string, ReadinessCheck[]> = {};
        for (const cat of CATEGORY_ORDER) {
            const items = readiness.readiness_checks.filter((c) => c.category === cat);
            if (items.length > 0) groups[cat] = items;
        }
        return groups;
    }, [readiness]);

    // Sorted tenants
    const sortedTenants = useMemo(() => {
        if (!readiness?.readiness_by_tenant) return [];
        return [...readiness.readiness_by_tenant].sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortDirection === 'asc'
                ? (aVal as number) - (bVal as number)
                : (bVal as number) - (aVal as number);
        });
    }, [readiness, sortColumn, sortDirection]);

    // ── Loading State ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <AppLayout title="Copilot Readiness">
                <PageHeader
                    title="Copilot Readiness"
                    subtitle="Microsoft 365 Copilot readiness assessment"
                    breadcrumbs={[{ label: 'Copilot', href: '/copilot' }, { label: 'Readiness' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    <SkeletonLoader variant="stat-card" count={6} className="contents" />
                </div>
                <SkeletonLoader variant="chart" count={2} />
            </AppLayout>
        );
    }

    if (!readiness) {
        return (
            <AppLayout title="Copilot Readiness">
                <PageHeader
                    title="Copilot Readiness"
                    subtitle="Microsoft 365 Copilot readiness assessment"
                    breadcrumbs={[{ label: 'Copilot', href: '/copilot' }, { label: 'Readiness' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    Unable to load readiness data. Please try again later.
                </div>
            </AppLayout>
        );
    }

    const d = readiness;

    // ── Pillar data ──────────────────────────────────────────────────────────

    const pillars = [
        { label: 'Data Exposure', score: d.data_exposure_score },
        { label: 'Access Governance', score: d.access_governance_score },
        { label: 'Data Protection', score: d.data_protection_score },
        { label: 'AI Governance', score: d.ai_governance_score },
    ];

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <AppLayout title="Copilot Readiness">
            <PageHeader
                title="Copilot Readiness"
                subtitle={isFiltered ? 'Copilot readiness assessment' : 'Copilot readiness across all tenants'}
                breadcrumbs={[{ label: 'Copilot', href: '/copilot' }, { label: 'Readiness' }]}
            />

            {/* ── ROW 1: Overall Readiness Score ────────────────────────────── */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
                    {/* Main gauge */}
                    <div className="flex flex-col items-center">
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Overall Readiness
                        </h3>
                        <RadialGauge score={d.overall_score} size={180} />
                    </div>

                    {/* Pillar gauges */}
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                        {pillars.map((pillar) => (
                            <RadialGauge
                                key={pillar.label}
                                score={pillar.score}
                                size={120}
                                label={pillar.label}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── ROW 2: Key Metrics Cards ──────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                <StatCard
                    label="Licensed Users"
                    value={d.copilot_licensed_users}
                    icon={UsersIcon}
                    accentColor="blue"
                />
                <StatCard
                    label="Adoption Rate"
                    value={`${d.adoption_rate}%`}
                    icon={UsersIcon}
                    accentColor={d.adoption_rate >= 70 ? 'emerald' : d.adoption_rate >= 40 ? 'amber' : 'red'}
                    badge={{
                        text: d.copilot_active_users + ' active',
                        color: d.adoption_rate >= 70 ? 'emerald' : d.adoption_rate >= 40 ? 'amber' : 'red',
                    }}
                />
                <StatCard
                    label="Everyone Access"
                    value={d.sites_with_everyone_access}
                    icon={LockOpenIcon}
                    accentColor={d.sites_with_everyone_access > 0 ? 'red' : 'emerald'}
                    subtitle="Sites with everyone"
                />
                <StatCard
                    label="Public Sites"
                    value={d.public_sites_count}
                    icon={GlobeAltIcon}
                    accentColor={d.public_sites_count > 0 ? 'amber' : 'emerald'}
                    subtitle="SharePoint sites"
                />
                <StatCard
                    label="External Sharing"
                    value={d.sites_with_external_sharing}
                    icon={ShareIcon}
                    accentColor={d.sites_with_external_sharing > 0 ? 'amber' : 'emerald'}
                    subtitle="Sites w/ external"
                />
                <StatCard
                    label="Labels Coverage"
                    value={`${d.sensitivity_labels_applied_pct}%`}
                    icon={TagIcon}
                    accentColor={d.sensitivity_labels_applied_pct >= 80 ? 'emerald' : d.sensitivity_labels_applied_pct >= 50 ? 'amber' : 'red'}
                    subtitle="Sensitivity labels"
                />
            </div>

            {/* ── ROW 3: Readiness Checks ───────────────────────────────────── */}
            <div className="mb-6">
                <SectionHeader title="Readiness Checks" subtitle="Detailed assessment of Copilot readiness criteria" />
                <div className="space-y-4">
                    {Object.entries(groupedChecks).map(([category, checks]) => (
                        <div key={category}>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                {CATEGORY_LABELS[category] ?? category}
                            </h4>
                            <div className="space-y-2">
                                {checks.map((check) => (
                                    <CheckRow key={check.id} check={check} />
                                ))}
                            </div>
                        </div>
                    ))}
                    {Object.keys(groupedChecks).length === 0 && (
                        <div className="flex h-32 items-center justify-center rounded-lg border border-slate-100 bg-white text-sm text-slate-400">
                            No readiness checks available.
                        </div>
                    )}
                </div>
            </div>

            {/* ── ROW 4: Readiness by Tenant ────────────────────────────────── */}
            {!isFiltered && sortedTenants.length > 0 && (
                <div className="mb-6">
                    <SectionHeader title="Readiness by Tenant" subtitle="Compare readiness scores across tenants" />
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <SortableHeader label="Tenant" column="customer_name" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                                        <SortableHeader label="Overall" column="overall_score" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                                        <SortableHeader label="Data Exposure" column="data_exposure_score" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                                        <SortableHeader label="Access Gov." column="access_governance_score" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                                        <SortableHeader label="Data Protection" column="data_protection_score" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                                        <SortableHeader label="AI Governance" column="ai_governance_score" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                                        <SortableHeader label="Licensed" column="copilot_licensed_users" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                                        <SortableHeader label="Active" column="copilot_active_users" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedTenants.map((tenant) => (
                                        <tr key={tenant.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                                                {tenant.customer_name}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <ScoreBar score={tenant.overall_score} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-center">
                                                <span className={`text-sm font-medium ${tenant.data_exposure_score >= 80 ? 'text-emerald-600' : tenant.data_exposure_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {tenant.data_exposure_score}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-center">
                                                <span className={`text-sm font-medium ${tenant.access_governance_score >= 80 ? 'text-emerald-600' : tenant.access_governance_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {tenant.access_governance_score}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-center">
                                                <span className={`text-sm font-medium ${tenant.data_protection_score >= 80 ? 'text-emerald-600' : tenant.data_protection_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {tenant.data_protection_score}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-center">
                                                <span className={`text-sm font-medium ${tenant.ai_governance_score >= 80 ? 'text-emerald-600' : tenant.ai_governance_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {tenant.ai_governance_score}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-slate-600">
                                                {tenant.copilot_licensed_users}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-slate-600">
                                                {tenant.copilot_active_users}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
