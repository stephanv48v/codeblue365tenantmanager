import AppLayout from '../../Layouts/AppLayout';
import {
    SignalIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import PageHeader from '../../Components/PageHeader';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useServiceHealthData } from './hooks/useServiceHealthData';

const classificationVariant = (classification: string) => {
    return classification === 'incident' ? 'critical' as const : 'info' as const;
};

const statusVariant = (status: string) => {
    switch (status) {
        case 'serviceOperational': return 'success' as const;
        case 'resolved': return 'success' as const;
        case 'investigating': return 'warning' as const;
        case 'serviceInterruption': return 'critical' as const;
        case 'serviceRestored': return 'info' as const;
        default: return 'neutral' as const;
    }
};

export default function ServiceHealthIndex() {
    const { overview, loading } = useServiceHealthData();

    if (loading) {
        return (
            <AppLayout title="Service Health">
                <PageHeader title="Service Health" subtitle="Microsoft 365 service status" />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = overview!;

    const eventsByService = d.events_by_service.map((s) => ({
        name: s.service,
        events: s.count,
    }));

    return (
        <AppLayout title="Service Health">
            <PageHeader
                title="Service Health"
                subtitle="Microsoft 365 service status across managed tenants"
                breadcrumbs={[{ label: 'Service Health' }]}
            />

            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard
                    label="Active Incidents"
                    value={d.active_incidents}
                    icon={ExclamationTriangleIcon}
                    accentColor={d.active_incidents > 0 ? 'red' : 'emerald'}
                />
                <StatCard label="Advisories" value={d.advisories} icon={InformationCircleIcon} accentColor="amber" />
                <StatCard label="Affected Services" value={d.affected_services} icon={SignalIcon} accentColor="blue" />
                <StatCard label="Resolved (7d)" value={d.resolved_7d} icon={CheckCircleIcon} accentColor="emerald" />
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <ChartCard title="Events by Service" className="lg:col-span-5">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={eventsByService} layout="vertical">
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="events" name="Events" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Events Timeline */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
                    <h3 className="mb-4 text-sm font-semibold text-slate-800">Recent Events</h3>
                    <div className="space-y-3 max-h-[280px] overflow-y-auto">
                        {d.recent_events.map((event) => (
                            <div key={event.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                                <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                                    event.classification === 'incident' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                    {event.classification === 'incident' ? (
                                        <ExclamationTriangleIcon className="h-4 w-4" />
                                    ) : (
                                        <InformationCircleIcon className="h-4 w-4" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-slate-800">{event.service}</span>
                                        <StatusBadge variant={classificationVariant(event.classification)} label={event.classification} size="sm" />
                                        <StatusBadge variant={statusVariant(event.status)} label={event.status} size="sm" />
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">{event.title}</p>
                                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                                        <span>{event.customer_name ?? event.tenant_id.slice(0, 8)}</span>
                                        {event.start_at && <span>{new Date(event.start_at).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {d.recent_events.length === 0 && (
                            <div className="py-8 text-center text-sm text-slate-400">
                                No service health events recorded.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
