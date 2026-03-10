import { useState, useMemo } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SectionHeader from '../../Components/SectionHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { useDlpData } from './hooks/useDlpData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { LockClosedIcon, ShieldCheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const statusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'enabled':
        case 'active': return 'enabled' as const;
        case 'disabled': return 'disabled' as const;
        case 'test':
        case 'simulation': return 'reportOnly' as const;
        default: return 'neutral' as const;
    }
};

export default function DlpIndex() {
    const { isFiltered } = useTenantScope();
    const { data, loading, error } = useDlpData();
    const [policySearch, setPolicySearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const policies = data?.policies ?? [];
    const labels = data?.labels ?? [];
    const summary = data?.summary ?? { total_policies: 0, active_policies: 0, total_matches_30d: 0, overrides: 0, false_positives: 0 };

    const filteredPolicies = useMemo(() => {
        let result = policies;
        if (policySearch) {
            const q = policySearch.toLowerCase();
            result = result.filter((p) => p.policy_name.toLowerCase().includes(q));
        }
        if (statusFilter) {
            result = result.filter((p) => p.status.toLowerCase() === statusFilter);
        }
        return result;
    }, [policies, policySearch, statusFilter]);

    if (loading) {
        return (
            <AppLayout title="Data Loss Prevention">
                <PageHeader
                    title="Data Loss Prevention"
                    subtitle="DLP policies and sensitivity labels overview"
                    breadcrumbs={[{ label: 'Security & Compliance' }, { label: 'DLP' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
                <SkeletonLoader variant="table" count={8} />
            </AppLayout>
        );
    }

    if (!data || error) {
        return (
            <AppLayout title="Data Loss Prevention">
                <PageHeader
                    title="Data Loss Prevention"
                    subtitle="DLP policies and sensitivity labels overview"
                    breadcrumbs={[{ label: 'Security & Compliance' }, { label: 'DLP' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load DLP data. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Data Loss Prevention">
            <PageHeader
                title="Data Loss Prevention"
                subtitle={isFiltered ? 'DLP overview for selected tenant' : 'DLP policies and sensitivity labels across all tenants'}
                breadcrumbs={[{ label: 'Security & Compliance' }, { label: 'DLP' }]}
                actions={<ExportButton csvEndpoint="/api/v1/dlp/overview" />}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Total Policies" value={summary.total_policies} icon={LockClosedIcon} accentColor="blue" />
                <StatCard label="Active Policies" value={summary.active_policies} icon={ShieldCheckIcon} accentColor="emerald" />
                <StatCard label="Matches (30d)" value={summary.total_matches_30d} accentColor="amber" />
                <StatCard label="Overrides" value={summary.overrides} accentColor={summary.overrides > 0 ? 'amber' : 'slate'} />
                <StatCard label="False Positives" value={summary.false_positives} accentColor="slate" />
            </div>

            {/* DLP Policies Filter */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 flex-1">
                    <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search policies..."
                        value={policySearch}
                        onChange={(e) => setPolicySearch(e.target.value)}
                        className="w-full border-0 bg-transparent text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-0"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                    <option value="">All Statuses</option>
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                    <option value="test">Test</option>
                </select>
                {(policySearch || statusFilter) && (
                    <button
                        onClick={() => { setPolicySearch(''); setStatusFilter(''); }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* DLP Policies Table */}
            <div className="mb-6">
                <SectionHeader title="DLP Policies" subtitle={`${filteredPolicies.length} of ${policies.length} policies`} />
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Policy Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Mode</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Locations</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Rules</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Matches (30d)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Overrides</th>
                                    {!isFiltered && (
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPolicies.map((policy) => (
                                    <tr key={policy.id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{policy.policy_name}</td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <StatusBadge variant={statusVariant(policy.status)} label={policy.status} />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 capitalize">{policy.mode}</td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">
                                            {policy.locations?.join(', ') || '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{policy.rule_count}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{policy.matches_last_30d}</td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <span className={policy.overrides > 0 ? 'font-medium text-amber-600' : 'text-slate-400'}>
                                                {policy.overrides}
                                            </span>
                                        </td>
                                        {!isFiltered && (
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                {policy.customer_name ?? policy.tenant_id.slice(0, 12) + '...'}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {filteredPolicies.length === 0 && (
                                    <tr>
                                        <td colSpan={isFiltered ? 7 : 8} className="py-12 text-center text-sm text-slate-400">
                                            No DLP policies found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Sensitivity Labels Table */}
            <div className="mb-6">
                <SectionHeader title="Sensitivity Labels" subtitle="Information protection labels" href="/dlp/labels" linkText="View All Labels" />
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Label Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Active</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Auto-Labeling</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Encryption</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Files Labeled</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Emails Labeled</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {labels.slice(0, 10).map((label) => (
                                    <tr key={label.id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{label.label_name}</td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <StatusBadge
                                                variant={label.is_active ? 'enabled' : 'disabled'}
                                                label={label.is_active ? 'Active' : 'Inactive'}
                                                dot
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <StatusBadge
                                                variant={label.auto_labeling_enabled ? 'success' : 'neutral'}
                                                label={label.auto_labeling_enabled ? 'Enabled' : 'Disabled'}
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <StatusBadge
                                                variant={label.encryption_enabled ? 'success' : 'neutral'}
                                                label={label.encryption_enabled ? 'Enabled' : 'Disabled'}
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{label.files_labeled.toLocaleString()}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{label.emails_labeled.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {labels.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                                            No sensitivity labels found.
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
