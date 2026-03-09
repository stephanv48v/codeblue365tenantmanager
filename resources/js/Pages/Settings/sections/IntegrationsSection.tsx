import { useEffect, useState } from 'react';

type Integration = {
    id: number;
    name: string;
    provider: string;
    status: string;
    enabled: boolean;
};

type IntegrationSettings = {
    sync_interval: number;
    auto_sync: boolean;
};

export default function IntegrationsSection() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [settings, setSettings] = useState<IntegrationSettings>({ sync_interval: 60, auto_sync: true });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/v1/integrations').then((r) => r.json()),
            fetch('/api/v1/settings/group/integrations').then((r) => r.json()),
        ]).then(([intRes, setRes]) => {
            if (intRes.success) setIntegrations(intRes.data.items ?? []);
            if (setRes.success) {
                const items = setRes.data.items ?? [];
                const interval = items.find((s: { key: string }) => s.key === 'integrations.sync_interval_minutes');
                const autoSync = items.find((s: { key: string }) => s.key === 'integrations.auto_sync_enabled');
                setSettings({
                    sync_interval: interval?.value ?? 60,
                    auto_sync: autoSync?.value ?? true,
                });
            }
            setLoading(false);
        });
    }, []);

    const saveSettings = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/v1/settings/group/integrations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    settings: [
                        { key: 'integrations.sync_interval_minutes', value: settings.sync_interval },
                        { key: 'integrations.auto_sync_enabled', value: settings.auto_sync },
                    ],
                }),
            }).then((r) => r.json());
            if (res.success) {
                setMessage({ type: 'success', text: 'Integration settings saved.' });
            } else {
                setMessage({ type: 'error', text: res.error?.message ?? 'Failed to save.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p className="text-slate-400">Loading...</p>;

    return (
        <div className="space-y-6">
            {message && (
                <div className={`rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Global Config */}
            <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b px-6 py-4">
                    <h3 className="text-base font-semibold text-slate-800">Sync Configuration</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Global sync settings for all integrations.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-700">Auto-Sync Enabled</p>
                            <p className="text-xs text-slate-400">Automatically sync data from all enabled integrations.</p>
                        </div>
                        <button
                            onClick={() => setSettings({ ...settings, auto_sync: !settings.auto_sync })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.auto_sync ? 'bg-blue-600' : 'bg-slate-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${settings.auto_sync ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sync Interval (minutes)</label>
                        <input
                            type="number"
                            min={5}
                            max={1440}
                            value={settings.sync_interval}
                            onChange={(e) => setSettings({ ...settings, sync_interval: parseInt(e.target.value) || 60 })}
                            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>

            {/* Integration List */}
            <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b px-6 py-4">
                    <h3 className="text-base font-semibold text-slate-800">Integrations ({integrations.length})</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Enable or disable individual data source integrations.</p>
                </div>
                <div className="divide-y">
                    {integrations.map((integration) => (
                        <div key={integration.id} className="flex items-center justify-between px-6 py-4">
                            <div>
                                <p className="text-sm font-medium text-slate-800">{integration.name}</p>
                                <p className="text-xs text-slate-400">
                                    {integration.provider} &middot;{' '}
                                    <span className={integration.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}>
                                        {integration.status}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIntegrations(integrations.map((i) =>
                                        i.id === integration.id ? { ...i, enabled: !i.enabled } : i
                                    ));
                                }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${integration.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${integration.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    ))}
                    {integrations.length === 0 && (
                        <p className="px-6 py-8 text-center text-sm text-slate-400">No integrations configured.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
