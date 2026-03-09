import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { router } from '@inertiajs/react';
import type { ScoreEntry } from '../hooks/useDashboardData';

type Props = { scores: ScoreEntry[] };

export default function ScoreTrendChart({ scores }: Props) {
    const sorted = [...scores].sort((a, b) => new Date(a.calculated_at).getTime() - new Date(b.calculated_at).getTime());

    if (sorted.length === 0) {
        return <p className="py-12 text-center text-sm text-slate-400">No score data available yet.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sorted} onClick={(e) => {
                if (e?.activePayload?.[0]?.payload?.tenant_id) {
                    router.visit(`/tenants/${e.activePayload[0].payload.tenant_id}`);
                }
            }}>
                <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    dataKey="calculated_at"
                    tickFormatter={(v: string) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip
                    content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const d = payload[0].payload as ScoreEntry;
                        return (
                            <div className="rounded-lg border bg-white px-3 py-2 shadow-lg text-xs">
                                <p className="font-semibold text-slate-800">{d.customer_name || d.tenant_id.slice(0, 12)}</p>
                                <p className="text-slate-500">Score: <span className="font-bold text-slate-900">{d.composite_score}</span></p>
                                <p className="text-slate-400">{new Date(d.calculated_at).toLocaleString()}</p>
                            </div>
                        );
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="composite_score"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#scoreGradient)"
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#059669', cursor: 'pointer' }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
