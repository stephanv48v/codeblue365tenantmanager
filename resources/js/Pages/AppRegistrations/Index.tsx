import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SectionHeader from '../../Components/SectionHeader';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { useAppRegistrationsData, type AppFilters } from './hooks/useAppRegistrationsData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    ShieldExclamationIcon,
    KeyIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CheckBadgeIcon,
} from '@heroicons/react/24/outline';

// ── Helpers ─────────────────────────────────────────────────────────────────

function isExpired(dateStr: string | null): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
}

function isExpiringSoon(dateStr: string | null, days = 30): boolean {
    if (!dateStr) return false;
    const expiryDate = new Date(dateStr);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    return expiryDate >= new Date() && expiryDate <= threshold;
}

const riskVariant = (level: string) => {
    switch (level) {
        case 'high': return 'critical' as const;
        case 'medium': return 'warning' as const;
        case 'low': return 'info' as const;
        default: return 'neutral' as const;
    }
};

// ── Main Component ──────────────────────────────────────────────────────────

export default function AppRegistrationsIndex() {
    const { isFiltered } = useTenantScope();
    const {
        data, loading, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchData,
    } = useAppRegistrationsData();

    // ── Filter handlers ─────────────────────────────────────────────────────

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: AppFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setPage(1);
        fetchData(1, perPage, newFilters, search);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
        fetchData(1, perPage, filters, value);
    };

    const handleReset = () => {
        const empty: AppFilters = { app_type: '', credential_status: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        fetchData(1, perPage, empty, '');
    };

    // ── Loading state ───────────────────────────────────────────────────────

    if (loading && !data) {
        return (
            <AppLayout title="App Registrations">
                <PageHeader
                    title="App Registrations"
                    subtitle="Application registrations, credentials, and OAuth consents"
                    breadcrumbs={[{ label: 'App Registrations', href: '/app-registrations' }, { label: 'Overview' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = data!;

    return (
        <AppLayout title="App Registrations">
            <PageHeader
                title="App Registrations"
                subtitle="Application registrations, credentials, and OAuth consents"
                breadcrumbs={[{ label: 'App Registrations', href: '/app-registrations' }, { label: 'Overview' }]}
                actions={<ExportButton csvEndpoint="/api/v1/app-registrations/overview" />}
            />

            {/* ── Stat Cards ────────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Total Apps" value={d.total_apps} icon={ShieldExclamationIcon} accentColor="blue" />
                <StatCard
                    label="Expired Credentials"
                    value={d.expired_credentials}
                    icon={ExclamationTriangleIcon}
                    accentColor={d.expired_credentials > 0 ? 'red' : 'emerald'}
                />
                <StatCard
                    label="Expiring Soon"
                    value={d.expiring_soon}
                    icon={ClockIcon}
                    accentColor={d.expiring_soon > 0 ? 'amber' : 'emerald'}
                    subtitle="Within 30 days"
                />
                <StatCard
                    label="Admin Consented"
                    value={d.admin_consented}
                    icon={CheckBadgeIcon}
                    accentColor="purple"
                />
                <StatCard
                    label="High-Risk Consents"
                    value={d.high_risk_consents}
                    icon={ShieldExclamationIcon}
                    accentColor={d.high_risk_consents > 0 ? 'red' : 'emerald'}
                />
            </div>

            {/* ── Credential Alert ───────────────────────────────────────────── */}
            {d.expired_credentials > 0 && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                            <KeyIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-red-800">
                                {d.expired_credentials} app{d.expired_credentials !== 1 ? 's' : ''} with expired credentials
                            </p>
                            <p className="text-xs text-red-600">
                                Expired credentials may cause service disruptions. Rotate these credentials immediately.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Filter Bar ────────────────────────────────────────────────── */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'app_type',
                            label: 'All App Types',
                            options: [
                                { value: 'first_party', label: 'First Party' },
                                { value: 'third_party', label: 'Third Party' },
                                { value: 'custom', label: 'Custom' },
                            ],
                        },
                        {
                            key: 'credential_status',
                            label: 'All Credential States',
                            options: [
                                { value: 'expired', label: 'Expired' },
                                { value: 'expiring_soon', label: 'Expiring Soon' },
                                { value: 'valid', label: 'Valid' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{
                        value: search,
                        onChange: handleSearchChange,
                        placeholder: 'Search by app name...',
                    }}
                    onReset={handleReset}
                />
            </div>

            {/* ── App Registrations Table ────────────────────────────────────── */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {loading ? (
                    <div className="p-6"><SkeletonLoader variant="table" count={10} /></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">App Name</th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Credentials</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Credential Expiry</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Admin Consent</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">API Permissions</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Sign-In</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d.items.map((app) => (
                                        <tr key={app.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{app.display_name}</td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{app.customer_name ?? app.tenant_id.slice(0, 8)}</td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant="neutral" label={app.app_type.replace(/_/g, ' ')} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{app.credential_count}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                {app.nearest_credential_expiry ? (
                                                    <span className={
                                                        isExpired(app.nearest_credential_expiry)
                                                            ? 'text-sm font-medium text-red-600'
                                                            : isExpiringSoon(app.nearest_credential_expiry)
                                                            ? 'text-sm font-medium text-amber-600'
                                                            : 'text-sm text-slate-500'
                                                    }>
                                                        {new Date(app.nearest_credential_expiry).toLocaleDateString()}
                                                        {isExpired(app.nearest_credential_expiry) && (
                                                            <StatusBadge variant="expired" label="Expired" size="sm" />
                                                        )}
                                                        {isExpiringSoon(app.nearest_credential_expiry) && (
                                                            <StatusBadge variant="warning" label="Soon" size="sm" />
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge
                                                    variant={app.has_admin_consent ? 'success' : 'neutral'}
                                                    label={app.has_admin_consent ? 'Yes' : 'No'}
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{app.api_permissions_count}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                {app.last_sign_in ? new Date(app.last_sign_in).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {d.items.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 7 : 8} className="py-12 text-center text-sm text-slate-400">
                                                No app registrations match your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {d.pagination && d.pagination.total > 0 && (
                            <PaginationControls
                                currentPage={d.pagination.current_page}
                                lastPage={d.pagination.last_page}
                                perPage={d.pagination.per_page}
                                total={d.pagination.total}
                                onPageChange={(pg) => { setPage(pg); fetchData(pg, perPage, filters, search); }}
                                onPerPageChange={(pp) => { setPerPage(pp); setPage(1); fetchData(1, pp, filters, search); }}
                            />
                        )}
                    </>
                )}
            </div>

            {/* ── OAuth Consent Grants ───────────────────────────────────────── */}
            {d.oauth_consents && d.oauth_consents.length > 0 && (
                <div className="mt-6">
                    <SectionHeader title="OAuth Consent Grants" subtitle="Application permissions and consent grants with risk assessment" />
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Application</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Principal</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Scope</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Risk Level</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Consent Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Granted</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d.oauth_consents.map((consent) => (
                                        <tr key={consent.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{consent.app_name}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{consent.principal_name}</td>
                                            <td className="px-4 py-3 text-xs text-slate-400 max-w-[250px] truncate">{consent.scope}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={riskVariant(consent.risk_level)} label={consent.risk_level} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{consent.consent_type}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                {consent.granted_at ? new Date(consent.granted_at).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
