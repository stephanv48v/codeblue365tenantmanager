import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { BellAlertIcon, CheckCircleIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

type Alert = {
    id: number;
    tenant_id: string;
    type: string;
    severity: string;
    title: string;
    message: string | null;
    status: string;
    acknowledged_by: string | null;
    acknowledged_at: string | null;
    created_at: string;
};

const severityVariant = (severity: string) => {
    switch (severity) {
        case 'critical': return 'critical' as const;
        case 'high': return 'high' as const;
        case 'medium': return 'medium' as const;
        case 'low': return 'low' as const;
        default: return 'info' as const;
    }
};

export default function AlertsIndex() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetch('/api/v1/alerts')
            .then((r) => r.json())
            .then((res) => {
                if (res.success) setAlerts(res.data.items ?? []);
                setLoading(false);
            });
    }, []);

    const handleAcknowledge = async (id: number) => {
        await fetch(`/api/v1/alerts/${id}/acknowledge`, { method: 'PUT' });
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'acknowledged' } : a)));
    };

    const handleDismiss = async (id: number) => {
        await fetch(`/api/v1/alerts/${id}/dismiss`, { method: 'PUT' });
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'dismissed' } : a)));
    };

    const openCount = alerts.filter((a) => a.status === 'open').length;
    const ackCount = alerts.filter((a) => a.status === 'acknowledged').length;
    const dismissedCount = alerts.filter((a) => a.status === 'dismissed').length;

    const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.status === filter);

    return (
        <AppLayout title="Alerts">
            <PageHeader
                title="Alerts"
                subtitle="System alerts and notifications"
                breadcrumbs={[{ label: 'Security & Compliance' }, { label: 'Alerts' }]}
            />

            {!loading && (
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <StatCard label="Total" value={alerts.length} icon={BellAlertIcon} accentColor="blue" />
                    <StatCard label="Open" value={openCount} accentColor={openCount > 0 ? 'red' : 'emerald'} />
                    <StatCard label="Acknowledged" value={ackCount} icon={EyeIcon} accentColor="amber" />
                    <StatCard label="Dismissed" value={dismissedCount} icon={CheckCircleIcon} accentColor="slate" />
                </div>
            )}

            {/* Filter Tabs */}
            <div className="mb-6 flex flex-wrap gap-2">
                {['all', 'open', 'acknowledged', 'dismissed'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            filter === status
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                        type="button"
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <SkeletonLoader variant="table-row" count={6} />
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {filtered.map((alert) => (
                            <div key={alert.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50">
                                <StatusBadge variant={severityVariant(alert.severity)} label={alert.severity} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-800">{alert.title}</p>
                                    {alert.message && <p className="mt-0.5 text-xs text-slate-500 truncate">{alert.message}</p>}
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {alert.tenant_id.slice(0, 12)}... · {new Date(alert.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <StatusBadge
                                    variant={alert.status === 'open' ? 'critical' : alert.status === 'acknowledged' ? 'warning' : 'neutral'}
                                    label={alert.status}
                                    dot
                                />
                                {alert.status === 'open' && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleAcknowledge(alert.id)}
                                            className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                                        >
                                            <EyeIcon className="h-3.5 w-3.5" /> Ack
                                        </button>
                                        <button
                                            onClick={() => handleDismiss(alert.id)}
                                            className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                                        >
                                            <XMarkIcon className="h-3.5 w-3.5" /> Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="px-6 py-12 text-center text-sm text-slate-400">No alerts found.</div>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
