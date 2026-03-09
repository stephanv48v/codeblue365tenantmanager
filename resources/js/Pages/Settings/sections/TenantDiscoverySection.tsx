import { useEffect, useState } from 'react';

type DiscoveredTenant = {
    tenantId: string;
    displayName: string;
    defaultDomainName: string;
    gdapStatus: string;
    gdapExpiry: string | null;
    already_imported?: boolean;
};

const gdapBadge: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    expiring_soon: 'bg-amber-100 text-amber-700',
    pending: 'bg-blue-100 text-blue-700',
    expired: 'bg-red-100 text-red-700',
};

export default function TenantDiscoverySection() {
    const [connected, setConnected] = useState<boolean | null>(null);
    const [tenants, setTenants] = useState<DiscoveredTenant[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [discovering, setDiscovering] = useState(false);
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetch('/api/v1/settings/partner-tenant')
            .then((r) => r.json())
            .then((res) => {
                if (res.success) {
                    setConnected(res.data.connection_status === 'connected');
                }
            });
    }, []);

    const discover = async () => {
        setDiscovering(true);
        setMessage(null);
        try {
            const res = await fetch('/api/v1/settings/tenant-discovery/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            }).then((r) => r.json());
            if (res.success) {
                setTenants(res.data.tenants ?? []);
                setSelected(new Set());
                setMessage({ type: 'success', text: `Discovered ${res.data.tenants?.length ?? 0} tenant(s).` });
            } else {
                setMessage({ type: 'error', text: res.error?.message ?? 'Discovery failed.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error.' });
        } finally {
            setDiscovering(false);
        }
    };

    const importSelected = async () => {
        setImporting(true);
        setMessage(null);
        try {
            const res = await fetch('/api/v1/settings/tenant-discovery/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ tenant_ids: Array.from(selected) }),
            }).then((r) => r.json());
            if (res.success) {
                setMessage({ type: 'success', text: res.data.message });
                discover();
            } else {
                setMessage({ type: 'error', text: res.error?.message ?? 'Import failed.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error.' });
        } finally {
            setImporting(false);
        }
    };

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        const importable = tenants.filter((t) => !t.already_imported);
        if (selected.size === importable.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(importable.map((t) => t.tenantId)));
        }
    };

    if (connected === null) return <p className="text-slate-400">Loading...</p>;

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h3 className="text-base font-semibold text-slate-800">Tenant Discovery</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Discover customer tenants delegated to your partner tenant via GDAP.
                        </p>
                    </div>
                    <button
                        onClick={discover}
                        disabled={discovering || !connected}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {discovering ? 'Discovering...' : 'Discover Tenants'}
                    </button>
                </div>

                <div className="p-6">
                    {!connected && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                            Partner tenant must be connected before running discovery. Go to the Partner Tenant section to configure and test your connection.
                        </div>
                    )}

                    {message && (
                        <div className={`rounded-lg px-4 py-3 text-sm mb-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    {tenants.length > 0 && (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                                            <th className="px-4 py-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.size === tenants.filter((t) => !t.already_imported).length && selected.size > 0}
                                                    onChange={toggleAll}
                                                    className="rounded border-slate-300"
                                                />
                                            </th>
                                            <th className="px-4 py-3">Tenant Name</th>
                                            <th className="px-4 py-3">Domain</th>
                                            <th className="px-4 py-3">GDAP Status</th>
                                            <th className="px-4 py-3">Expiry</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tenants.map((t) => (
                                            <tr key={t.tenantId} className="border-b last:border-0">
                                                <td className="px-4 py-3">
                                                    {t.already_imported ? (
                                                        <input type="checkbox" disabled checked className="rounded border-slate-300 opacity-50" />
                                                    ) : (
                                                        <input
                                                            type="checkbox"
                                                            checked={selected.has(t.tenantId)}
                                                            onChange={() => toggle(t.tenantId)}
                                                            className="rounded border-slate-300"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-800">{t.displayName}</td>
                                                <td className="px-4 py-3 text-slate-500">{t.defaultDomainName}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${gdapBadge[t.gdapStatus] ?? 'bg-slate-100 text-slate-500'}`}>
                                                        {t.gdapStatus}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-400">
                                                    {t.gdapExpiry ? new Date(t.gdapExpiry).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {t.already_imported ? (
                                                        <span className="text-xs text-emerald-600 font-medium">Imported</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">Not imported</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {selected.size > 0 && (
                                <div className="mt-4 flex items-center gap-3">
                                    <button
                                        onClick={importSelected}
                                        disabled={importing}
                                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        {importing ? 'Importing...' : `Import ${selected.size} Tenant(s)`}
                                    </button>
                                    <span className="text-xs text-slate-400">{selected.size} selected</span>
                                </div>
                            )}
                        </>
                    )}

                    {connected && tenants.length === 0 && !discovering && (
                        <p className="text-sm text-slate-400 py-4 text-center">
                            Click "Discover Tenants" to find customer tenants delegated via GDAP.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
