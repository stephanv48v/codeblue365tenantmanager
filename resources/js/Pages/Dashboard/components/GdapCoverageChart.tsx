import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type Props = {
    coverage: { active: number; expired: number; unknown: number; total: number };
    expiringSoon: number;
};

const COLORS = { active: '#10b981', expired: '#ef4444', unknown: '#94a3b8' };

export default function GdapCoverageChart({ coverage, expiringSoon }: Props) {
    const data = [
        { name: 'Active', value: coverage.active, color: COLORS.active },
        { name: 'Expired', value: coverage.expired, color: COLORS.expired },
        { name: 'Unknown', value: coverage.unknown, color: COLORS.unknown },
    ].filter((d) => d.value > 0);

    if (coverage.total === 0) {
        return <p className="py-12 text-center text-sm text-slate-400">No GDAP relationships found.</p>;
    }

    const pct = (n: number) => coverage.total > 0 ? Math.round((n / coverage.total) * 100) : 0;

    return (
        <div>
            <div className="flex items-center gap-6">
                <div className="w-40 h-40 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={60}
                                dataKey="value"
                                strokeWidth={2}
                                stroke="#fff"
                            >
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.[0]) return null;
                                    const d = payload[0].payload as { name: string; value: number };
                                    return (
                                        <div className="rounded-lg border bg-white px-3 py-2 shadow-lg text-xs">
                                            <p className="font-semibold">{d.name}</p>
                                            <p className="text-slate-500">{d.value} relationship(s)</p>
                                        </div>
                                    );
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-sm text-slate-600">Active</span>
                        <span className="ml-auto text-sm font-bold text-slate-800">{coverage.active}</span>
                        <span className="text-xs text-slate-400">({pct(coverage.active)}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-sm text-slate-600">Expired</span>
                        <span className="ml-auto text-sm font-bold text-slate-800">{coverage.expired}</span>
                        <span className="text-xs text-slate-400">({pct(coverage.expired)}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-slate-400" />
                        <span className="text-sm text-slate-600">Unknown</span>
                        <span className="ml-auto text-sm font-bold text-slate-800">{coverage.unknown}</span>
                        <span className="text-xs text-slate-400">({pct(coverage.unknown)}%)</span>
                    </div>
                </div>
            </div>
            {expiringSoon > 0 && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                    {expiringSoon} GDAP relationship(s) expiring within 30 days
                </div>
            )}
        </div>
    );
}
