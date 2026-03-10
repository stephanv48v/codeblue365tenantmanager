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
import { useCopilotAudit } from './hooks/useCopilotAudit';
import type { AuditCheck, AuditCategory, AuditAction } from './hooks/useCopilotAudit';
import {
    ShieldCheckIcon,
    LockClosedIcon,
    ServerStackIcon,
    ChatBubbleLeftRightIcon,
    ComputerDesktopIcon,
    CpuChipIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ClipboardDocumentCheckIcon,
    ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

// ── Category Icons & Colors ─────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, {
    icon: typeof ShieldCheckIcon;
    color: string;
    bgColor: string;
    textColor: string;
}> = {
    identity_auth: {
        icon: ShieldCheckIcon,
        color: '#3b82f6',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
    },
    compliance: {
        icon: LockClosedIcon,
        color: '#8b5cf6',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-600',
    },
    sharepoint: {
        icon: ServerStackIcon,
        color: '#06b6d4',
        bgColor: 'bg-cyan-50',
        textColor: 'text-cyan-600',
    },
    teams: {
        icon: ChatBubbleLeftRightIcon,
        color: '#f59e0b',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
    },
    devices: {
        icon: ComputerDesktopIcon,
        color: '#10b981',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
    },
    power_platform: {
        icon: CpuChipIcon,
        color: '#ef4444',
        bgColor: 'bg-red-50',
        textColor: 'text-red-600',
    },
};

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

function scoreColor(pct: number): string {
    if (pct >= 80) return '#10b981';
    if (pct >= 60) return '#f59e0b';
    return '#ef4444';
}

function scoreAccent(pct: number): 'emerald' | 'amber' | 'red' {
    if (pct >= 80) return 'emerald';
    if (pct >= 60) return 'amber';
    return 'red';
}

// ── Category Overview Card ──────────────────────────────────────────────────

function CategoryCard({ category, onClick }: { category: AuditCategory; onClick: () => void }) {
    const config = CATEGORY_CONFIG[category.key] ?? CATEGORY_CONFIG.identity_auth;
    const Icon = config.icon;
    const total = category.checks_pass + category.checks_warn + category.checks_fail;
    const passWidth = total > 0 ? (category.checks_pass / total) * 100 : 0;
    const warnWidth = total > 0 ? (category.checks_warn / total) * 100 : 0;
    const failWidth = total > 0 ? (category.checks_fail / total) * 100 : 0;

    return (
        <button
            onClick={onClick}
            className="rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:shadow-md hover:border-slate-300"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bgColor} ${config.textColor}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{category.name}</p>
                    <p className="text-xs text-slate-400">{total} checks</p>
                </div>
            </div>

            {/* Score */}
            <div className="flex items-baseline gap-2 mb-3">
                <span
                    className="text-2xl font-bold"
                    style={{ color: scoreColor(category.score_pct) }}
                >
                    {category.score_pct}%
                </span>
                <span className="text-xs text-slate-400">score</span>
            </div>

            {/* Pass / Warn / Fail bar */}
            <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
                {passWidth > 0 && (
                    <div className="bg-emerald-500" style={{ width: `${passWidth}%` }} />
                )}
                {warnWidth > 0 && (
                    <div className="bg-amber-500" style={{ width: `${warnWidth}%` }} />
                )}
                {failWidth > 0 && (
                    <div className="bg-red-500" style={{ width: `${failWidth}%` }} />
                )}
            </div>

            {/* Counts */}
            <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {category.checks_pass} pass
                </span>
                <span className="flex items-center gap-1 text-xs text-amber-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {category.checks_warn} warn
                </span>
                <span className="flex items-center gap-1 text-xs text-red-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    {category.checks_fail} fail
                </span>
            </div>
        </button>
    );
}

// ── Check Row with expandable remediation ───────────────────────────────────

