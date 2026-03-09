import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { KeyIcon, CheckCircleIcon, DocumentTextIcon, NoSymbolIcon } from '@heroicons/react/24/outline';

type CaPolicy = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    policy_id: string;
    display_name: string;
    state: string;
    conditions: string;
    grant_controls: string;
};

type CaResponse = {
    total: number;
    enabled: number;
    report_only: number;
    disabled: number;
    items: CaPolicy[];
};

const stateVariant = (state: string) => {
    switch (state) {
        case 'enabled': return 'enabled' as const;
        case 'enabledForReportingButNotEnforced': return 'reportOnly' as const;
        case 'disabled': return 'disabled' as const;
        default: return 'neutral' as const;
    }
};

const stateLabel = (state: string) => {
    switch (state) {
        case 'enabled': return 'Enabled';
        case 'enabledForReportingButNotEnforced': return 'Report Only';
        case 'disabled': return 'Disabled';
        default: return state;
    }
};

export default function ConditionalAccess() {
    const [data, setData] = useState<CaResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/v1/identity/conditional-access')
            .then((r) => r.json())
            .then((res) => {
                setData(res.success ? res.data : null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <AppLayout title="Conditional Access">
                <PageHeader title="Conditional Access Policies" breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Conditional Access' }]} />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = data!;

    return (
        <AppLayout title="Conditional Access">
            <PageHeader
                title="Conditional Access Policies"
                subtitle="Cross-tenant Conditional Access policy inventory"
                breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Conditional Access' }]}
            />

            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Total Policies" value={d.total} icon={KeyIcon} accentColor="blue" />
                <StatCard label="Enabled" value={d.enabled} icon={CheckCircleIcon} accentColor="emerald" />
                <StatCard label="Report Only" value={d.report_only} icon={DocumentTextIcon} accentColor="amber" />
                <StatCard label="Disabled" value={d.disabled} icon={NoSymbolIcon} accentColor="slate" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {d.items.map((policy) => {
                    let grantControls: string[] = [];
                    try {
                        const parsed = JSON.parse(policy.grant_controls);
                        grantControls = parsed.builtInControls ?? [];
                    } catch { /* ignore */ }

                    return (
                        <div key={policy.id} className="rounded-xl border border-slate-200 bg-white p-5">
                            <div className="mb-3 flex items-start justify-between">
                                <h3 className="text-sm font-semibold text-slate-800">{policy.display_name}</h3>
                                <StatusBadge variant={stateVariant(policy.state)} label={stateLabel(policy.state)} dot />
                            </div>
                            <p className="mb-2 text-xs text-slate-400">{policy.customer_name ?? policy.tenant_id.slice(0, 8)}</p>
                            {grantControls.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {grantControls.map((ctrl) => (
                                        <span key={ctrl} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                                            {ctrl}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {d.items.length === 0 && (
                    <div className="col-span-full py-12 text-center text-sm text-slate-400">
                        No conditional access policies found.
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
