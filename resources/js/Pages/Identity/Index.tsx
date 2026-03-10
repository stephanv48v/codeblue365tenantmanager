import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    UsersIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    KeyIcon,
    ClockIcon,
    FingerPrintIcon,
    UserPlusIcon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import PageHeader from '../../Components/PageHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { usePdfReport } from '../../hooks/usePdfReport';
import { useIdentityData } from './hooks/useIdentityData';

const RISK_COLORS: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3b82f6',
    none: '#94a3b8',
};

export default function IdentityIndex() {
    const { overview, loading } = useIdentityData();
    const { generating, generateReport } = usePdfReport();

    const handlePdfExport = async () => {
        if (!overview) return;
        const d = overview;
        await generateReport({
            title: 'Identity Overview Report',
            subtitle: 'User identity health across all tenants',
            orientation: 'landscape',
            sections: [
                {
                    type: 'stats',
                    data: [
                        { label: 'Total Users', value: d.total_users },
                        { label: 'MFA Coverage', value: `${d.mfa_coverage_percent}%` },
                        { label: 'Stale Users', value: d.stale_users },
                        { label: 'Risky Users', value: d.risky_users_count },
                        { label: 'CA Policies', value: d.ca_policies_count },
                    ],
                },
                { type: 'chart', elementId: 'identity-mfa-chart', title: 'MFA Coverage by Tenant' },
                { type: 'chart', elementId: 'identity-risky-chart', title: 'Risky Users by Level' },
            ],
        });
    };

    if (loading) {
        return (
            <AppLayout title="Identity Overview">
                <PageHeader title="Identity" subtitle="User identity health across all tenants" />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = overview!;

    const mfaByTenant = d.mfa_by_tenant.map((t) => ({
        name: t.customer_name.length > 15 ? t.customer_name.slice(0, 15) + '...' : t.customer_name,
        mfa: t.mfa_users,
        noMfa: t.total_users - t.mfa_users,
    }));

    const riskyByLevel = d.risky_by_level.map((r) => ({
        name: r.risk_level.charAt(0).toUpperCase() + r.risk_level.slice(1),
        value: r.count,
        fill: RISK_COLORS[r.risk_level] ?? '#94a3b8',
    }));

    return (
        <AppLayout title="Identity Overview">
            <PageHeader
                title="Identity"
                subtitle="User identity health across all tenants"
                breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Overview' }]}
                actions={<ExportButton csvEndpoint="/api/v1/reports/identity" onExportPdf={handlePdfExport} pdfGenerating={generating} />}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Total Users" value={d.total_users} icon={UsersIcon} accentColor="blue" />
                <StatCard
                    label="MFA Coverage"
                    value={`${d.mfa_coverage_percent}%`}
                    icon={ShieldCheckIcon}
                    accentColor={d.mfa_coverage_percent >= 90 ? 'emerald' : d.mfa_coverage_percent >= 70 ? 'amber' : 'red'}
                />
                <StatCard
                    label="Stale Users"
                    value={d.stale_users}
                    icon={ClockIcon}
                    accentColor={d.stale_users > 0 ? 'amber' : 'emerald'}
                    subtitle="90+ days inactive"
                />
                <StatCard
                    label="Risky Users"
                    value={d.risky_users_count}
                    icon={ExclamationTriangleIcon}
                    href="/identity/risky-users"
                    accentColor={d.risky_users_count > 0 ? 'red' : 'emerald'}
                />
                <StatCard
                    label="CA Policies"
                    value={d.ca_policies_count}
                    icon={KeyIcon}
                    href="/identity/conditional-access"
                    accentColor="blue"
                />
            </div>

            {/* Charts */}
            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <ChartCard title="MFA Coverage by Tenant" subtitle="Users with MFA vs without" className="lg:col-span-8" id="identity-mfa-chart">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={mfaByTenant} layout="vertical">
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="mfa" name="MFA Registered" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="noMfa" name="No MFA" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Risky Users by Level" className="lg:col-span-4" id="identity-risky-chart">
                    {riskyByLevel.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={riskyByLevel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                                    {riskyByLevel.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                            No risky users detected
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                <Link href="/identity/users" className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <UsersIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">All Users</p>
                            <p className="text-xs text-slate-400">Browse and filter user directory</p>
                        </div>
                    </div>
                </Link>
                <Link href="/identity/risky-users" className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                            <ExclamationTriangleIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Risky Users</p>
                            <p className="text-xs text-slate-400">Identity Protection alerts</p>
                        </div>
                    </div>
                </Link>
                <Link href="/identity/conditional-access" className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                            <KeyIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Conditional Access</p>
                            <p className="text-xs text-slate-400">CA policy inventory</p>
                        </div>
                    </div>
                </Link>
                <Link href="/identity/auth-methods" className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <FingerPrintIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Auth Methods</p>
                            <p className="text-xs text-slate-400">MFA adoption &amp; SSPR readiness</p>
                        </div>
                    </div>
                </Link>
                <Link href="/identity/admin-accounts" className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                            <KeyIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Admin Accounts</p>
                            <p className="text-xs text-slate-400">Privileged role management</p>
                        </div>
                    </div>
                </Link>
                <Link href="/identity/guest-users" className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                            <UserPlusIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Guest Users</p>
                            <p className="text-xs text-slate-400">External user lifecycle</p>
                        </div>
                    </div>
                </Link>
                <Link href="/identity/sign-in-activity" className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Sign-In Activity</p>
                            <p className="text-xs text-slate-400">Authentication trends</p>
                        </div>
                    </div>
                </Link>
            </div>
        </AppLayout>
    );
}