function AuditCheckRow({ check }: { check: AuditCheck }) {
    const [expanded, setExpanded] = useState(false);

    const statusIcon =
        check.status === 'pass' ? (
            <CheckCircleIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
        ) : check.status === 'warning' ? (
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
        ) : (
            <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
        );

    const badgeVariant: 'success' | 'warning' | 'critical' =
        check.status === 'pass' ? 'success' : check.status === 'warning' ? 'warning' : 'critical';

    return (
        <div className="rounded-lg border border-slate-100 bg-white overflow-hidden transition-all duration-200">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
            >
                {statusIcon}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{check.name}</p>
                    <p className="text-xs text-slate-400 truncate">{check.detail}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-mono text-slate-500">{check.value}</span>
                    <span className="text-xs text-slate-300">/</span>
                    <span className="text-xs font-mono text-slate-400">{check.target}</span>
                </div>
                <StatusBadge
                    variant={badgeVariant}
                    label={check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                    size="sm"
                />
                {expanded ? (
                    <ChevronUpIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                ) : (
                    <ChevronDownIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                )}
            </button>
            {expanded && check.remediation && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Remediation</p>
                    <p className="text-sm text-slate-600">{check.remediation}</p>
                </div>
            )}
        </div>
    );
}

// ── Category Detail Section (collapsible) ───────────────────────────────────

