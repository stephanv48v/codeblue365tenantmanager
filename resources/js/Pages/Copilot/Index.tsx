import { useState, useMemo } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import ChartCard from '../../Components/ChartCard';
import SectionHeader from '../../Components/SectionHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { usePdfReport } from '../../hooks/usePdfReport';
import { useCopilotData } from './hooks/useCopilotData';
import type { ReadinessCheck, ActionItem } from './hooks/useCopilotData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    UsersIcon,
    ShieldCheckIcon,
    GlobeAltIcon,
    LockOpenIcon,
    ShareIcon,
    TagIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from '@heroicons/react/24/outline';
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
    BarChart,
    Bar,
    Cell,
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

const PILLAR_DETAILS: Record<string, {
    weight: string;
    label: string;
    formula: string;
    metrics: Array<{ label: string; weight: string; target: string }>;
}> = {
    data_exposure: {
        weight: '40%',
        label: 'Data Exposure',
        formula: '100 − (Public Sites % × 30% + Everyone Access % × 40% + External Sharing % × 30%)',
        metrics: [
            { label: 'Public Sites', weight: '30%', target: '0 sites' },
            { label: 'Everyone Access Sites', weight: '40%', target: '0 sites' },
            { label: 'External Sharing Sites', weight: '30%', target: '<20% of sites' },
        ],
    },
    access_governance: {
        weight: '25%',
        label: 'Access Governance',
        formula: 'Site Ownership % × 40% + Active Sites % × 30% + (100 − Guest Access %) × 30%',
        metrics: [
            { label: 'Sites with Owners', weight: '40%', target: '100% of sites' },
            { label: 'Active Sites (90d)', weight: '30%', target: '>90% of sites' },
            { label: 'Guest Access Sites', weight: '30%', target: '<10% of sites' },
        ],
    },
    data_protection: {
        weight: '25%',
        label: 'Data Protection',
        formula: 'Sensitivity Labels % × 70% + DLP Policies × 30%',
        metrics: [
            { label: 'Sensitivity Labels Coverage', weight: '70%', target: '>80%' },
            { label: 'DLP Policies', weight: '30%', target: 'Configured' },
        ],
    },
    ai_governance: {
        weight: '10%',
        label: 'AI Governance',
        formula: 'Copilot Adoption Rate × 60% + Agent Governance × 40%',
        metrics: [
            { label: 'Copilot Adoption', weight: '60%', target: '>50%' },
            { label: 'Agent Governance Policies', weight: '40%', target: 'Configured' },
        ],
    },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string; ringColor: string }> = {
    critical: { label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-50', ringColor: 'ring-red-200' },
    high: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-50', ringColor: 'ring-orange-200' },
    medium: { label: 'Medium', color: 'text-amber-700', bgColor: 'bg-amber-50', ringColor: 'ring-amber-200' },
    low: { label: 'Low', color: 'text-emerald-700', bgColor: 'bg-emerald-50', ringColor: 'ring-emerald-200' },
};

const FUNNEL_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6'];

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

// ── Pillar Breakdown Accordion ───────────────────────────────────────────────

function PillarBreakdown({ pillarKey, score }: { pillarKey: string; score: number }) {
    const [open, setOpen] = useState(false);
    const details = PILLAR_DETAILS[pillarKey];
    if (!details) return null;

    const color = scoreColor(score);

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-200">
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ backgroundColor: color }}
                    >
                        {score}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">{details.label}</p>
                        <p className="text-xs text-slate-400">{details.weight} of overall score</p>
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
                    <p className="mb-3 text-xs text-slate-500">
                        <span className="font-medium text-slate-600">Formula:</span> {details.formula}
                    </p>
                    <div className="space-y-3">
                        {details.metrics.map((metric) => (
                            <div key={metric.label} className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-700">{metric.label}</p>
                                    <p className="text-xs text-slate-400">Weight: {metric.weight} · Target: {metric.target}</p>
                                </div>
                                <div className="h-2 w-24 rounded-full bg-slate-200">
                                    <div
                                        className="h-2 rounded-full"
                                        style={{ width: `${Math.min(score, 100)}%`, backgroundColor: color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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

// ── Action Item Row ──────────────────────────────────────────────────────────

function ActionItemRow({ item }: { item: ActionItem }) {
    const [expanded, setExpanded] = useState(false);
    const config = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.medium;

    const statusIcon =
        item.status === 'pass' ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-sm">&#10003;</span>
        ) : item.status === 'warning' ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-sm">&#9888;</span>
        ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 text-sm">&#10007;</span>
        );

    const categoryLink: Record<string, string> = {
        data_exposure: '/copilot/sharepoint',
        access_governance: '/copilot/sharepoint',
        data_protection: '/copilot/sharepoint',
        ai_governance: '/copilot/usage',
    };

    return (
        <div className="rounded-lg border border-slate-100 bg-white overflow-hidden transition-all duration-200">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
            >
                {statusIcon}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400 truncate">{item.detail}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${config.bgColor} ${config.color} ${config.ringColor}`}>
                    {config.label}
                </span>
                {item.impact_points > 0 && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                        +{item.impact_points} pts
                    </span>
                )}
                {expanded ? (
                    <ChevronUpIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                ) : (
                    <ChevronDownIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                )}
            </button>
            {expanded && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                    <p className="text-sm text-slate-600 mb-2">{item.remediation}</p>
                    <a
                        href={categoryLink[item.category] ?? '/copilot'}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                        View Details &rarr;
                    </a>
                </div>
            )}
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
    const { readiness, trend, loading, trendLoading } = useCopilotData();
    const { generating, generateReport } = usePdfReport();

    const handlePdfExport = async () => {
        if (!readiness) return;
        const d = readiness;
        await generateReport({
            title: 'Copilot Readiness Report',
            subtitle: 'Microsoft 365 Copilot readiness assessment',
            orientation: 'landscape',
            sections: [
                {
                    type: 'stats',
                    data: [
                        { label: 'Licensed Users', value: d.copilot_licensed_users },
                        { label: 'Adoption Rate', value: `${d.adoption_rate}%` },
                        { label: 'Everyone Access', value: d.sites_with_everyone_access },
                        { label: 'Public Sites', value: d.public_sites_count },
                        { label: 'External Sharing', value: d.sites_with_external_sharing },
                        { label: 'Labels Coverage', value: `${d.sensitivity_labels_applied_pct}%` },
                    ],
                },
                { type: 'chart', elementId: 'copilot-gauges', title: 'Readiness Scores' },
                { type: 'chart', elementId: 'copilot-trend-chart', title: 'Readiness Score Trend' },
                { type: 'chart', elementId: 'copilot-funnel-chart', title: 'Adoption Funnel' },
                {
                    type: 'table',
                    title: 'Readiness by Tenant',
                    headers: ['Tenant', 'Overall', 'Data Exposure', 'Access Gov.', 'Data Protection', 'AI Governance', 'Licensed', 'Active'],
                    rows: (d.readiness_by_tenant ?? []).map((t) => [
                        t.customer_name,
                        t.overall_score,
                        t.data_exposure_score,
                        t.access_governance_score,
                        t.data_protection_score,
                        t.ai_governance_score,
                        t.copilot_licensed_users,
                        t.copilot_active_users,
                    ]),
                },
            ],
        });
    };

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

    const sortedActionItems = useMemo(() => {
        return readiness?.action_items ?? [];
    }, [readiness]);

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
                actions={<ExportButton csvEndpoint="/api/v1/reports/copilot-usage" onExportPdf={handlePdfExport} pdfGenerating={generating} />}
            />

            {/* ── ROW 1: Overall Readiness Score ────────────────────────────── */}
            <div id="copilot-gauges" className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
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

            {/* ── ROW 1.5: Score Breakdown ────────────────────────────────── */}
            <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {pillars.map((pillar) => {
                    const key = pillar.label.toLowerCase().replace(/ /g, '_');
                    return <PillarBreakdown key={key} pillarKey={key} score={pillar.score} />;
                })}
            </div>

            {/* ── ROW 1.75: Score Trend ──────────────────────────────────── */}
            <div className="mb-6">
                <ChartCard
                    title="Readiness Score Trend"
                    subtitle="Score progression over the last 90 days"
                    id="copilot-trend-chart"
                >
                    {trendLoading ? (
                        <div className="flex h-[300px] items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
                        </div>
                    ) : trend && trend.trend.length > 0 ? (
                        <div>
                            {/* Change indicators */}
                            <div className="mb-4 flex flex-wrap gap-3">
                                {(['overall', 'data_exposure', 'access_governance', 'data_protection', 'ai_governance'] as const).map((key) => {
                                    const val = trend.change[key];
                                    const labels: Record<string, string> = {
                                        overall: 'Overall',
                                        data_exposure: 'Data Exposure',
                                        access_governance: 'Access Gov.',
                                        data_protection: 'Data Protection',
                                        ai_governance: 'AI Governance',
                                    };
                                    const colors: Record<string, string> = {
                                        overall: '#3b82f6',
                                        data_exposure: '#ef4444',
                                        access_governance: '#f59e0b',
                                        data_protection: '#8b5cf6',
                                        ai_governance: '#10b981',
                                    };
                                    return (
                                        <span key={key} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[key] }} />
                                            <span className="font-medium text-slate-600">{labels[key]}</span>
                                            <span className={val >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>
                                                {val >= 0 ? '+' : ''}{val} pts
                                            </span>
                                        </span>
                                    );
                                })}
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={trend.trend}>
                                    <defs>
                                        <linearGradient id="overallGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(v: string) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
                                                        {new Date(label).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                    {payload.map((p) => (
                                                        <p key={p.dataKey} className="text-slate-600">
                                                            <span className="inline-block h-2 w-2 rounded-full mr-1" style={{ backgroundColor: p.color }} />
                                                            {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
                                                        </p>
                                                    ))}
                                                </div>
                                            );
                                        }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="overall" name="Overall" stroke="#3b82f6" strokeWidth={2.5} fill="url(#overallGradient)" />
                                    <Area type="monotone" dataKey="data_exposure" name="Data Exposure" stroke="#ef4444" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                                    <Area type="monotone" dataKey="access_governance" name="Access Gov." stroke="#f59e0b" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                                    <Area type="monotone" dataKey="data_protection" name="Data Protection" stroke="#8b5cf6" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                                    <Area type="monotone" dataKey="ai_governance" name="AI Governance" stroke="#10b981" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
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

            {/* ── ROW 3: Action Items ────────────────────────────────────── */}
            <div className="mb-6">
                <SectionHeader title="Action Items" subtitle="Prioritised recommendations to improve your readiness score" />
                <div className="space-y-2">
                    {sortedActionItems.map((item) => (
                        <ActionItemRow key={item.id} item={item} />
                    ))}
                    {sortedActionItems.length === 0 && (
                        <div className="flex h-32 items-center justify-center rounded-lg border border-slate-100 bg-white text-sm text-slate-400">
                            No action items available.
                        </div>
                    )}
                </div>
            </div>

            {/* ── ROW 3.5: License Optimization ──────────────────────────── */}
            {d.license_insights && (
                <div className="mb-6">
                    <SectionHeader
                        title="License Optimization"
                        subtitle="Copilot license utilisation and cost insights"
                        href="/copilot/usage"
                        linkText="View Usage Details"
                    />
                    <div className="grid gap-6 lg:grid-cols-12">
                        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                            <StatCard
                                label="Inactive Licensed"
                                value={d.license_insights.inactive_licensed}
                                icon={UsersIcon}
                                accentColor={d.license_insights.inactive_licensed > 0 ? 'amber' : 'emerald'}
                                subtitle="No activity in 30 days"
                            />
                            <StatCard
                                label="Est. Monthly Waste"
                                value={`$${d.license_insights.estimated_monthly_waste.toLocaleString()}`}
                                icon={TagIcon}
                                accentColor={d.license_insights.estimated_monthly_waste > 0 ? 'red' : 'emerald'}
                                subtitle="@ $30/user/month"
                            />
                            <StatCard
                                label="Power Users"
                                value={d.license_insights.power_users}
                                icon={UsersIcon}
                                accentColor="emerald"
                                subtitle="3+ apps active"
                            />
                            <StatCard
                                label="Never Used"
                                value={d.license_insights.never_used}
                                icon={UsersIcon}
                                accentColor={d.license_insights.never_used > 0 ? 'red' : 'emerald'}
                                subtitle="Licensed, no activity ever"
                            />
                        </div>
                        <ChartCard title="Adoption Funnel" subtitle="License utilisation breakdown" className="lg:col-span-7" id="copilot-funnel-chart">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={d.license_insights.adoption_funnel} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                                    <YAxis
                                        dataKey="stage"
                                        type="category"
                                        width={110}
                                        tick={{ fontSize: 12, fill: '#475569' }}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.[0]) return null;
                                            const p = payload[0].payload as { stage: string; count: number };
                                            return (
                                                <div className="rounded-lg border bg-white px-3 py-2 shadow-lg text-xs">
                                                    <p className="font-semibold text-slate-800">{p.stage}</p>
                                                    <p className="text-slate-600">{p.count} users</p>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                        {d.license_insights.adoption_funnel.map((_, i) => (
                                            <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                </div>
            )}

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
