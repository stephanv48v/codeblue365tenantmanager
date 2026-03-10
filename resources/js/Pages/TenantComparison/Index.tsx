import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import SectionHeader from '../../Components/SectionHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { useTenantComparisonData, type FleetAverages, type TenantBenchmark } from './hooks/useTenantComparisonData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { ChartBarSquareIcon } from '@heroicons/react/24/outline';
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

const METRICS: { key: keyof TenantBenchmark; label: string }[] = [
    { key: 'secure_score', label: 'Secure Score' },
    { key: 'mfa_coverage', label: 'MFA Coverage' },
    { key: 'device_compliance', label: 'Device Compliance' },
    { key: 'copilot_adoption', label: 'Copilot Adoption' },
    { key: 'conditional_access_policies', label: 'CA Policies' },
    { key: 'admin_mfa_coverage', label: 'Admin MFA' },
    { key: 'license_utilization', label: 'License Util.' },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#64748b', '#ec4899'];

function ComparisonCell({ value, average }: { value: number; average: number }) {
    const isAbove = value >= average;
    const textColor = isAbove ? 'text-emerald-600' : 'text-red-600';
    const bgColor = isAbove ? 'bg-emerald-50' : 'bg-red-50';

    return (
        <td className="whitespace-nowrap px-4 py-3 text-center">
            <span className={`inline-block rounded-md px-2 py-0.5 text-sm font-medium ${textColor} ${bgColor}`}>
                {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
            </span>
        </td>
    );
}

export default function TenantComparisonIndex() {
    const { isFiltered } = useTenantScope();
    const { data, loading, error } = useTenantComparisonData();

    if (loading) {
        return (
            <AppLayout title="Tenant Comparison">
                <PageHeader
                    title="Tenant Comparison"
                    subtitle="Benchmarking dashboard across tenants"
                    breadcrumbs={[{ label: 'Analytics' }, { label: 'Tenant Comparison' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3">
                    <SkeletonLoader variant="stat-card" count={3} className="contents" />
                </div>
                <SkeletonLoader variant="chart" count={2} />
            </AppLayout>
        );
    }

    if (!data || error) {
        return (
            <AppLayout title="Tenant Comparison">
                <PageHeader
                    title="Tenant Comparison"
                    subtitle="Benchmarking dashboard across tenants"
                    breadcrumbs={[{ label: 'Analytics' }, { label: 'Tenant Comparison' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load comparison data. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    const { fleet_averages, tenants } = data;

    // Build radar data
    const radarData = METRICS.map((m) => ({
        metric: m.label,
        fleet_avg: fleet_averages[m.key as keyof FleetAverages] ?? 0,
        ...Object.fromEntries(
            tenants.slice(0, 5).map((t) => [t.customer_name, t[m.key] ?? 0]),
        ),
    }));

    // Build bar chart data
    const barData = tenants.map((t) => ({
        name: t.customer_name.length > 15 ? t.customer_name.slice(0, 15) + '...' : t.customer_name,
        secure_score: t.secure_score,
        mfa_coverage: t.mfa_coverage,
        device_compliance: t.device_compliance,
    }));

    return (
        <AppLayout title="Tenant Comparison">
            <PageHeader
                title="Tenant Comparison"
                subtitle={isFiltered ? 'Benchmarks for selected tenant' : 'Benchmarking dashboard across all tenants'}
                breadcrumbs={[{ label: 'Analytics' }, { label: 'Tenant Comparison' }]}
                actions={<ExportButton csvEndpoint="/api/v1/tenant-comparison/compare" />}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3">
                <StatCard
                    label="Fleet Avg Secure Score"
                    value={fleet_averages.secure_score?.toFixed(1) ?? '-'}
                    icon={ChartBarSquareIcon}
                    accentColor="blue"
                />
                <StatCard
                    label="Fleet MFA Coverage"
                    value={`${fleet_averages.mfa_coverage?.toFixed(1) ?? '-'}%`}
                    accentColor="emerald"
                />
                <StatCard
                    label="Fleet Device Compliance"
                    value={`${fleet_averages.device_compliance?.toFixed(1) ?? '-'}%`}
                    accentColor="purple"
                />
            </div>

            {/* Charts */}
            <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <ChartCard title="Tenant Radar Comparison" subtitle="Top 5 tenants across key metrics">
                    <ResponsiveContainer width="100%" height={350}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Radar
                                name="Fleet Average"
                                dataKey="fleet_avg"
                                stroke="#94a3b8"
                                fill="#94a3b8"
                                fillOpacity={0.1}
                                strokeWidth={2}
                                strokeDasharray="4 2"
                            />
                            {tenants.slice(0, 5).map((t, i) => (
                                <Radar
                                    key={t.tenant_id}
                                    name={t.customer_name}
                                    dataKey={t.customer_name}
                                    stroke={COLORS[i]}
                                    fill={COLORS[i]}
                                    fillOpacity={0.05}
                                    strokeWidth={2}
                                />
                            ))}
                            <Legend />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Key Metrics by Tenant" subtitle="Secure Score, MFA, and Device Compliance">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-20} textAnchor="end" height={60} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="secure_score" name="Secure Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="mfa_coverage" name="MFA Coverage" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="device_compliance" name="Device Compliance" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Comparison Table */}
            <div className="mb-6">
                <SectionHeader title="Detailed Comparison" subtitle="Color-coded against fleet averages" />
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                    {METRICS.map((m) => (
                                        <th key={m.key} className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
                                            {m.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* Fleet average row */}
                                <tr className="bg-slate-50/50">
                                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700 italic">Fleet Average</td>
                                    {METRICS.map((m) => (
                                        <td key={m.key} className="whitespace-nowrap px-4 py-3 text-center text-sm font-medium text-slate-500">
                                            {(fleet_averages[m.key as keyof FleetAverages] ?? 0).toFixed(1)}
                                        </td>
                                    ))}
                                </tr>
                                {tenants.map((tenant) => (
                                    <tr key={tenant.tenant_id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{tenant.customer_name}</td>
                                        {METRICS.map((m) => (
                                            <ComparisonCell
                                                key={m.key}
                                                value={tenant[m.key] as number}
                                                average={fleet_averages[m.key as keyof FleetAverages] ?? 0}
                                            />
                                        ))}
                                    </tr>
                                ))}
                                {tenants.length === 0 && (
                                    <tr>
                                        <td colSpan={METRICS.length + 1} className="py-12 text-center text-sm text-slate-400">
                                            No tenant data available for comparison.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
