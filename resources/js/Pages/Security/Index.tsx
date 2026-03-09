import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    ShieldCheckIcon,
    ShieldExclamationIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

type SecurityData = {
    findings_by_severity: Array<{ severity: string; count: number }>;
    findings_by_category: Array<{ category: string; count: number }>;
    score_distribution: Array<{
        tenant_id: string;
        customer_name: string;
        security_posture: number;
        composite_score: number;
    }>;
    gdap_coverage: { active: number; expired: number; unknown: number; total: number };
};

const SEVERITY_COLORS: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#3b82f6',
};

const GDAP_COLORS = ['#10b981', '#ef4444', '#94a3b8'];

export default function SecurityIndex() {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [data, setData] = useState<SecurityData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(buildUrl('/api/v1/dashboard/security'))
            .then((r) => r.json())
            .then((res) => {
                setData(res.success ? res.data : null);
                setLoading(false);
            });
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const d = data!;
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

    return (
        <AppLayout title="Security Dashboard">
            <PageHeader
                title="Security & Compliance"
                subtitle="Security posture, findings, and GDAP coverage"
                breadcrumbs={[{ label: 'Security & Compliance' }, { label: 'Security' }]}
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

            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <ChartCard title="Findings by Severity" className="lg:col-span-4">
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

                <ChartCard title="Findings by Category" className="lg:col-span-4">
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

                <ChartCard title="GDAP Coverage" className="lg:col-span-4">
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
