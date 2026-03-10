import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import ChartCard from '../../Components/ChartCard';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useCompliancePoliciesData } from './hooks/useCompliancePoliciesData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const platformVariant = (platform: string) => {
    switch (platform.toLowerCase()) {
        case 'windows': return 'info' as const;
        case 'macos':
        case 'ios': return 'neutral' as const;
        case 'android': return 'success' as const;
        case 'linux': return 'warning' as const;
        default: return 'neutral' as const;
    }
};

export default function CompliancePolicies() {
    const { isFiltered } = useTenantScope();
    const { data, loading, error } = useCompliancePoliciesData();

    if (loading) {
        return (
            <AppLayout title="Compliance Policies">
                <PageHeader
                    title="Compliance Policies"
                    subtitle="Device compliance policy overview"
                    breadcrumbs={[{ label: 'Devices', href: '/devices' }, { label: 'Compliance Policies' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3">
                    <SkeletonLoader variant="stat-card" count={3} className="contents" />
                </div>
                <SkeletonLoader variant="table" count={8} />
            </AppLayout>
        );
    }

    if (!data || error) {
        return (
            <AppLayout title="Compliance Policies">
                <PageHeader
                    title="Compliance Policies"
                    subtitle="Device compliance policy overview"
                    breadcrumbs={[{ label: 'Devices', href: '/devices' }, { label: 'Compliance Policies' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load compliance policies. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    const { summary, policies, platform_breakdown } = data;

    return (
        <AppLayout title="Compliance Policies">
            <PageHeader
                title="Compliance Policies"
                subtitle={isFiltered ? 'Compliance policies for selected tenant' : 'Device compliance policies across all tenants'}
                breadcrumbs={[{ label: 'Devices', href: '/devices' }, { label: 'Compliance Policies' }]}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3">
                <StatCard label="Total Policies" value={summary.total_policies} icon={ShieldCheckIcon} accentColor="blue" />
                <StatCard
                    label="Compliance Rate"
                    value={`${summary.overall_compliance_rate.toFixed(1)}%`}
                    accentColor={summary.overall_compliance_rate >= 80 ? 'emerald' : summary.overall_compliance_rate >= 60 ? 'amber' : 'red'}
                />
                <StatCard label="Non-Compliant Devices" value={summary.non_compliant_devices} accentColor={summary.non_compliant_devices > 0 ? 'red' : 'emerald'} />
            </div>

            {/* Platform Breakdown Chart */}
            {platform_breakdown && platform_breakdown.length > 0 && (
                <div className="mb-6">
                    <ChartCard title="Compliance by Platform" subtitle="Device compliance status per platform">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={platform_breakdown}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="platform" tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="compliant" name="Compliant" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                                <Bar dataKey="non_compliant" name="Non-Compliant" fill="#ef4444" radius={[0, 0, 0, 0]} stackId="a" />
                                <Bar dataKey="error" name="Error" fill="#f59e0b" radius={[0, 0, 0, 0]} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}

            {/* Policies Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Policy Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Platform</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Assigned</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Compliant</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Non-Compliant</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Errors</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Compliance %</th>
                                {!isFiltered && (
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {policies.map((policy) => (
                                <tr key={policy.id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{policy.policy_name}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <StatusBadge variant={platformVariant(policy.platform)} label={policy.platform} />
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{policy.assigned_count}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <span className="font-medium text-emerald-600">{policy.compliant_count}</span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <span className={policy.non_compliant_count > 0 ? 'font-medium text-red-600' : 'text-slate-400'}>
                                            {policy.non_compliant_count}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <span className={policy.error_count > 0 ? 'font-medium text-amber-600' : 'text-slate-400'}>
                                            {policy.error_count}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-16 rounded-full bg-slate-200">
                                                <div
                                                    className={`h-2 rounded-full ${
                                                        policy.compliance_rate >= 80 ? 'bg-emerald-500' :
                                                        policy.compliance_rate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${Math.min(policy.compliance_rate, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-slate-700">{policy.compliance_rate.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    {!isFiltered && (
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                            {policy.customer_name ?? policy.tenant_id.slice(0, 12) + '...'}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {policies.length === 0 && (
                                <tr>
                                    <td colSpan={isFiltered ? 7 : 8} className="py-12 text-center text-sm text-slate-400">
                                        No compliance policies found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
