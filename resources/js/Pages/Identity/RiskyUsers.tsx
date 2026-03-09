import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

type RiskyUser = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    user_id: string;
    user_principal_name: string | null;
    display_name: string | null;
    risk_level: string;
    risk_state: string;
    risk_detail: string | null;
    risk_last_updated_at: string | null;
};

type RiskyUsersResponse = {
    total: number;
    high: number;
    medium: number;
    remediated: number;
    items: RiskyUser[];
};

const riskLevelVariant = (level: string) => {
    switch (level) {
        case 'high': return 'critical' as const;
        case 'medium': return 'warning' as const;
        case 'low': return 'info' as const;
        default: return 'neutral' as const;
    }
};

const riskStateVariant = (state: string) => {
    switch (state) {
        case 'atRisk': return 'critical' as const;
        case 'remediated': return 'success' as const;
        case 'confirmedCompromised': return 'critical' as const;
        default: return 'neutral' as const;
    }
};

export default function RiskyUsers() {
    const [data, setData] = useState<RiskyUsersResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/v1/identity/risky-users')
            .then((r) => r.json())
            .then((res) => {
                setData(res.success ? res.data : null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <AppLayout title="Risky Users">
                <PageHeader title="Risky Users" subtitle="Identity Protection flagged accounts" breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Risky Users' }]} />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = data!;

    return (
        <AppLayout title="Risky Users">
            <PageHeader
                title="Risky Users"
                subtitle="Identity Protection flagged accounts"
                breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Risky Users' }]}
            />

            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Total Risky" value={d.total} icon={ExclamationTriangleIcon} accentColor="red" />
                <StatCard label="High Risk" value={d.high} accentColor="red" />
                <StatCard label="Medium Risk" value={d.medium} accentColor="amber" />
                <StatCard label="Remediated" value={d.remediated} icon={ShieldCheckIcon} accentColor="emerald" />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">UPN</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Risk Level</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">State</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Detail</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {d.items.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{user.display_name ?? '-'}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{user.user_principal_name ?? '-'}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{user.customer_name ?? user.tenant_id.slice(0, 8)}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <StatusBadge variant={riskLevelVariant(user.risk_level)} label={user.risk_level} />
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <StatusBadge variant={riskStateVariant(user.risk_state)} label={user.risk_state} dot />
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">{user.risk_detail ?? '-'}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                        {user.risk_last_updated_at ? new Date(user.risk_last_updated_at).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                            {d.items.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                                        No risky users detected across your managed tenants.
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
