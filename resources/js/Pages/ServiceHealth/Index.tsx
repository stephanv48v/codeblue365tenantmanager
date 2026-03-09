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
import SectionHeader from '../../Components/SectionHeader';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
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
    const {
        overview, loading,
        events, eventsPagination, eventsLoading,
        filters, setFilters, fetchEvents,
    } = useServiceHealthData();

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        fetchEvents(1, eventsPagination.per_page, newFilters);
    };

    const handleReset = () => {
        const empty = { classification: '', service: '', status: '' };
        setFilters(empty);
        fetchEvents(1, eventsPagination.per_page, empty);
    };

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

    const serviceOptions = d.events_by_service.map((s) => ({ value: s.service, label: s.service }));

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

            {/* Filterable Events Table */}
            <div className="mb-4">
                <SectionHeader title="All Events" subtitle="Browse and filter service health events" />
            </div>

            <div className="mb-4">
                <FilterBar
                    filters={[
                        { key: 'classification', label: 'All Types', options: [
                            { value: 'incident', label: 'Incident' },
                            { value: 'advisory', label: 'Advisory' },
                        ]},
                        { key: 'service', label: 'All Services', options: serviceOptions },
                        { key: 'status', label: 'All Statuses', options: [
                            { value: 'investigating', label: 'Investigating' },
                            { value: 'serviceInterruption', label: 'Service Interruption' },
                            { value: 'serviceRestored', label: 'Service Restored' },
                            { value: 'resolved', label: 'Resolved' },
                            { value: 'serviceOperational', label: 'Operational' },
                        ]},
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    onReset={handleReset}
                />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
                {eventsLoading ? (
                    <div className="p-6"><SkeletonLoader variant="table" count={8} /></div>
                ) : (
                    <>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Service</th>
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3">Tenant</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Start</th>
                                    <th className="px-4 py-3">End</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((ev) => (
                                    <tr key={ev.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                        <td className="px-4 py-3">
                                            <StatusBadge variant={classificationVariant(ev.classification)} label={ev.classification} />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700">{ev.service}</td>
                                        <td className="max-w-xs truncate px-4 py-3 text-slate-600">{ev.title}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{ev.customer_name ?? ev.tenant_id.slice(0, 12) + '...'}</td>
                                        <td className="px-4 py-3"><StatusBadge variant={statusVariant(ev.status)} label={ev.status} /></td>
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                            {ev.start_at ? new Date(ev.start_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                            {ev.end_at ? new Date(ev.end_at).toLocaleDateString() : 'Ongoing'}
                                        </td>
                                    </tr>
                                ))}
                                {events.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                            No events match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {eventsPagination.total > 0 && (
                            <PaginationControls
                                currentPage={eventsPagination.current_page}
                                lastPage={eventsPagination.last_page}
                                perPage={eventsPagination.per_page}
                                total={eventsPagination.total}
                                onPageChange={(page) => fetchEvents(page, eventsPagination.per_page)}
                                onPerPageChange={(pp) => fetchEvents(1, pp)}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
