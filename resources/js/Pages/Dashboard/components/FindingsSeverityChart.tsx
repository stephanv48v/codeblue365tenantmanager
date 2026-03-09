import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { router } from '@inertiajs/react';

type Props = { data: Array<{ severity: string; count: number }> };

const COLORS: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
};

const ORDER = ['critical', 'high', 'medium', 'low'];

export default function FindingsSeverityChart({ data }: Props) {
    const sorted = [...data].sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));
    const total = sorted.reduce((sum, d) => sum + d.count, 0);

    if (total === 0) {
        return <p className="py-12 text-center text-sm text-slate-400">No open findings.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Pie
                    data={sorted}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="count"
                    nameKey="severity"
                    onClick={() => router.visit('/findings')}
                    cursor="pointer"
                >
                    {sorted.map((entry) => (
                        <Cell key={entry.severity} fill={COLORS[entry.severity] ?? '#94a3b8'} />
                    ))}
                </Pie>
                <Tooltip
                    content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const d = payload[0].payload as { severity: string; count: number };
                        return (
                            <div className="rounded-lg border bg-white px-3 py-2 shadow-lg text-xs">
                                <p className="capitalize font-semibold">{d.severity}</p>
                                <p className="text-slate-500">{d.count} finding(s)</p>
                            </div>
                        );
                    }}
                />
                <Legend
                    formatter={(value: string) => <span className="text-xs capitalize text-slate-600">{value}</span>}
                />
                {/* Center label */}
                <text x="50%" y="42%" textAnchor="middle" className="fill-slate-900 text-2xl font-bold">
                    {total}
                </text>
                <text x="50%" y="50%" textAnchor="middle" className="fill-slate-400 text-xs">
                    total
                </text>
            </PieChart>
        </ResponsiveContainer>
    );
}
