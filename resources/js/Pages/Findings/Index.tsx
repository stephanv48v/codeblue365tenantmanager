import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

type Finding = {
    id: number;
    tenant_id: string;
    category: string;
    severity: string;
    description: string;
    status: string;
    impact: string;
    recommended_remediation: string;
    first_detected_at: string;
    last_detected_at: string;
};

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const accentBorder: Record<string, string> = {
    critical: 'border-l-red-500',
    high: 'border-l-orange-500',
    medium: 'border-l-amber-500',
    low: 'border-l-blue-400',
};

export default function FindingsIndex() {
    const [findings, setFindings] = useState<Finding[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetch('/api/v1/findings')
            .then((r) => r.json())
            .then((res) => {
                setFindings(res?.data?.items ?? []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filtered = filter === 'all' ? findings : findings.filter((f) => f.severity === filter);
    const sorted = [...filtered].sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

    const counts: Record<string, number> = {};
    for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;

    return (
        <AppLayout title="Findings">
            <PageHeader
                title="Findings"
                subtitle="Security and compliance findings across all tenants"
                breadcrumbs={[{ label: 'Security & Compliance' }, { label: 'Findings' }]}
            />

            {!loading && (
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-5">
                    <StatCard label="Total Open" value={findings.length} icon={ShieldExclamationIcon} accentColor="blue" />
                    <StatCard label="Critical" value={counts.critical ?? 0} accentColor="red" />
                    <StatCard label="High" value={counts.high ?? 0} accentColor="amber" />
                    <StatCard label="Medium" value={counts.medium ?? 0} accentColor="amber" />
                    <StatCard label="Low" value={counts.low ?? 0} accentColor="blue" />
                </div>
            )}

            <div className="mb-6 flex flex-wrap gap-2">
                {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
                    <button
                        key={sev}
                        onClick={() => setFilter(sev)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            filter === sev
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                        type="button"
                    >
                        {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)} ({sev === 'all' ? findings.length : counts[sev] ?? 0})
                    </button>
                ))}
            </div>

            {loading ? (
                <SkeletonLoader variant="table-row" count={8} />
            ) : sorted.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center text-sm text-slate-400">
                    No findings to display.
                </div>
            ) : (
                <div className="space-y-3">
                    {sorted.map((finding, index) => (
                        <div
                            key={finding.id ?? `${finding.category}-${index}`}
                            className={`rounded-xl border border-l-4 ${accentBorder[finding.severity] ?? 'border-l-slate-300'} bg-white p-5`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <StatusBadge
                                        variant={finding.severity === 'critical' ? 'critical' : finding.severity === 'high' ? 'high' : finding.severity === 'medium' ? 'medium' : 'low'}
                                        label={finding.severity}
                                    />
                                    <h3 className="text-sm font-semibold text-slate-800">{finding.category.replace(/_/g, ' ')}</h3>
                                </div>
                                <StatusBadge variant={finding.status === 'open' ? 'critical' : 'success'} label={finding.status} dot />
                            </div>
                            <p className="mt-2 text-sm text-slate-700">{finding.description}</p>
                            {finding.impact && (
                                <p className="mt-2 text-xs text-slate-500"><span className="font-medium text-slate-600">Impact:</span> {finding.impact}</p>
                            )}
                            {finding.recommended_remediation && (
                                <p className="mt-1 text-xs text-blue-700"><span className="font-medium">Remediation:</span> {finding.recommended_remediation}</p>
                            )}
                            <div className="mt-3 flex gap-4 text-xs text-slate-400">
                                <span>Tenant: {finding.tenant_id.slice(0, 12)}...</span>
                                {finding.first_detected_at && <span>First: {new Date(finding.first_detected_at).toLocaleDateString()}</span>}
                                {finding.last_detected_at && <span>Last: {new Date(finding.last_detected_at).toLocaleDateString()}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
