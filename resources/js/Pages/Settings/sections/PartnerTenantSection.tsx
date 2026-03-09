import { useEffect, useState } from 'react';

type PartnerTenant = {
    tenant_id: string | null;
    display_name: string | null;
    primary_domain: string | null;
    client_id: string | null;
    connection_status: string;
    last_verified_at: string | null;
    has_client_secret: boolean;
};

const statusColors: Record<string, string> = {
    connected: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    not_connected: 'bg-slate-100 text-slate-500',
};

export default function PartnerTenantSection() {
    const [data, setData] = useState<PartnerTenant | null>(null);
    const [form, setForm] = useState({
        tenant_id: '',
        display_name: '',
        primary_domain: '',
        client_id: '',
        client_secret: '',
    });
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const load = () => {
        fetch('/api/v1/settings/partner-tenant')
            .then((r) => r.json())
            .then((res) => {
                if (res.success) {
                    setData(res.data);
                    setForm({
                        tenant_id: res.data.tenant_id ?? '',
                        display_name: res.data.display_name ?? '',
                        primary_domain: res.data.primary_domain ?? '',
                        client_id: res.data.client_id ?? '',
                        client_secret: '',
                    });
                }
            });
    };

    useEffect(() => { load(); }, []);

    const save = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/v1/settings/partner-tenant', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(form),
            }).then((r) => r.json());
            if (res.success) {
                setMessage({ type: 'success', text: 'Partner tenant saved.' });
                load();
            } else {
                setMessage({ type: 'error', text: res.error?.message ?? 'Failed to save.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error.' });
        } finally {
            setSaving(false);
        }
    };

    const testConnection = async () => {
        setTesting(true);
        setMessage(null);
        try {
            const res = await fetch('/api/v1/settings/partner-tenant/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            }).then((r) => r.json());
            if (res.success) {
                setMessage({ type: 'success', text: 'Connection successful!' });
                load();
            } else {
                setMessage({ type: 'error', text: res.error?.message ?? 'Connection failed.' });
                load();
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error.' });
        } finally {
            setTesting(false);
        }
    };

    if (!data) return <p className="text-slate-400">Loading...</p>;

    const statusLabel = data.connection_status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h3 className="text-base font-semibold text-slate-800">Partner Tenant Connection</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Connect your MSP's Microsoft 365 tenant to enable GDAP management.
                        </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[data.connection_status] ?? statusColors.not_connected}`}>
                        {statusLabel}
                    </span>
                </div>

                <div className="p-6 space-y-4">
                    {message && (
                        <div className={`rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tenant ID</label>
                            <input
                                type="text"
                                value={form.tenant_id}
                                onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                            <input
                                type="text"
                                value={form.display_name}
                                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                                placeholder="My MSP Tenant"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Primary Domain</label>
                            <input
                                type="text"
                                value={form.primary_domain}
                                onChange={(e) => setForm({ ...form, primary_domain: e.target.value })}
                                placeholder="mymsp.onmicrosoft.com"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Client ID</label>
                            <input
                                type="text"
                                value={form.client_id}
                                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                                placeholder="App Registration Client ID"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Client Secret {data.has_client_secret && <span className="text-xs text-slate-400">(stored - leave blank to keep)</span>}
                        </label>
                        <input
                            type="password"
                            value={form.client_secret}
                            onChange={(e) => setForm({ ...form, client_secret: e.target.value })}
                            placeholder={data.has_client_secret ? '••••••••' : 'Enter client secret'}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {data.last_verified_at && (
                        <p className="text-xs text-slate-400">
                            Last verified: {new Date(data.last_verified_at).toLocaleString()}
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={save}
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                        <button
                            onClick={testConnection}
                            disabled={testing || !data.tenant_id}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            {testing ? 'Testing...' : 'Test Connection'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
