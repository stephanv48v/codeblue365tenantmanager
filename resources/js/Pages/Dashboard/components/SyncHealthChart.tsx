import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type SyncStat = {
    sync_job: string;
    total_runs: number;
    successful: number;
    failed: number;
    last_run: string | null;
};

type SyncSummary = { completed: number; failed: number; pending: number; total: number };

type Props = {
    syncStats: SyncStat[];
    syncSummary: SyncSummary;
};

function formatJobName(name: string): string {
    return name.replace(/^SyncTenant/, '').replace(/Job$/, '');
}

export default function SyncHealthChart({ syncStats, syncSummary }: Props) {
    const chartData = syncStats.map((s) => ({
        name: formatJobName(s.sync_job),
        Successful: s.successful,
        Failed: s.failed,
    }));

    return (
        <div>
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div className="rounded-lg border bg-white px-3 py-2 shadow-lg text-xs">
                                        <p className="font-semibold text-slate-800 mb-1">{label}</p>
                                        {payload.map((p) => (
                                            <p key={p.dataKey as string} style={{ color: p.color as string }}>
                                                {p.dataKey}: {p.value}
                                            </p>
                                        ))}
                                    </div>
                                );
                            }}
                        />
                        <Legend
                            formatter={(value: string) => <span className="text-xs text-slate-600">{value}</span>}
                        />
                        <Bar dataKey="Successful" fill="#10b981" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Failed" fill="#ef4444" radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="py-12 text-center text-sm text-slate-400">No sync data available.</p>
            )}

            {/* Summary bar */}
            <div className="mt-4 flex gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-500">Completed</span>
                    <span className="font-bold text-slate-700">{syncSummary.completed}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-slate-500">Failed</span>
                    <span className="font-bold text-slate-700">{syncSummary.failed}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="text-slate-500">Pending</span>
                    <span className="font-bold text-slate-700">{syncSummary.pending}</span>
                </div>
            </div>
        </div>
    );
}
