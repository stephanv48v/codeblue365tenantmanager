import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useDlpData } from './hooks/useDlpData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { TagIcon } from '@heroicons/react/24/outline';

export default function DlpLabels() {
    const { isFiltered } = useTenantScope();
    const { data, loading, error } = useDlpData();

    if (loading) {
        return (
            <AppLayout title="Sensitivity Labels">
                <PageHeader
                    title="Sensitivity Labels"
                    subtitle="Information protection labels"
                    breadcrumbs={[{ label: 'Security & Compliance' }, { label: 'DLP', href: '/dlp' }, { label: 'Labels' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3">
                    <SkeletonLoader variant="stat-card" count={3} className="contents" />
                </div>
                <SkeletonLoader variant="table" count={10} />
            </AppLayout>
        );
    }

    if (!data || error) {
        return (
            <AppLayout title="Sensitivity Labels">
                <PageHeader
                    title="Sensitivity Labels"
                    subtitle="Information protection labels"
                    breadcrumbs={[{ label: 'Security & Compliance' }, { label: 'DLP', href: '/dlp' }, { label: 'Labels' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load sensitivity labels data. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    const { summary, labels } = data;

    return (
        <AppLayout title="Sensitivity Labels">
            <PageHeader
                title="Sensitivity Labels"
                subtitle={isFiltered ? 'Labels for selected tenant' : 'Sensitivity labels across all tenants'}
                breadcrumbs={[{ label: 'Security & Compliance' }, { label: 'DLP', href: '/dlp' }, { label: 'Labels' }]}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3">
                <StatCard label="Total Labels" value={summary.total_labels} icon={TagIcon} accentColor="blue" />
                <StatCard label="Auto-Labeling Enabled" value={summary.auto_labeling_enabled} accentColor="emerald" />
                <StatCard label="Encryption Enabled" value={summary.encryption_enabled} accentColor="purple" />
            </div>

            {/* Labels Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Label Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Parent</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Priority</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Active</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Auto-Labeling</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Encryption</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Content Marking</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Files</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Emails</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Sites</th>
                                {!isFiltered && (
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {labels.map((label) => (
                                <tr key={label.id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{label.label_name}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{label.parent_label ?? '-'}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{label.priority}</td>
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
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">{label.content_marking ?? '-'}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{label.files_labeled.toLocaleString()}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{label.emails_labeled.toLocaleString()}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{label.sites_labeled.toLocaleString()}</td>
                                    {!isFiltered && (
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                            {label.customer_name ?? label.tenant_id.slice(0, 12) + '...'}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {labels.length === 0 && (
                                <tr>
                                    <td colSpan={isFiltered ? 10 : 11} className="py-12 text-center text-sm text-slate-400">
                                        No sensitivity labels found.
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
