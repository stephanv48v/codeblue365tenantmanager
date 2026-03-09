import { useEffect, useState } from 'react';

type NotificationSettings = {
    email_enabled: boolean;
    findings_severity_threshold: string;
    gdap_expiry_warning_days: number;
};

const severityOptions = ['info', 'low', 'medium', 'high', 'critical'];

export default function NotificationsSection() {
    const [settings, setSettings] = useState<NotificationSettings>({
        email_enabled: false,
        findings_severity_threshold: 'high',
        gdap_expiry_warning_days: 30,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetch('/api/v1/settings/group/notifications')
            .then((r) => r.json())
            .then((res) => {
                if (res.success) {
                    const items = res.data.items ?? [];
                    const emailEnabled = items.find((s: { key: string }) => s.key === 'notifications.email_enabled');
                    const severity = items.find((s: { key: string }) => s.key === 'notifications.findings_severity_threshold');
                    const gdapDays = items.find((s: { key: string }) => s.key === 'notifications.gdap_expiry_warning_days');
                    setSettings({
                        email_enabled: emailEnabled?.value ?? false,
                        findings_severity_threshold: severity?.value ?? 'high',
                        gdap_expiry_warning_days: gdapDays?.value ?? 30,
                    });
                }
                setLoading(false);
            });
    }, []);

    const save = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/v1/settings/group/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    settings: [
                        { key: 'notifications.email_enabled', value: settings.email_enabled },
                        { key: 'notifications.findings_severity_threshold', value: settings.findings_severity_threshold },
                        { key: 'notifications.gdap_expiry_warning_days', value: settings.gdap_expiry_warning_days },
                    ],
                }),
            }).then((r) => r.json());
            if (res.success) {
                setMessage({ type: 'success', text: 'Notification settings saved.' });
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

            <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b px-6 py-4">
                    <h3 className="text-base font-semibold text-slate-800">Notification Preferences</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Configure how and when you receive notifications.</p>
                </div>
                <div className="p-6 space-y-6">
                    {/* Email toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-700">Email Notifications</p>
                            <p className="text-xs text-slate-400">Receive email alerts for important events.</p>
                        </div>
                        <button
                            onClick={() => setSettings({ ...settings, email_enabled: !settings.email_enabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.email_enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${settings.email_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Severity threshold */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Findings Severity Threshold</label>
                        <p className="text-xs text-slate-400 mb-2">Only notify for findings at or above this severity.</p>
                        <select
                            value={settings.findings_severity_threshold}
                            onChange={(e) => setSettings({ ...settings, findings_severity_threshold: e.target.value })}
                            className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            {severityOptions.map((s) => (
                                <option key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* GDAP expiry warning */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">GDAP Expiry Warning (days)</label>
                        <p className="text-xs text-slate-400 mb-2">Days before GDAP relationship expiry to send a warning.</p>
                        <input
                            type="number"
                            min={1}
                            max={365}
                            value={settings.gdap_expiry_warning_days}
                            onChange={(e) => setSettings({ ...settings, gdap_expiry_warning_days: parseInt(e.target.value) || 30 })}
                            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Webhook placeholder */}
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                        <p className="text-sm text-slate-500 font-medium">Webhook Integrations</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Slack, Microsoft Teams, and custom webhook integrations coming soon.
                        </p>
                    </div>

                    <button
                        onClick={save}
                        disabled={saving}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>
        </div>
    );
}
