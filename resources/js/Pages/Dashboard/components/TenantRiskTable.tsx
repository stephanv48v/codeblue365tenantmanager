import { router } from '@inertiajs/react';

type ScoreEntry = {
    tenant_id: string;
    customer_name: string;
    security_posture: number;
    composite_score: number;
    calculated_at: string;
};

type Props = { scoreDistribution: ScoreEntry[] };

function scoreColor(score: number): string {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
}

function textColor(score: number): string {
    if (score >= 70) return 'text-emerald-700';
    if (score >= 50) return 'text-amber-700';
    return 'text-red-700';
}

export default function TenantRiskTable({ scoreDistribution }: Props) {
    const sorted = [...scoreDistribution].sort((a, b) => a.composite_score - b.composite_score);
    const top10 = sorted.slice(0, 10);

    if (top10.length === 0) {
        return <p className="py-8 text-center text-sm text-slate-400">No tenant scores available.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                        <th className="px-3 py-2 w-10">#</th>
                        <th className="px-3 py-2">Tenant</th>
                        <th className="px-3 py-2 w-40">Composite Score</th>
                        <th className="px-3 py-2 w-24 text-right">Security</th>
                    </tr>
                </thead>
                <tbody>
                    {top10.map((t, idx) => (
                        <tr
                            key={t.tenant_id}
                            onClick={() => router.visit(`/tenants/${t.tenant_id}`)}
                            className="border-b last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            <td className="px-3 py-2.5 text-xs text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2.5">
                                <p className="font-medium text-slate-800">{t.customer_name || t.tenant_id.slice(0, 16)}</p>
                            </td>
                            <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${scoreColor(t.composite_score)}`}
                                            style={{ width: `${t.composite_score}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold w-8 text-right ${textColor(t.composite_score)}`}>
                                        {t.composite_score}
                                    </span>
                                </div>
                            </td>
                            <td className={`px-3 py-2.5 text-right text-xs font-semibold ${textColor(t.security_posture)}`}>
                                {t.security_posture}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
