import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

type AuditLog = {
    id: number;
    event_type: string;
    actor_identifier: string | null;
    payload: string | null;
    created_at: string;
};

export default function AdminIndex() {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/v1/admin/audit-logs')
            .then((r) => r.json())
            .then((res) => {
                if (res.success) setAuditLogs(res.data.items ?? []);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <AppLayout title="Audit Logs">
                <p className="text-slate-500">Loading audit logs...</p>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Audit Logs">
            <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b px-6 py-4">
                    <h3 className="text-base font-semibold text-slate-800">Audit Logs</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Track all administrative actions and system events.</p>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                            <th className="px-6 py-3">Event</th>
                            <th className="px-6 py-3">Actor</th>
                            <th className="px-6 py-3">Payload</th>
                            <th className="px-6 py-3">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.map((log) => (
                            <tr key={log.id} className="border-b last:border-0">
                                <td className="px-6 py-3">
                                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono">
                                        {log.event_type}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-slate-500">{log.actor_identifier ?? 'system'}</td>
                                <td className="max-w-xs truncate px-6 py-3 text-xs text-slate-400">
                                    {log.payload ?? '-'}
                                </td>
                                <td className="px-6 py-3 text-xs text-slate-400">
                                    {new Date(log.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {auditLogs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                    No audit logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