function CategorySection({ category, defaultOpen = false }: { category: AuditCategory; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    const config = CATEGORY_CONFIG[category.key] ?? CATEGORY_CONFIG.identity_auth;
    const Icon = config.icon;
    const total = category.checks_pass + category.checks_warn + category.checks_fail;

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bgColor} ${config.textColor}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">{category.name}</p>
                        <p className="text-xs text-slate-400">
                            {total} checks &middot; Score: {category.score_pct}%
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            {category.checks_pass} pass
                        </span>
                        {category.checks_warn > 0 && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                {category.checks_warn} warn
                            </span>
                        )}
                        {category.checks_fail > 0 && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                {category.checks_fail} fail
                            </span>
                        )}
                    </div>
                    {open ? (
                        <ChevronUpIcon className="h-5 w-5 text-slate-400" />
                    ) : (
                        <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                    )}
                </div>
            </button>
            {open && (
                <div className="border-t border-slate-100 px-6 py-4 space-y-2">
                    {category.checks.map((check) => (
                        <AuditCheckRow key={check.id} check={check} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Action Item Row ─────────────────────────────────────────────────────────

function ActionRow({ action, index }: { action: AuditAction; index: number }) {
    const [expanded, setExpanded] = useState(false);

    const statusIcon =
        action.status === 'fail' ? (
            <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
        ) : (
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
        );

    return (
        <div className="rounded-lg border border-slate-100 bg-white overflow-hidden transition-all duration-200">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
            >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {index + 1}
                </span>
                {statusIcon}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{action.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                        <span className="font-medium">{action.category}</span> &middot; {action.detail}
                    </p>
                </div>
                <StatusBadge
                    variant={action.status === 'fail' ? 'critical' : 'warning'}
                    label={action.status === 'fail' ? 'Fail' : 'Warning'}
                    size="sm"
                />
                {expanded ? (
                    <ChevronUpIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                ) : (
                    <ChevronDownIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                )}
            </button>
            {expanded && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Remediation</p>
                    <p className="text-sm text-slate-600">{action.remediation}</p>
                </div>
            )}
        </div>
    );
}

// ── Custom Tooltip ──────────────────────────────────────────────────────────

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border bg-white px-3 py-2 shadow-lg text-xs">
            <p className="font-semibold text-slate-800 mb-1">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} className="text-slate-600">
                    <span className="inline-block h-2 w-2 rounded-full mr-1" style={{ backgroundColor: p.color }} />
                    {p.dataKey === 'score_pct' ? 'Score' : p.dataKey}: <span className="font-bold">{p.value}%</span>
                </p>
            ))}
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function CopilotAudit() {
    const { data, loading } = useCopilotAudit();
    const { generating, generateReport } = usePdfReport();

    // Expanded category tracking for scroll-to on card click
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const handleCategoryClick = (key: string) => {
        setExpandedCategory(key);
        // Scroll to the detail section
        setTimeout(() => {
            const el = document.getElementById(`audit-category-${key}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Chart data
    const categoryBarData = useMemo(() => {
        if (!data) return [];
        return data.categories.map((cat) => ({
            name: cat.name.length > 18 ? cat.name.substring(0, 16) + '...' : cat.name,
            fullName: cat.name,
            score_pct: cat.score_pct,
            fill: scoreColor(cat.score_pct),
        }));
    }, [data]);

    const statusPieData = useMemo(() => {
        if (!data) return [];
        return [
            { name: 'Pass', value: data.summary.total_pass },
            { name: 'Warning', value: data.summary.total_warn },
            { name: 'Fail', value: data.summary.total_fail },
        ].filter((d) => d.value > 0);
    }, [data]);

    // PDF handler
    const handlePdfExport = async () => {
        if (!data) return;
        const s = data.summary;

        const tableSections = data.categories.map((cat) => ({
            type: 'table' as const,
            title: cat.name,
            headers: ['Check', 'Status', 'Value', 'Target', 'Detail', 'Remediation'],
            rows: cat.checks.map((c) => [
                c.name,
                c.status.charAt(0).toUpperCase() + c.status.slice(1),
                c.value,
                c.target,
                c.detail,
                c.remediation,
            ]),
        }));

        await generateReport({
            title: 'Copilot Audit Report',
            subtitle: 'Comprehensive Microsoft 365 Copilot readiness assessment',
            orientation: 'landscape',
            sections: [
                {
                    type: 'stats',
                    data: [
                        { label: 'Overall Score', value: `${s.overall_pct}%` },
                        { label: 'Total Checks', value: s.total_checks },
                        { label: 'Passed', value: s.total_pass },
                        { label: 'Warnings', value: s.total_warn },
                        { label: 'Failed', value: s.total_fail },
                        { label: 'Categories', value: data.categories.length },
                    ],
                },
                { type: 'chart', elementId: 'audit-category-scores-chart', title: 'Category Scores' },
                { type: 'chart', elementId: 'audit-status-pie-chart', title: 'Check Status Distribution' },
                ...tableSections,
            ],
        });
    };

    // ── Loading ─────────────────────────────────────────────────────────

    if (loading) {
        return (
            <AppLayout title="Copilot Audit">
                <PageHeader
                    title="Copilot Audit"
                    subtitle="Comprehensive Microsoft 365 Copilot readiness assessment"
                    breadcrumbs={[{ label: 'Copilot', href: '/copilot' }, { label: 'Audit' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
                <SkeletonLoader variant="chart" count={2} />
            </AppLayout>
        );
    }

    if (!data) {
        return (
            <AppLayout title="Copilot Audit">
                <PageHeader
                    title="Copilot Audit"
                    subtitle="Comprehensive Microsoft 365 Copilot readiness assessment"
                    breadcrumbs={[{ label: 'Copilot', href: '/copilot' }, { label: 'Audit' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    Unable to load audit data. Please try again later.
                </div>
            </AppLayout>
        );
    }

    const s = data.summary;

    return (
        <AppLayout title="Copilot Audit">
            <PageHeader
                title="Copilot Audit"
                subtitle="Comprehensive Microsoft 365 Copilot readiness assessment"
                breadcrumbs={[{ label: 'Copilot', href: '/copilot' }, { label: 'Audit' }]}
                actions={
                    <ExportButton
                        csvEndpoint="/api/v1/reports/copilot-audit"
                        onExportPdf={handlePdfExport}
                        pdfGenerating={generating}
                    />
                }
            />

            {/* ── ROW 1: Summary Stats ───────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatCard
                    label="Overall Score"
                    value={`${s.overall_pct}%`}
                    icon={ArrowTrendingUpIcon}
                    accentColor={scoreAccent(s.overall_pct)}
                />
                <StatCard
                    label="Total Checks"
                    value={s.total_checks}
                    icon={ClipboardDocumentCheckIcon}
                    accentColor="blue"
                />
                <StatCard
                    label="Passed"
                    value={s.total_pass}
                    icon={CheckCircleIcon}
                    accentColor="emerald"
                    subtitle={`${s.total_checks > 0 ? Math.round((s.total_pass / s.total_checks) * 100) : 0}% of checks`}
                />
                <StatCard
                    label="Warnings"
                    value={s.total_warn}
                    icon={ExclamationTriangleIcon}
                    accentColor="amber"
                    subtitle={`${s.total_checks > 0 ? Math.round((s.total_warn / s.total_checks) * 100) : 0}% of checks`}
                />
                <StatCard
                    label="Failed"
                    value={s.total_fail}
                    icon={XCircleIcon}
                    accentColor={s.total_fail > 0 ? 'red' : 'emerald'}
                    subtitle={`${s.total_checks > 0 ? Math.round((s.total_fail / s.total_checks) * 100) : 0}% of checks`}
                />
            </div>

            {/* ── ROW 2: Category Overview Cards ─────────────────────────────── */}
            <div className="mb-6">
                <SectionHeader
                    title="Audit Categories"
                    subtitle="Click a category to jump to its detailed checks"
                />
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {data.categories.map((cat) => (
                        <CategoryCard
                            key={cat.key}
                            category={cat}
                            onClick={() => handleCategoryClick(cat.key)}
                        />
                    ))}
                </div>
            </div>

            {/* ── ROW 3: Charts ──────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <ChartCard
                    title="Category Scores"
                    subtitle="Pass rate by audit category"
                    className="lg:col-span-7"
                    id="audit-category-scores-chart"
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={categoryBarData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickFormatter={(v: number) => `${v}%`}
                            />
                            <Tooltip content={<BarTooltip />} />
                            <Bar dataKey="score_pct" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                {categoryBarData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Check Distribution"
                    subtitle="Pass / Warning / Fail breakdown"
                    className="lg:col-span-5"
                    id="audit-status-pie-chart"
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={statusPieData}
                                cx="50%"
                                cy="45%"
                                innerRadius={60}
                                outerRadius={90}
                                dataKey="value"
                                nameKey="name"
                                paddingAngle={3}
                                strokeWidth={0}
                            >
                                {statusPieData.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i]} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.[0]) return null;
                                    const p = payload[0].payload as { name: string; value: number };
                                    return (
                                        <div className="rounded-lg border bg-white px-3 py-2 shadow-lg text-xs">
                                            <p className="font-semibold text-slate-800">{p.name}</p>
                                            <p className="text-slate-600">{p.value} checks</p>
                                        </div>
                                    );
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                iconSize={8}
                                formatter={(value: string) => (
                                    <span className="text-xs text-slate-600">{value}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* ── ROW 4: Priority Actions ────────────────────────────────────── */}
            {data.top_actions.length > 0 && (
                <div className="mb-6">
                    <SectionHeader
                        title="Priority Actions"
                        subtitle="Top items requiring attention, sorted by impact"
                    />
                    <div className="space-y-2">
                        {data.top_actions.map((action, i) => (
                            <ActionRow key={action.id} action={action} index={i} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── ROW 5: Detailed Category Sections ──────────────────────────── */}
            <div className="mb-6">
                <SectionHeader
                    title="Detailed Audit Results"
                    subtitle="Expand each category to review individual checks and remediation guidance"
                />
                <div className="space-y-3">
                    {data.categories.map((cat) => (
                        <div key={cat.key} id={`audit-category-${cat.key}`}>
                            <CategorySection
                                category={cat}
                                defaultOpen={expandedCategory === cat.key}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
