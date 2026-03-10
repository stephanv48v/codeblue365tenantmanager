import { useState, useMemo } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import ChartCard from '../../Components/ChartCard';
import SectionHeader from '../../Components/SectionHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { usePostureData } from './hooks/usePostureData';
import type { TenantPosture } from './hooks/usePostureData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { usePdfReport } from '../../hooks/usePdfReport';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import {
    RadialBarChart,
    RadialBar,
    ResponsiveContainer,
    PolarAngleAxis,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

// -- Pillar configuration ---------------------------------------------------

const PILLAR_CONFIG: Record<string, { label: string; weight: string; description: string }> = {
    identity: {
        label: 'Identity',
        weight: '20%',
        description:
            'Measures MFA coverage, stale users, admin account hygiene, conditional access policies, and risky user management.',
    },
    device: {
        label: 'Device',
        weight: '15%',
        description:
            'Evaluates device compliance rates, operating system currency, BitLocker encryption, and endpoint protection coverage.',
    },
    app: {
        label: 'Application',
        weight: '10%',
        description:
            'Assesses application registration hygiene, OAuth app permissions, and third-party app risk.',
    },
    security: {
        label: 'Security Posture',
        weight: '25%',
        description:
            'Based on Microsoft Secure Score, legacy authentication blocking, DLP policies, and overall security configuration.',
    },
    governance: {
        label: 'Governance',
        weight: '15%',
        description:
            'Tracks GDAP relationship health, audit logging, data classification policies, and partner center governance.',
    },
    integration: {
        label: 'Integration',
        weight: '15%',
        description:
            'Monitors integration health, sync pipeline reliability, API connectivity, and data freshness across services.',
    },
};

const PILLAR_KEYS = ['identity', 'device', 'app', 'security', 'governance', 'integration'] as const;

const TREND_COLORS: Record<string, string> = {
    composite: '#3b82f6',
    identity: '#8b5cf6',
    device: '#06b6d4',
    app: '#f59e0b',
    security: '#ef4444',
    governance: '#10b981',
    integration: '#64748b',
};

const TREND_LABELS: Record<string, string> = {
    composite: 'Composite',
    identity: 'Identity',
    device: 'Device',
    app: 'Application',
    security: 'Security',
    governance: 'Governance',
    integration: 'Integration',
};

// -- Helpers ----------------------------------------------------------------

function scoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
}

// -- Radial Gauge -----------------------------------------------------------

function RadialGauge({ score, size = 200, label }: { score: number; size?: number; label?: string }) {
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
                    <span
                        className="text-3xl font-bold text-slate-900"
                        style={{ fontSize: size * 0.18 }}
                    >
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

// -- Pillar Breakdown Accordion ---------------------------------------------

function PillarBreakdown({ pillarKey, score }: { pillarKey: string; score: number }) {
    const [open, setOpen] = useState(false);
    const config = PILLAR_CONFIG[pillarKey];
    if (!config) return null;

    const fill = scoreColor(score);

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-200">
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ backgroundColor: fill }}
                    >
                        {score}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">{config.label}</p>
                        <p className="text-xs text-slate-400">{config.weight} of overall score</p>
                    </div>
                </div>
                {open ? (
                    <ChevronUpIcon className="h-5 w-5 text-slate-400" />
                ) : (
                    <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                )}
            </button>
            {open && (
                <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
                    <p className="text-sm text-slate-600">{config.description}</p>
                </div>
            )}
        </div>
    );
}

// -- Sortable Table Helpers -------------------------------------------------

type SortColumn =
    | 'customer_name'
    | 'composite_score'
    | 'identity'
    | 'device'
    | 'app'
    | 'security'
    | 'governance'
    | 'integration';

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
                    <span className="text-blue-600">
                        {currentDirection === 'asc' ? '\u2191' : '\u2193'}
                    </span>
                )}
            </span>
        </th>
    );
}

