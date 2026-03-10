import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import SectionHeader from '../../Components/SectionHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { useAuthMethodsData } from './hooks/useAuthMethodsData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    ShieldCheckIcon,
    KeyIcon,
    DevicePhoneMobileIcon,
    FingerPrintIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────────────────

function truncate(str: string, len: number): string {
    return str.length > len ? str.slice(0, len) + '...' : str;
}

function pctColor(pct: number, high: number, mid: number): 'emerald' | 'amber' | 'red' {
    if (pct >= high) return 'emerald';
    if (pct >= mid) return 'amber';
    return 'red';
}

function pctTextColor(pct: number, high: number, mid: number): string {
    if (pct >= high) return 'text-emerald-600';
    if (pct >= mid) return 'text-amber-600';
    return 'text-red-600';
}

function pctBgColor(pct: number, high: number, mid: number): string {
    if (pct >= high) return 'bg-emerald-500';
    if (pct >= mid) return 'bg-amber-500';
    return 'bg-red-500';
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function AuthMethods() {
    const { isFiltered } = useTenantScope();
    const { data: d, loading } = useAuthMethodsData();

    // ── Chart data ──────────────────────────────────────────────────────────

    const methodChartData = d
        ? [
              { name: 'Authenticator App', count: d.methods.authenticator_app, fill: '#3b82f6' },
              { name: 'FIDO2 Keys', count: d.methods.fido2, fill: '#8b5cf6' },
              { name: 'Windows Hello', count: d.methods.windows_hello, fill: '#06b6d4' },
              { name: 'Phone SMS', count: d.methods.phone_sms, fill: '#f59e0b' },
              { name: 'Phone Call', count: d.methods.phone_call, fill: '#f97316' },
              { name: 'Email OTP', count: d.methods.email_otp, fill: '#64748b' },
              { name: 'Passwordless', count: d.methods.passwordless, fill: '#a855f7' },
              { name: 'Password Only', count: d.methods.password_only, fill: '#ef4444' },
          ]
        : [];

    const tenantMfaData = d
        ? d.by_tenant.map((t) => ({
              name: truncate(t.customer_name, 15),
              pct: Math.round((t.mfa_capable_users / Math.max(t.total_users, 1)) * 1000) / 10,
          }))
        : [];

    const sortedTenants = d
        ? [...d.by_tenant].sort((a, b) => {
              const aPct = (a.mfa_capable_users / Math.max(a.total_users, 1)) * 100;
              const bPct = (b.mfa_capable_users / Math.max(b.total_users, 1)) * 100;
              return bPct - aPct;
          })
        : [];

    // ── Loading state ───────────────────────────────────────────────────────

    if (loading) {
        return (
            <AppLayout title="Auth Methods">
                <PageHeader
                    title="Authentication Methods"
                    subtitle="MFA method adoption and SSPR readiness"
                    breadcrumbs={[
                        { label: 'Identity', href: '/identity' },
                        { label: 'Auth Methods' },
                    ]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
            </AppLayout>
        );
    }

    if (!d) {
        return (
            <AppLayout title="Auth Methods">
                <PageHeader
                    title="Authentication Methods"
                    subtitle="MFA method adoption and SSPR readiness"
                    breadcrumbs={[
                        { label: 'Identity', href: '/identity' },
                        { label: 'Auth Methods' },
                    ]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    Unable to load authentication methods data.
                </div>
            </AppLayout>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────

    const ssprPct = d.sspr.registered_pct;
    const ssprGap = d.sspr.capable - d.sspr.registered;

    return (
        <AppLayout title="Auth Methods">
            <PageHeader
                title="Authentication Methods"
                subtitle="MFA method adoption and SSPR readiness"
                breadcrumbs={[
                    { label: 'Identity', href: '/identity' },
                    { label: 'Auth Methods' },
                ]}
                actions={<ExportButton csvEndpoint="/api/v1/reports/auth-methods" />}
            />

            {/* ── Stat Cards ────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatCard
                    label="MFA Capable"
                    value={`${d.mfa_capable_pct}%`}
                    subtitle={`${d.mfa_capable_users} of ${d.total_users}`}
                    accentColor={pctColor(d.mfa_capable_pct, 90, 70)}
                    icon={ShieldCheckIcon}
                />
                <StatCard
                    label="Authenticator App"
                    value={d.methods.authenticator_app}
                    accentColor="blue"
                    icon={DevicePhoneMobileIcon}
                />
                <StatCard
                    label="Passwordless"
                    value={d.methods.passwordless}
                    accentColor="purple"
                    icon={FingerPrintIcon}
                />
                <StatCard
                    label="SSPR Registered"
                    value={`${d.sspr.registered_pct}%`}
                    subtitle={`${d.sspr.registered} of ${d.sspr.capable}`}
                    accentColor={pctColor(d.sspr.registered_pct, 80, 60)}
                    icon={KeyIcon}
                />
                <StatCard
                    label="Password Only"
                    value={d.methods.password_only}
                    accentColor={d.methods.password_only > 0 ? 'red' : 'emerald'}
                    icon={LockClosedIcon}
                />
            </div>

            {/* ── Charts ────────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <ChartCard
                    title="Method Adoption"
                    subtitle="Authentication method registrations"
                    className="lg:col-span-7"
                >
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={methodChartData} layout="vertical">
                            <XAxis type="number" />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={130}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip />
                            <Bar dataKey="count" name="Users" radius={[0, 4, 4, 0]}>
                                {methodChartData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <div className="lg:col-span-5">
                    {!isFiltered ? (
                        <ChartCard
                            title="MFA Coverage by Tenant"
                            subtitle="Percentage of MFA-capable users per tenant"
                        >
                            {tenantMfaData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={tenantMfaData} layout="vertical">
                                        <XAxis type="number" domain={[0, 100]} unit="%" />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={120}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [`${value}%`, 'MFA Capable']}
                                        />
                                        <Bar dataKey="pct" name="MFA %" fill="#10b981" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
                                    No tenant data available
                                </div>
                            )}
                        </ChartCard>
                    ) : (
                        /* Single-tenant: SSPR Panel */
                        <div className="rounded-xl border border-slate-200 bg-white p-6">
                            <SectionHeader title="SSPR Coverage" subtitle="Self-service password reset readiness" />
                            <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-medium text-slate-700">Registration Progress</span>
                                    <span className={`font-bold ${pctTextColor(ssprPct, 80, 60)}`}>
                                        {ssprPct}%
                                    </span>
                                </div>
                                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className={`h-full rounded-full transition-all ${pctBgColor(ssprPct, 80, 60)}`}
                                        style={{ width: `${Math.min(ssprPct, 100)}%` }}
                                    />
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xl font-bold text-slate-900">{d.sspr.capable}</p>
                                        <p className="text-xs text-slate-500">Capable</p>
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-emerald-600">{d.sspr.registered}</p>
                                        <p className="text-xs text-slate-500">Registered</p>
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-amber-600">{ssprGap}</p>
                                        <p className="text-xs text-slate-500">Gap</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SSPR Panel (full width) ──────────────────────────────── */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
                <SectionHeader title="Self-Service Password Reset (SSPR)" subtitle="Registration status and coverage gap" />
                <div className="mt-2">
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">
                            {d.sspr.registered} of {d.sspr.capable} users registered
                        </span>
                        <span className={`font-bold ${pctTextColor(ssprPct, 80, 60)}`}>
                            {ssprPct}%
                        </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className={`h-full rounded-full transition-all ${pctBgColor(ssprPct, 80, 60)}`}
                            style={{ width: `${Math.min(ssprPct, 100)}%` }}
                        />
                    </div>
                    <div className="mt-4 flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-slate-300" />
                            <span className="text-sm text-slate-600">
                                Capable: <span className="font-semibold text-slate-900">{d.sspr.capable}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                            <span className="text-sm text-slate-600">
                                Registered: <span className="font-semibold text-emerald-700">{d.sspr.registered}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-amber-500" />
                            <span className="text-sm text-slate-600">
                                Gap: <span className="font-semibold text-amber-700">{ssprGap}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tenant Comparison Table ──────────────────────────────── */}
            {!isFiltered && sortedTenants.length > 0 && (
                <>
                    <div className="mb-4">
                        <SectionHeader title="Tenant Comparison" subtitle="Authentication method coverage across tenants" />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Tenant
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Total Users
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            MFA Capable %
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            Passwordless
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            SSPR %
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedTenants.map((t) => {
                                        const mfaPct = Math.round(
                                            (t.mfa_capable_users / Math.max(t.total_users, 1)) * 1000,
                                        ) / 10;
                                        const tSsprPct = Math.round(
                                            (t.sspr_registered_count / Math.max(t.total_users, 1)) * 1000,
                                        ) / 10;

                                        return (
                                            <tr key={t.tenant_id} className="hover:bg-slate-50">
                                                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                                                    {t.customer_name}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                                    {t.total_users}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <span
                                                        className={`font-semibold ${pctTextColor(mfaPct, 90, 70)}`}
                                                    >
                                                        {mfaPct}%
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                                    {t.passwordless_count}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <span
                                                        className={`font-semibold ${pctTextColor(tSsprPct, 90, 70)}`}
                                                    >
                                                        {tSsprPct}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    );
}
