import { useEffect, useState } from 'react';

type ThresholdSetting = {
    id: number;
    key: string;
    value: unknown;
    group: string;
    description: string | null;
};

const thresholdConfigs: Record<string, { label: string; description: string; suffix: string; defaultValue: number; min: number; max: number }> = {
    mfa_coverage_min: { label: 'MFA Coverage Minimum', description: 'Alert when MFA coverage drops below this percentage', suffix: '%', defaultValue: 90, min: 0, max: 100 },
    stale_days: { label: 'Stale Account Threshold', description: 'Mark users as stale after this many days of inactivity', suffix: ' days', defaultValue: 90, min: 7, max: 365 },
    license_waste_max: { label: 'License Waste Maximum', description: 'Alert when license waste exceeds this percentage', suffix: '%', defaultValue: 10, min: 0, max: 100 },
    device_compliance_min: { label: 'Device Compliance Minimum', description: 'Alert when device compliance drops below this percentage', suffix: '%', defaultValue: 90, min: 0, max: 100 },
    secure_score_min: { label: 'Secure Score Minimum', description: 'Alert when Microsoft Secure Score drops below this percentage', suffix: '%', defaultValue: 50, min: 0, max: 100 },
};

export default function ThresholdsSection() {
    const [thresholds, setThresholds] = useState<ThresholdSetting[]>([]);
    const [values, setValues] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch('/api/v1/settings/group/thresholds')
            .then((r) => r.json())
            .then((res) => {
                if (res.success) {
                    setThresholds(res.data.items ?? []);
                    const vals: Record<string, number> = {};
                    for (const item of res.data.items ?? []) {
                        if (typeof item.value === 'number') vals[item.key] = item.value;
                    }
                    setValues(vals);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const getValue = (key: string): number => {
        return values[key] ?? thresholdConfigs[key]?.defaultValue ?? 0;
    };

    const handleSave = async () => {
        setSaving(true);
        const settings = Object.keys(thresholdConfigs).map((key) => ({
            key,
            value: getValue(key),
        }));

        try {
            const res = await fetch('/api/v1/settings/group/thresholds', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });
            const data = await res.json();
            if (data.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="text-base font-semibold text-slate-800">Alert Thresholds</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                    Configure the thresholds used by the findings engine to generate alerts.
                </p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
                    ))}
                </div>
            ) : (
                <>
                    {Object.entries(thresholdConfigs).map(([key, config]) => (
                        <div key={key} className="rounded-xl border border-slate-200 bg-white p-5">
                            <label className="text-sm font-medium text-slate-700">{config.label}</label>
                            <p className="mt-0.5 text-xs text-slate-400">{config.description}</p>
                            <div className="mt-3 flex items-center gap-3">
                                <input
                                    type="range"
                                    value={getValue(key)}
                                    onChange={(e) => setValues((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                                    min={config.min}
                                    max={config.max}
                                    className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
                                />
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={getValue(key)}
                                        onChange={(e) => setValues((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                                        min={config.min}
                                        max={config.max}
                                        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-400">{config.suffix}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Thresholds'}
                        </button>
                        {saved && (
                            <span className="text-sm font-medium text-emerald-600">Thresholds saved successfully</span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
