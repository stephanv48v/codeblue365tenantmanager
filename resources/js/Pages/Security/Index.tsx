import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { useSecurityData } from './hooks/useSecurityData';
import { usePdfReport } from '../../hooks/usePdfReport';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    ShieldCheckIcon,
    ShieldExclamationIcon,
    ClockIcon,
    ArrowTrendingUpIcon,
    ClipboardDocumentCheckIcon,
    LightBulbIcon,
    ChartBarSquareIcon,
} from '@heroicons/react/24/outline';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    AreaChart, Area, CartesianGrid,
} from 'recharts';
import { router } from '@inertiajs/react';

const SEVERITY_COLORS: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#3b82f6',
};

const GDAP_COLORS = ['#10b981', '#ef4444', '#94a3b8'];

export default function SecurityIndex() {
    const { security, scoreTrend, loading, trendLoading } = useSecurityData();
    const { generating, generateReport } = usePdfReport();
    const { selectedTenant, isFiltered } = useTenantScope();

    if (loading) {
        return (
            <AppLayout title="Security Dashboard">
                <PageHeader title="Security & Compliance" subtitle="Security posture across all tenants" />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = security!;
    const totalFindings = d.findings_by_severity.reduce((s, v) => s + v.count, 0);
    const criticalCount = d.findings_by_severity.find((s) => s.severity === 'critical')?.count ?? 0;
    const highCount = d.findings_by_severity.find((s) => s.severity === 'high')?.count ?? 0;

    const severityChartData = d.findings_by_severity.map((s) => ({
        name: s.severity.charAt(0).toUpperCase() + s.severity.slice(1),
        value: s.count,
        fill: SEVERITY_COLORS[s.severity] ?? '#94a3b8',
    }));

    const categoryChartData = d.findings_by_category.map((c) => ({
        name: c.category.replace(/_/g, ' '),
        count: c.count,
    }));

    const gdapData = [
        { name: 'Active', value: d.gdap_coverage.active ?? 0, fill: GDAP_COLORS[0] },
        { name: 'Expired', value: d.gdap_coverage.expired ?? 0, fill: GDAP_COLORS[1] },
        { name: 'Unknown', value: d.gdap_coverage.unknown ?? 0, fill: GDAP_COLORS[2] },
    ].filter((d) => d.value > 0);

    const handlePdfExport = async () => {
        await generateReport({
            title: 'Security Dashboard',
            subtitle: isFiltered && selectedTenant ? selectedTenant.customer_name : 'All Tenants',
            orientation: 'landscape',
            sections: [
                {
                    type: 'stats',
                    data: [
                        { label: 'Open Findings', value: totalFindings },
                        { label: 'Critical', value: criticalCount },
                        { label: 'High', value: highCount },
                        { label: 'GDAP Active', value: d.gdap_coverage.active ?? 0 },
                        { label: 'GDAP Expiring', value: d.gdap_coverage.expired ?? 0 },
                    ],
                },
                { type: 'chart', elementId: 'security-score-trend', title: 'Composite Score Trend' },
                { type: 'chart', elementId: 'security-severity-chart', title: 'Findings by Severity' },
                { type: 'chart', elementId: 'security-category-chart', title: 'Findings by Category' },
                { type: 'chart', elementId: 'security-gdap-chart', title: 'GDAP Coverage' },
                {
                    type: 'table',
                    title: 'Tenant Security Rankings',
                    headers: ['Tenant', 'Security Posture', 'Composite'],
                    rows: d.score_distribution.map((s) => [
                        s.customer_name,
                        String(s.security_posture),
                        String(s.composite_score),
                    ]),
                },
            ],
        });
    };

    return (
        <AppLayout title="Security Dashboard">
            <PageHeader
                title="Security & Compliance"
                subtitle="Security posture, findings, and GDAP coverage"
                breadcrumbs={[{ label: 'Security & Compliance' }, { label: 'Security' }]}
                actions={<ExportButton csvEndpoint="/api/v1/reports/findings" onExportPdf={handlePdfExport} pdfGenerating={generating} />}
            />

            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-5">
                <StatCard label="Open Findings" value={totalFindings} icon={ShieldExclamationIcon} accentColor="red" href="/findings" />
                <StatCard label="Critical" value={criticalCount} accentColor="red" />
                <StatCard label="High" value={highCount} accentColor="amber" />
                <StatCard label="GDAP Active" value={d.gdap_coverage.active ?? 0} icon={ShieldCheckIcon} accentColor="emerald" />
                <StatCard
                    label="GDAP Expiring"
                    value={d.gdap_coverage.expired ?? 0}
                    icon={ClockIcon}
                    accentColor={d.gdap_coverage.expired > 0 ? 'red' : 'emerald'}
                />
            </div>

            {/* Quick Actions */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <button onClick={() => router.visit('/security/posture')} className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                        <ChartBarSquareIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">Security Posture</p>
                        <p className="text-xs text-slate-400">Pillar scores & trend analysis</p>
                    </div>
                </button>
                <button onClick={() => router.visit('/security/recommendations')} className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100">
                        <LightBulbIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">Recommendations</p>
                        <p className="text-xs text-slate-400">Prioritised action items</p>
                    </div>
                </button>
                <button onClick={() => router.visit('/security/compliance')} className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100">
                        <ClipboardDocumentCheckIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">Compliance</p>
                        <p className="text-xs text-slate-400">Framework compliance mapping</p>
                    </div>
                </button>
            </div>

            {/* Score Trend */}
            {scoreTrend.length > 0 && (
                <div className="mb-6" id="security-score-trend">
                    <ChartCard title="Composite Score Trend" subtitle="Average composite score over time">
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={scoreTrend}>
                                <defs>
                                    <linearGradient id="compositeGradient" x1="0" y1="0" x2="0" y2="1">
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
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        return (
                                            <div className="rounded-lg border bg-white px-3 py-2 shadow-lg text-xs">
                                                <p className="font-semibold text-slate-800">{new Date(label).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
                                                <p className="text-slate-600">Score: <span className="font-bold">{Number(payload[0].value).toFixed(1)}</span></p>
                                            </div>
                                        );
                                    }}
                                />
                                <Area type="monotone" dataKey="composite" stroke="#3b82f6" strokeWidth={2} fill="url(#compositeGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}

            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <div id="security-severity-chart" className="lg:col-span-4">
                    <ChartCard title="Findings by Severity">
                        {severityChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={severityChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                                        {severityChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">No open findings</div>
                        )}
                    </ChartCard>
                </div>

                <div id="security-category-chart" className="lg:col-span-4">
                    <ChartCard title="Findings by Category">
                        {categoryChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={categoryChartData} layout="vertical">
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" name="Findings" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">No open findings</div>
                        )}
                    </ChartCard>
                </div>

                <div id="security-gdap-chart" className="lg:col-span-4">
                    <ChartCard title="GDAP Coverage">
                        {gdapData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={gdapData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} label>
                                        {gdapData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">No GDAP data</div>
                        )}
                    </ChartCard>
                </div>
            </div>

            {/* Tenant Score Rankings */}
            {d.score_distribution.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h3 className="text-sm font-semibold text-slate-800">Tenant Security Rankings</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Security Posture</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Composite</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {d.score_distribution.map((s) => (
                                    <tr key={s.tenant_id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{s.customer_name}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-24 rounded-full bg-slate-100">
                                                    <div
                                                        className={`h-2 rounded-full ${s.security_posture >= 70 ? 'bg-emerald-500' : s.security_posture >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${Math.min(100, s.security_posture)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-slate-600">{s.security_posture}</span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">{s.composite_score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
