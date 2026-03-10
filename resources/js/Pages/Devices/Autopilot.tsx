import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import ChartCard from '../../Components/ChartCard';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useAutopilotData } from './hooks/useAutopilotData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const enrollmentVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'enrolled':
        case 'assigned': return 'success' as const;
        case 'pending': return 'pending' as const;
        case 'failed': return 'critical' as const;
        case 'not_enrolled': return 'neutral' as const;
        default: return 'neutral' as const;
    }
};

const STATUS_COLORS: Record<string, string> = {
    enrolled: '#10b981',
    assigned: '#10b981',
    pending: '#f59e0b',
    failed: '#ef4444',
    not_enrolled: '#94a3b8',
};

export default function Autopilot() {
    const { isFiltered } = useTenantScope();
    const { data, loading, error, page, perPage, setPage, setPerPage, fetchData } = useAutopilotData();

    if (loading && !data) {
        return (
            <AppLayout title="Autopilot">
                <PageHeader
                    title="Windows Autopilot"
                    subtitle="Device enrollment and deployment"
                    breadcrumbs={[{ label: 'Devices', href: '/devices' }, { label: 'Autopilot' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
                <SkeletonLoader variant="table" count={10} />
            </AppLayout>
        );
    }

    if (!data || error) {
        return (
            <AppLayout title="Autopilot">
                <PageHeader
                    title="Windows Autopilot"
                    subtitle="Device enrollment and deployment"
                    breadcrumbs={[{ label: 'Devices', href: '/devices' }, { label: 'Autopilot' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load Autopilot data. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    const { summary, devices, enrollment_breakdown, pagination } = data;

    const pieData = enrollment_breakdown.map((item) => ({
        name: item.status.charAt(0).toUpperCase() + item.status.slice(1).replace(/_/g, ' '),
        value: item.count,
        fill: STATUS_COLORS[item.status.toLowerCase()] ?? '#94a3b8',
    }));

    return (
        <AppLayout title="Autopilot">
            <PageHeader
                title="Windows Autopilot"
                subtitle={isFiltered ? 'Autopilot devices for selected tenant' : 'Autopilot devices across all tenants'}
                breadcrumbs={[{ label: 'Devices', href: '/devices' }, { label: 'Autopilot' }]}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Total Devices" value={summary.total_devices} icon={ComputerDesktopIcon} accentColor="blue" />
                <StatCard label="Enrolled" value={summary.enrolled} accentColor="emerald" />
                <StatCard label="Pending" value={summary.pending} accentColor={summary.pending > 0 ? 'amber' : 'slate'} />
                <StatCard label="Failed" value={summary.failed} accentColor={summary.failed > 0 ? 'red' : 'slate'} />
            </div>

            {/* Enrollment Status Pie Chart */}
            {pieData.length > 0 && (
                <div className="mb-6">
                    <ChartCard title="Enrollment Status Distribution" subtitle="Device enrollment breakdown">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine
                                >
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}

            {/* Devices Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {loading ? (
                    <div className="p-6"><SkeletonLoader variant="table" count={10} /></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Serial Number</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Model</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Manufacturer</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Enrollment Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Deployment Profile</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Group Tag</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Contacted</th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {devices.map((device) => (
                                        <tr key={device.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-medium text-slate-900">{device.serial_number}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{device.model}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{device.manufacturer}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={enrollmentVariant(device.enrollment_status)} label={device.enrollment_status} dot />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">{device.deployment_profile ?? '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">{device.group_tag ?? '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                {device.last_contacted ? new Date(device.last_contacted).toLocaleDateString() : '-'}
                                            </td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                    {device.customer_name ?? device.tenant_id.slice(0, 12) + '...'}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {devices.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 7 : 8} className="py-12 text-center text-sm text-slate-400">
                                                No Autopilot devices found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {pagination && pagination.total > 0 && (
                            <PaginationControls
                                currentPage={pagination.current_page}
                                lastPage={pagination.last_page}
                                perPage={pagination.per_page}
                                total={pagination.total}
                                onPageChange={(pg) => { setPage(pg); fetchData(pg, perPage); }}
                                onPerPageChange={(pp) => { setPerPage(pp); setPage(1); fetchData(1, pp); }}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
