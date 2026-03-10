import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import SectionHeader from '../../Components/SectionHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { useSignInActivityData } from './hooks/useSignInActivityData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    ArrowTrendingUpIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function successRateColor(rate: number): 'emerald' | 'amber' | 'red' {
    if (rate >= 98) return 'emerald';
    if (rate >= 95) return 'amber';
    return 'red';
}

function successRateTextColor(rate: number): string {
    if (rate >= 98) return 'text-emerald-600';
    if (rate >= 95) return 'text-amber-600';
    return 'text-red-600';
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function SignInActivity() {
    const { isFiltered } = useTenantScope();
    const { data: d, loading } = useSignInActivityData();

    // ── Render ─────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <AppLayout title="Sign-In Activity">
                <PageHeader
                    title="Sign-In Activity"
                    subtitle="Authentication trends and failure analysis (last 30 days)"
                    breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Sign-In Activity' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
            </AppLayout>
        );
    }

    if (!d) {
        return (
            <AppLayout title="Sign-In Activity">
                <PageHeader
                    title="Sign-In Activity"
                    subtitle="Authentication trends and failure analysis (last 30 days)"
                    breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Sign-In Activity' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    No sign-in activity data available.
                </div>
            </AppLayout>
        );
    }

    const failureReasonsSorted = [...d.failure_reasons].sort((a, b) => b.count - a.count).slice(0, 10);
    const topLocationsSorted = [...d.top_locations].sort((a, b) => b.count - a.count).slice(0, 10);
    const maxFailureCount = failureReasonsSorted.length > 0 ? failureReasonsSorted[0].count : 1;

    const EXPECTED_COUNTRIES = ['New Zealand', 'NZ', 'Australia', 'AU'];
    const unusualLocations = topLocationsSorted.filter(
        (loc) => !EXPECTED_COUNTRIES.includes(loc.country),
    );
    const unusualCountries = [...new Set(unusualLocations.map((loc) => loc.country))];
    const unusualSignInCount = unusualLocations.reduce((sum, loc) => sum + loc.count, 0);
    const isUnusualCountry = (country: string) => !EXPECTED_COUNTRIES.includes(country);

    return (
        <AppLayout title="Sign-In Activity">
            <PageHeader
                title="Sign-In Activity"
                subtitle="Authentication trends and failure analysis (last 30 days)"
                breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Sign-In Activity' }]}
                actions={<ExportButton csvEndpoint="/api/v1/reports/sign-in-activity" />}
            />

            {/* ── Stat Cards ────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard
                    label="Total Sign-Ins"
                    value={d.total_sign_ins_30d.toLocaleString()}
                    icon={ArrowTrendingUpIcon}
                    accentColor="blue"
                    subtitle="Last 30 days"
                />
                <StatCard
                    label="Success Rate"
                    value={`${d.success_rate}%`}
                    icon={CheckCircleIcon}
                    accentColor={successRateColor(d.success_rate)}
                />
                <StatCard
                    label="Failed Sign-Ins"
                    value={d.failed_sign_ins_30d.toLocaleString()}
                    icon={ExclamationTriangleIcon}
                    accentColor={d.failed_sign_ins_30d > 0 ? 'red' : 'emerald'}
                    subtitle="Last 30 days"
                />
                <StatCard
                    label="Unique Users"
                    value={d.unique_users_30d.toLocaleString()}
                    icon={UsersIcon}
                    accentColor="purple"
                    subtitle="Last 30 days"
                />
            </div>

            {/* ── Trend Chart ───────────────────────────────────────────── */}
            <div className="mb-6">
                <ChartCard title="Sign-In Trend" subtitle="Daily successful vs failed sign-ins">
                    {d.trend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={d.trend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatShortDate}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    labelFormatter={(label: string) =>
                                        new Date(label).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })
                                    }
                                />
                                <Area
                                    type="monotone"
                                    dataKey="successful"
                                    stroke="#10b981"
                                    fill="#10b98133"
                                    name="Successful"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="failed"
                                    stroke="#ef4444"
                                    fill="#ef444433"
                                    name="Failed"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
                            No trend data available
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* ── Details ───────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-6 lg:grid-cols-2">
                {/* Failure Reasons */}
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <SectionHeader title="Failure Reasons" subtitle="Top reasons for failed sign-ins" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Reason</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Count</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">% of Failures</th>
                                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {failureReasonsSorted.map((reason) => {
                                    const pct = d.failed_sign_ins_30d > 0
                                        ? ((reason.count / d.failed_sign_ins_30d) * 100).toFixed(1)
                                        : '0.0';
                                    const barWidth = (reason.count / maxFailureCount) * 100;
                                    return (
                                        <tr key={reason.reason} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-700 max-w-[250px] truncate">{reason.reason}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">{reason.count.toLocaleString()}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-slate-500">{pct}%</td>
                                            <td className="px-4 py-3 w-24">
                                                <div className="h-2 w-full rounded-full bg-slate-100">
                                                    <div
                                                        className="h-2 rounded-full bg-red-400"
                                                        style={{ width: `${barWidth}%` }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {failureReasonsSorted.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                                            No failure reasons recorded
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Locations */}
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                    {unusualCountries.length > 0 && (
                        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                            <p className="text-sm font-semibold text-amber-700">
                                {'\u26A0'} {unusualSignInCount.toLocaleString()} sign-in{unusualSignInCount !== 1 ? 's' : ''} from unusual locations
                            </p>
                            <p className="mt-1 text-xs text-amber-600">
                                Countries: {unusualCountries.join(', ')}
                            </p>
                        </div>
                    )}
                    <SectionHeader title="Top Locations" subtitle="Most frequent sign-in origins" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Country</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">City</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Sign-Ins</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {topLocationsSorted.map((loc, i) => (
                                    <tr
                                        key={`${loc.country}-${loc.city}-${i}`}
                                        className={isUnusualCountry(loc.country) ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50'}
                                    >
                                        <td className={`whitespace-nowrap px-4 py-3 font-medium ${isUnusualCountry(loc.country) ? 'text-amber-700' : 'text-slate-900'}`}>
                                            {isUnusualCountry(loc.country) && <span className="mr-1">{'\u26A0'}</span>}
                                            {loc.country}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{loc.city}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">{loc.count.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {topLocationsSorted.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-sm text-slate-400">
                                            No location data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Tenant Comparison ─────────────────────────────────────── */}
            {!isFiltered && d.by_tenant.length > 0 && (
                <>
                    <div className="mb-4">
                        <SectionHeader title="Sign-In Activity by Tenant" />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Total Sign-Ins</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Failed</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Success Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d.by_tenant.map((tenant) => (
                                        <tr key={tenant.tenant_id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                                                {tenant.customer_name}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                                                {tenant.total.toLocaleString()}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-slate-500">
                                                {tenant.failed.toLocaleString()}
                                            </td>
                                            <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${successRateTextColor(tenant.success_rate)}`}>
                                                {tenant.success_rate}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    );
}
