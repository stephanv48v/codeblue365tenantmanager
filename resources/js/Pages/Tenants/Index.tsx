import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import {
    BuildingOfficeIcon,
    ShieldCheckIcon,
    ClockIcon,
    ArrowPathIcon,
    PlusIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';

type Tenant = {
    tenant_id: string;
    customer_name: string;
    primary_domain: string;
    gdap_status: string;
    gdap_expiry_at?: string | null;
    last_sync_at?: string | null;
    assigned_engineer?: string | null;
    support_tier?: string | null;
};

type TenantFormState = {
    tenant_id: string;
    customer_name: string;
    primary_domain: string;
    support_tier: string;
    assigned_engineer: string;
};

const emptyForm: TenantFormState = {
    tenant_id: '',
    customer_name: '',
    primary_domain: '',
    support_tier: '',
    assigned_engineer: '',
};

const gdapVariant = (status: string) => {
    switch (status) {
        case 'active': return 'active' as const;
        case 'pending': return 'pending' as const;
        case 'expired': return 'expired' as const;
        default: return 'neutral' as const;
    }
};

function relativeTime(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function TenantsIndex() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [form, setForm] = useState<TenantFormState>(emptyForm);
    const [showForm, setShowForm] = useState(false);

    const loadTenants = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/v1/tenants');
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error?.message ?? 'Failed to load tenants.');
            setTenants(payload?.data?.items ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load tenants.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void loadTenants(); }, [loadTenants]);

    const onCreateTenant = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);
        setError(null);
        try {
            const response = await fetch('/api/v1/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(form),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.message ?? payload?.error?.message ?? 'Failed to create tenant.');
            setForm(emptyForm);
            setShowForm(false);
            setMessage('Tenant created successfully.');
            await loadTenants();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create tenant.');
        }
    };

    const onSyncTenant = async (tenantId: string) => {
        setMessage(null);
        setError(null);
        try {
            const response = await fetch(`/api/v1/sync/tenant/${tenantId}`, { method: 'POST', headers: { Accept: 'application/json' } });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.message ?? payload?.error?.message ?? 'Failed to queue sync.');
            setMessage(`Sync queued for tenant ${tenantId}.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to queue sync.');
        }
    };

    const activeGdap = tenants.filter((t) => t.gdap_status === 'active').length;
    const expiringGdap = tenants.filter((t) => {
        if (t.gdap_status !== 'active' || !t.gdap_expiry_at) return false;
        const daysToExpiry = (new Date(t.gdap_expiry_at).getTime() - Date.now()) / 86400000;
        return daysToExpiry <= 30 && daysToExpiry > 0;
    }).length;
    const staleCount = tenants.filter((t) => {
        if (!t.last_sync_at) return true;
        return (Date.now() - new Date(t.last_sync_at).getTime()) > 7 * 86400000;
    }).length;

    return (
        <AppLayout title="Managed Tenants">
            <PageHeader
                title="Tenants"
                subtitle="Manage your Microsoft 365 customer tenants"
                breadcrumbs={[{ label: 'Customers' }, { label: 'Tenants' }]}
                actions={
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add Tenant
                        <ChevronDownIcon className={`h-3 w-3 transition-transform ${showForm ? 'rotate-180' : ''}`} />
                    </button>
                }
            />

            {/* Stat Cards */}
            {!loading && (
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <StatCard label="Total Tenants" value={tenants.length} icon={BuildingOfficeIcon} accentColor="blue" />
                    <StatCard
                        label="Active GDAP"
                        value={activeGdap}
                        icon={ShieldCheckIcon}
                        accentColor="emerald"
                        badge={expiringGdap > 0 ? { text: `${expiringGdap} expiring`, color: 'amber' } : undefined}
                    />
                    <StatCard
                        label="Stale Tenants"
                        value={staleCount}
                        icon={ClockIcon}
                        accentColor={staleCount > 0 ? 'amber' : 'emerald'}
                        subtitle="No sync in 7+ days"
                    />
                    <StatCard label="Sync Active" value={tenants.length - staleCount} icon={ArrowPathIcon} accentColor="emerald" />
                </div>
            )}

            {/* Collapsible Add Tenant Form */}
            {showForm && (
                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
                    <h3 className="mb-4 text-sm font-semibold text-slate-800">Add New Tenant</h3>
                    <form onSubmit={onCreateTenant} className="grid gap-3 md:grid-cols-2">
                        <div className="flex flex-col gap-1">
                            <label htmlFor="tenant_id" className="text-xs font-medium text-slate-700">Tenant ID</label>
                            <input id="tenant_id" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Tenant ID" value={form.tenant_id} onChange={(e) => setForm((p) => ({ ...p, tenant_id: e.target.value }))} required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="customer_name" className="text-xs font-medium text-slate-700">Customer Name</label>
                            <input id="customer_name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Customer Name" value={form.customer_name} onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))} required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="primary_domain" className="text-xs font-medium text-slate-700">Primary Domain</label>
                            <input id="primary_domain" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Primary Domain" value={form.primary_domain} onChange={(e) => setForm((p) => ({ ...p, primary_domain: e.target.value }))} required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="support_tier" className="text-xs font-medium text-slate-700">Support Tier</label>
                            <input id="support_tier" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Support Tier" value={form.support_tier} onChange={(e) => setForm((p) => ({ ...p, support_tier: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-2">
                            <label htmlFor="assigned_engineer" className="text-xs font-medium text-slate-700">Assigned Engineer</label>
                            <input id="assigned_engineer" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Assigned Engineer" value={form.assigned_engineer} onChange={(e) => setForm((p) => ({ ...p, assigned_engineer: e.target.value }))} />
                        </div>
                        <div className="flex gap-2">
                            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" type="submit">Create Tenant</button>
                            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50" type="button" onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

            {/* Tenant Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Domain</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">GDAP</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tier</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Sync</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-0"><SkeletonLoader variant="table-row" count={8} /></td></tr>
                            ) : tenants.length === 0 ? (
                                <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">No tenants found. Add your first tenant above.</td></tr>
                            ) : tenants.map((tenant) => (
                                <tr key={tenant.tenant_id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <Link href={`/tenants/${tenant.tenant_id}`} className="font-medium text-blue-600 hover:text-blue-800">
                                            {tenant.customer_name}
                                        </Link>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{tenant.primary_domain}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <StatusBadge variant={gdapVariant(tenant.gdap_status)} label={tenant.gdap_status} dot />
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{tenant.support_tier ?? '-'}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">{relativeTime(tenant.last_sync_at)}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <button
                                            className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                            onClick={() => void onSyncTenant(tenant.tenant_id)}
                                            type="button"
                                        >
                                            <ArrowPathIcon className="h-3.5 w-3.5" />
                                            Sync
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