function ScoreBar({ score }: { score: number }) {
    const color =
        score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2">
            <div className="h-2 w-16 rounded-full bg-slate-200">
                <div
                    className={`h-2 rounded-full ${color}`}
                    style={{ width: `${Math.min(score, 100)}%` }}
                />
            </div>
            <span className="text-xs font-medium text-slate-700">{score}</span>
        </div>
    );
}

function ScoreCell({ score }: { score: number }) {
    const textColor =
        score >= 80
            ? 'text-emerald-600'
            : score >= 60
              ? 'text-amber-600'
              : 'text-red-600';
    return (
        <td className="whitespace-nowrap px-4 py-3 text-center">
            <span className={`text-sm font-medium ${textColor}`}>{score}</span>
        </td>
    );
}

// -- Main Page Component ----------------------------------------------------

export default function SecurityPosture() {
    const { selectedTenant, isFiltered } = useTenantScope();
    const { posture, trend, loading, trendLoading } = usePostureData();
    const { generating, generateReport } = usePdfReport();

    // Tenant table sort state
    const [sortColumn, setSortColumn] = useState<SortColumn>('composite_score');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (col: SortColumn) => {
        if (sortColumn === col) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(col);
            setSortDirection('desc');
        }
    };

    // Build a pillar score map for quick lookup
    const pillarScoreMap = useMemo(() => {
        const map: Record<string, number> = {};
        if (posture?.pillars) {
            for (const p of posture.pillars) {
                map[p.key] = p.score;
            }
        }
        return map;
    }, [posture]);

    // Sorted tenants
    const sortedTenants = useMemo(() => {
        if (!posture?.tenants) return [];
        return [...posture.tenants].sort((a, b) => {
            const aVal = a[sortColumn as keyof TenantPosture];
            const bVal = b[sortColumn as keyof TenantPosture];
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
            return sortDirection === 'asc'
                ? (aVal as number) - (bVal as number)
                : (bVal as number) - (aVal as number);
        });
    }, [posture, sortColumn, sortDirection]);

    const handlePdfExport = async () => {
        if (!posture) return;
        const statsData = [
            { label: 'Overall Score', value: posture.overall_score },
            ...PILLAR_KEYS.map((key) => ({
                label: PILLAR_CONFIG[key].label,
                value: pillarScoreMap[key] ?? 0,
            })),
        ];
        await generateReport({
            title: 'Security Posture',
            subtitle: isFiltered && selectedTenant ? selectedTenant.customer_name : 'All Tenants',
            orientation: 'landscape',
            sections: [
                { type: 'stats', data: statsData },
                { type: 'chart', elementId: 'posture-gauges', title: 'Posture Gauges' },
                { type: 'chart', elementId: 'posture-trend-chart', title: 'Security Score Trend' },
                {
                    type: 'table',
                    title: 'Tenant Comparison',
                    headers: ['Tenant', 'Composite', 'Identity', 'Device', 'App', 'Security', 'Governance', 'Integration'],
                    rows: (posture.tenants ?? []).map((t) => [
                        t.customer_name,
                        String(t.composite_score),
                        String(t.identity),
                        String(t.device),
                        String(t.app),
                        String(t.security),
                        String(t.governance),
                        String(t.integration),
                    ]),
                },
            ],
        });
    };

    // -- Loading state ------------------------------------------------------

    if (loading) {
        return (
            <AppLayout title="Security Posture">
                <PageHeader
                    title="Security Posture"
                    subtitle="Security posture assessment"
                    breadcrumbs={[
                        { label: 'Security & Compliance', href: '/security' },
                        { label: 'Posture' },
                    ]}
                    actions={<ExportButton csvEndpoint="/api/v1/reports/security-posture" onExportPdf={handlePdfExport} pdfGenerating={generating} />}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    <SkeletonLoader variant="stat-card" count={6} className="contents" />
                </div>
                <SkeletonLoader variant="chart" count={2} />
            </AppLayout>
        );
    }

    // -- No data state ------------------------------------------------------

    if (!posture) {
        return (
            <AppLayout title="Security Posture">
                <PageHeader
                    title="Security Posture"
                    subtitle="Security posture assessment"
                    breadcrumbs={[
                        { label: 'Security & Compliance', href: '/security' },
                        { label: 'Posture' },
                    ]}
                    actions={<ExportButton csvEndpoint="/api/v1/reports/security-posture" onExportPdf={handlePdfExport} pdfGenerating={generating} />}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    Unable to load security posture data. Please try again later.
                </div>
            </AppLayout>
        );
    }

    // -- Render -------------------------------------------------------------

    return (
        <AppLayout title="Security Posture">
            <PageHeader
                title="Security Posture"
                subtitle={
                    isFiltered
                        ? 'Security posture assessment'
                        : 'Security posture across all tenants'
                }
                breadcrumbs={[
                    { label: 'Security & Compliance', href: '/security' },
                    { label: 'Posture' },
                ]}
                actions={<ExportButton csvEndpoint="/api/v1/reports/security-posture" onExportPdf={handlePdfExport} pdfGenerating={generating} />}
            />

            {/* -- ROW 1: Radial Gauge Cluster --------------------------------- */}
            <div id="posture-gauges" className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
                    {/* Main overall gauge */}
                    <div className="flex flex-col items-center">
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Overall Posture
                        </h3>
                        <RadialGauge score={posture.overall_score} size={180} />
                    </div>

                    {/* Pillar gauges */}
                    <div className="grid grid-cols-3 gap-6 md:grid-cols-6">
                        {PILLAR_KEYS.map((key) => (
                            <RadialGauge
                                key={key}
                                score={pillarScoreMap[key] ?? 0}
                                size={120}
                                label={PILLAR_CONFIG[key].label}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* -- ROW 2: Pillar Breakdown Accordions -------------------------- */}
            <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {PILLAR_KEYS.map((key) => (
                    <PillarBreakdown
                        key={key}
                        pillarKey={key}
                        score={pillarScoreMap[key] ?? 0}
                    />
                ))}
            </div>

            {/* -- ROW 3: Score Trend Chart ------------------------------------- */}
            <div className="mb-6" id="posture-trend-chart">
                <ChartCard
                    title="Security Score Trend"
                    subtitle="Score progression over time"
                >
                    {trendLoading ? (
                        <div className="flex h-[300px] items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
                        </div>
                    ) : trend && trend.trend.length > 0 ? (
                        <div>
                            {/* Change indicator badges */}
                            <div className="mb-4 flex flex-wrap gap-3">
                                {(
                                    [
                                        'composite',
                                        'identity',
                                        'device',
                                        'app',
                                        'security',
                                        'governance',
                                        'integration',
                                    ] as const
                                ).map((key) => {
                                    const val = trend.change[key];
                                    return (
                                        <span
                                            key={key}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs"
                                        >
                                            <span
                                                className="h-2 w-2 rounded-full"
                                                style={{
                                                    backgroundColor: TREND_COLORS[key],
                                                }}
                                            />
                                            <span className="font-medium text-slate-600">
                                                {TREND_LABELS[key]}
                                            </span>
                                            <span
                                                className={
                                                    val >= 0
                                                        ? 'font-semibold text-emerald-600'
                                                        : 'font-semibold text-red-600'
                                                }
                                            >
                                                {val >= 0 ? '+' : ''}
                                                {val} pts
                                            </span>
                                        </span>
                                    );
                                })}
                            </div>

                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={trend.trend}>
                                    <defs>
                                        <linearGradient
                                            id="compositeGradient"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#3b82f6"
                                                stopOpacity={0.2}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#3b82f6"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(v: string) =>
                                            new Date(v).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                            })
                                        }
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (!active || !payload?.length) return null;
                                            return (
                                                <div className="rounded-lg border bg-white px-3 py-2 shadow-lg text-xs">
                                                    <p className="font-semibold text-slate-800 mb-1">
                                                        {new Date(label).toLocaleDateString(
                                                            undefined,
                                                            {
                                                                month: 'long',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            },
                                                        )}
                                                    </p>
                                                    {payload.map((p) => (
                                                        <p
                                                            key={p.dataKey}
                                                            className="text-slate-600"
                                                        >
                                                            <span
                                                                className="inline-block h-2 w-2 rounded-full mr-1"
                                                                style={{
                                                                    backgroundColor: p.color,
                                                                }}
                                                            />
                                                            {p.name}:{' '}
                                                            <span className="font-bold">
                                                                {typeof p.value === 'number'
                                                                    ? p.value.toFixed(1)
                                                                    : p.value}
                                                            </span>
                                                        </p>
                                                    ))}
                                                </div>
                                            );
                                        }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="composite"
                                        name="Composite"
                                        stroke="#3b82f6"
                                        strokeWidth={2.5}
                                        fill="url(#compositeGradient)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="identity"
                                        name="Identity"
                                        stroke="#8b5cf6"
                                        strokeWidth={1.5}
                                        fill="none"
                                        strokeDasharray="4 2"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="device"
                                        name="Device"
                                        stroke="#06b6d4"
                                        strokeWidth={1.5}
                                        fill="none"
                                        strokeDasharray="4 2"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="app"
                                        name="Application"
                                        stroke="#f59e0b"
                                        strokeWidth={1.5}
                                        fill="none"
                                        strokeDasharray="4 2"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="security"
                                        name="Security"
                                        stroke="#ef4444"
                                        strokeWidth={1.5}
                                        fill="none"
                                        strokeDasharray="4 2"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="governance"
                                        name="Governance"
                                        stroke="#10b981"
                                        strokeWidth={1.5}
                                        fill="none"
                                        strokeDasharray="4 2"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="integration"
                                        name="Integration"
                                        stroke="#64748b"
                                        strokeWidth={1.5}
                                        fill="none"
                                        strokeDasharray="4 2"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                            No historical data available yet.
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* -- ROW 4: Tenant Comparison Table ------------------------------- */}
            {!isFiltered && posture.tenants.length > 0 && (
                <div className="mb-6">
                    <SectionHeader title="Tenant Comparison" />
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <SortableHeader
                                            label="Tenant"
                                            column="customer_name"
                                            currentSort={sortColumn}
                                            currentDirection={sortDirection}
                                            onSort={handleSort}
                                        />
                                        <SortableHeader
                                            label="Composite"
                                            column="composite_score"
                                            currentSort={sortColumn}
                                            currentDirection={sortDirection}
                                            onSort={handleSort}
                                        />
                                        <SortableHeader
                                            label="Identity"
                                            column="identity"
                                            currentSort={sortColumn}
                                            currentDirection={sortDirection}
                                            onSort={handleSort}
                                        />
                                        <SortableHeader
                                            label="Device"
                                            column="device"
                                            currentSort={sortColumn}
                                            currentDirection={sortDirection}
                                            onSort={handleSort}
                                        />
                                        <SortableHeader
                                            label="App"
                                            column="app"
                                            currentSort={sortColumn}
                                            currentDirection={sortDirection}
                                            onSort={handleSort}
                                        />
                                        <SortableHeader
                                            label="Security"
                                            column="security"
                                            currentSort={sortColumn}
                                            currentDirection={sortDirection}
                                            onSort={handleSort}
                                        />
                                        <SortableHeader
                                            label="Governance"
                                            column="governance"
                                            currentSort={sortColumn}
                                            currentDirection={sortDirection}
                                            onSort={handleSort}
                                        />
                                        <SortableHeader
                                            label="Integration"
                                            column="integration"
                                            currentSort={sortColumn}
                                            currentDirection={sortDirection}
                                            onSort={handleSort}
                                        />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedTenants.map((tenant) => (
                                        <tr
                                            key={tenant.tenant_id}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                                                {tenant.customer_name}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <ScoreBar score={tenant.composite_score} />
                                            </td>
                                            <ScoreCell score={tenant.identity} />
                                            <ScoreCell score={tenant.device} />
                                            <ScoreCell score={tenant.app} />
                                            <ScoreCell score={tenant.security} />
                                            <ScoreCell score={tenant.governance} />
                                            <ScoreCell score={tenant.integration} />
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
