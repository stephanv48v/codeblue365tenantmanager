import { useEffect, useState } from 'react';

const defaultWeights: Record<string, number> = {
    identity_currency: 0.20,
    device_currency: 0.15,
    app_currency: 0.10,
    security_posture: 0.25,
    governance_readiness: 0.15,
    integration_readiness: 0.15,
};

const labels: Record<string, string> = {
    identity_currency: 'Identity Currency',
    device_currency: 'Device Currency',
    app_currency: 'App Currency',
    security_posture: 'Security Posture',
    governance_readiness: 'Governance Readiness',
    integration_readiness: 'Integration Readiness',
};

export default function ScoringSection() {
    const [weights, setWeights] = useState<Record<string, number>>({ ...defaultWeights });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetch('/api/v1/settings/group/scoring')
            .then((r) => r.json())
            .then((res) => {
                if (res.success) {
                    const item = (res.data.items ?? []).find((s: { key: string }) => s.key === 'scoring.weights');
                    if (item?.value && typeof item.value === 'object') {
                        setWeights({ ...defaultWeights, ...item.value });
                    }
                }
                setLoading(false);
            });
    }, []);

    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    const sumValid = Math.abs(sum - 1.0) < 0.01;

    const save = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/v1/settings/group/scoring', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    settings: [{ key: 'scoring.weights', value: weights }],
                }),
            }).then((r) => r.json());
            if (res.success) {
                setMessage({ type: 'success', text: 'Scoring weights saved.' });
            } else {
                setMessage({ type: 'error', text: res.error?.message ?? 'Failed to save.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error.' });
        } finally {
            setSaving(false);
        }
    };

    const reset = () => setWeights({ ...defaultWeights });

    if (loading) return <p className="text-slate-400">Loading...</p>;

    return (
        <div className="space-y-6">
            {message && (
                <div className={`rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h3 className="text-base font-semibold text-slate-800">Scoring Weights</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Configure the relative weight of each scoring category. Weights must sum to 1.0.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${sumValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            Sum: {sum.toFixed(2)}
                        </span>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {Object.entries(labels).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-4">
                            <label className="w-48 text-sm font-medium text-slate-700">{label}</label>
                            <input
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                                value={weights[key] ?? 0}
                                onChange={(e) => setWeights({ ...weights, [key]: parseFloat(e.target.value) || 0 })}
                                className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-blue-500 transition-all"
                                        style={{ width: `${(weights[key] ?? 0) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-3 pt-3">
                        <button
                            onClick={save}
                            disabled={saving || !sumValid}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Weights'}
                        </button>
                        <button
                            onClick={reset}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
