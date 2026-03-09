import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

type Integration = { id: number; slug: string; name: string; status: string };
type SyncStat = { sync_job: string; total_runs: number; successful: number; failed: number; last_run: string | null };
type RecentError = { tenant_id: string; sync_job: string; started_at: string; finished_at: string | null };

export default function IntegrationHealth() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [syncStats, setSyncStats] = useState<SyncStat[]>([]);
    const [recentErrors, setRecentErrors] = useState<RecentError[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/v1/dashboard/integration-health')
            .then((r) => r.json())
            .then((res) => {
                if (res.success) {
                    setIntegrations(res.data.integrations ?? []);
                    setSyncStats(res.data.sync_stats ?? []);
                    setRecentErrors(res.data.recent_errors ?? []);
                }
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <AppLayout title="Integration Health">
                <p className="text-slate-500">Loading integration health...</p>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Integration Health">
            {/* Integration Status Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {integrations.map((int) => (
                    <div key={int.id} className="rounded-xl border bg-white p-4 shadow-sm">
                        <p className="text-sm font-medium">{int.name}</p>
                        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${int.status === 'active' ? 'bg-emerald-100 text-emerald-700' : int.status === 'configured' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            {int.status}
                        </span>
                    </div>
                ))}
            </div>

            {/* Sync Stats */}
            <div className="mb-6 rounded-xl border bg-white p-6">
                <h3 className="mb-4 font-semibold">Sync Pipeline Stats</h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-xs text-slate-500">
                            <th className="pb-2">Job</th>
                            <th className="pb-2">Total Runs</th>
                            <th className="pb-2">Successful</th>
                            <th className="pb-2">Failed</th>
                            <th className="pb-2">Success Rate</th>
                            <th className="pb-2">Last Run</th>
                        </tr>
                    </thead>
                    <tbody>
                        {syncStats.map((stat) => {
                            const rate = stat.total_runs > 0 ? Math.round((stat.successful / stat.total_runs) * 100) : 0;
                            return (
                                <tr key={stat.sync_job} className="border-b last:border-0">
                                    <td className="py-2 font-mono text-xs">{stat.sync_job}</td>
                                    <td className="py-2">{stat.total_runs}</td>
                                    <td className="py-2 text-emerald-600">{stat.successful}</td>
                                    <td className="py-2 text-red-600">{stat.failed}</td>
                                    <td className="py-2">
                                        <span className={`font-medium ${rate >= 90 ? 'text-emerald-600' : rate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {rate}%
                                        </span>
                                    </td>
                                    <td className="py-2 text-xs text-slate-400">
                                        {stat.last_run ? new Date(stat.last_run).toLocaleString() : 'Never'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Recent Errors */}
            {recentErrors.length > 0 && (
                <div className="rounded-xl border bg-white p-6">
                    <h3 className="mb-4 font-semibold text-red-600">Recent Sync Errors</h3>
                    <div className="space-y-2">
                        {recentErrors.map((err, idx) => (
                            <div key={idx} className="flex items-center gap-4 rounded bg-red-50 px-4 py-2 text-sm">
                                <span className="font-mono text-xs">{err.sync_job}</span>
                                <span className="text-slate-500">{err.tenant_id.slice(0, 12)}...</span>
                                <span className="text-xs text-slate-400">{new Date(err.started_at).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
