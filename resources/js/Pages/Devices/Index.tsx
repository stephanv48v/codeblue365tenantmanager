import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import {
    ComputerDesktopIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    CogIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid } from 'recharts';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import PageHeader from '../../Components/PageHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import StatusBadge from '../../Components/StatusBadge';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import DetailPanel from '../../Components/DetailPanel';
import SectionHeader from '../../Components/SectionHeader';
import ExportButton from '../../Components/ExportButton';
import { usePdfReport } from '../../hooks/usePdfReport';
import { useDevicesData } from './hooks/useDevicesData';

const OS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

export default function DevicesIndex() {
    const {
        overview, loading,
        inventory, inventoryPagination, inventoryLoading,
        selectedDevice, setSelectedDevice,
        filters, setFilters, fetchInventory,
    } = useDevicesData();

    const { generating, generateReport } = usePdfReport();
    const [complianceTrend, setComplianceTrend] = useState<Array<{ date: string; score: number }>>([]);

    const handlePdfExport = async () => {
        if (!overview) return;
        const d = overview;
        await generateReport({
            title: 'Devices Overview Report',
            subtitle: 'Device compliance and inventory across all tenants',
            orientation: 'landscape',
            sections: [
                {
                    type: 'stats',
                    data: [
                        { label: 'Total Devices', value: d.total },
                        { label: 'Compliance Rate', value: `${d.compliance_rate}%` },
                        { label: 'Compliant', value: d.compliant },
                        { label: 'Non-Compliant', value: d.non_compliant },
                        { label: 'Managed', value: d.managed },
                    ],
                },
                { type: 'chart', elementId: 'devices-os-chart', title: 'OS Distribution' },
                { type: 'chart', elementId: 'devices-compliance-chart', title: 'Compliance by Tenant' },
                {
                    type: 'table',
                    title: 'Device Inventory (Top 50)',
                    headers: ['Name', 'OS', 'Compliance', 'Managed By', 'Tenant'],
                    rows: inventory.slice(0, 50).map((dev) => [
                        dev.display_name,
                        dev.os ?? '',
                        dev.compliance_state ?? '',
                        dev.managed_by ?? 'Unmanaged',
                        dev.customer_name ?? dev.tenant_id,
                    ]),
                },
            ],
        });
    };

    useEffect(() => {
        fetch('/api/v1/security/posture/history')
            .then((r) => r.json())
            .then((res) => {
                if (res.success && Array.isArray(res.data)) {
                    setComplianceTrend(
                        res.data.map((p: any) => ({
                            date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            score: p.device_currency ?? 0,
                        })),
                    );
                }
            })
            .catch(() => {});
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        fetchInventory(1, inventoryPagination.per_page, newFilters);
    };

    const handleSearch = (value: string) => {
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        setTimeout(() => fetchInventory(1, inventoryPagination.per_page, newFilters), 300);
    };

    const handleReset = () => {
        const empty = { tenant_id: '', compliance_status: '', os: '', managed: '', search: '' };
        setFilters(empty);
        fetchInventory(1, inventoryPagination.per_page, empty);
    };

    if (loading) {
        return (
            <AppLayout title="Devices Overview">
                <PageHeader title="Devices" subtitle="Device compliance and inventory" />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = overview!;

    // Stale devices: last_sync_at older than 30 days or null
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const staleCount = inventory.filter(
        (dev) => !dev.last_sync_at || new Date(dev.last_sync_at) < thirtyDaysAgo,
    ).length;

    const osData = d.os_distribution.map((os, i) => ({
        name: os.os || 'Unknown',
        value: os.count,
        fill: OS_COLORS[i % OS_COLORS.length],
    }));

    const complianceByTenant = d.compliance_by_tenant.map((t) => ({
        name: t.customer_name.length > 15 ? t.customer_name.slice(0, 15) + '...' : t.customer_name,
        compliant: t.compliant,
        nonCompliant: t.total - t.compliant,
    }));

    // Get unique OS values for filter
    const osOptions = d.os_distribution.map((o) => ({ value: o.os || 'Unknown', label: o.os || 'Unknown' }));

    return (
        <AppLayout title="Devices Overview">
            <PageHeader
                title="Devices"
                subtitle="Device compliance and inventory across all tenants"
                breadcrumbs={[{ label: 'Devices' }]}
                actions={<ExportButton csvEndpoint="/api/v1/reports/device-compliance" onExportPdf={handlePdfExport} pdfGenerating={generating} />}
            />

            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Total Devices" value={d.total} icon={ComputerDesktopIcon} accentColor="blue" />
                <StatCard
                    label="Compliance Rate"
                    value={`${d.compliance_rate}%`}
                    icon={CheckCircleIcon}
                    accentColor={d.compliance_rate >= 90 ? 'emerald' : d.compliance_rate >= 70 ? 'amber' : 'red'}
                />
                <StatCard label="Compliant" value={d.compliant} accentColor="emerald" />
                <StatCard label="Non-Compliant" value={d.non_compliant} icon={ExclamationTriangleIcon} accentColor="red" />
                <StatCard label="Managed" value={d.managed} icon={CogIcon} accentColor="blue" subtitle={`${d.unmanaged} unmanaged`} />
                <StatCard label="Stale Devices" value={staleCount} icon={ClockIcon} accentColor={staleCount > 0 ? 'amber' : 'emerald'} subtitle="No sync in 30+ days" />
            </div>

            {complianceTrend.length > 0 && (
                <div className="mb-6">
                    <ChartCard title="Device Compliance Trend" subtitle="Compliance score over time">
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={complianceTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} />
                                <Tooltip formatter={(value: number) => [`${value}%`, 'Compliance']} />
                                <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="#3b82f633" name="Compliance %" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}

            <div className="mb-6 grid gap-6 lg:grid-cols-12">
                <ChartCard title="OS Distribution" className="lg:col-span-4" id="devices-os-chart">
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={osData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                                {osData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Compliance by Tenant" className="lg:col-span-8" id="devices-compliance-chart">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={complianceByTenant} layout="vertical">
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="compliant" name="Compliant" stackId="a" fill="#10b981" />
                            <Bar dataKey="nonCompliant" name="Non-Compliant" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Device Inventory Section */}
            <div className="mb-4">
                <SectionHeader title="Device Inventory" subtitle="Full device list with filtering and detail view" />
            </div>

            <div className="mb-4">
                <FilterBar
                    filters={[
                        { key: 'compliance_status', label: 'All Compliance', options: [
                            { value: 'compliant', label: 'Compliant' },
                            { value: 'noncompliant', label: 'Non-Compliant' },
                            { value: 'unknown', label: 'Unknown' },
                        ]},
                        { key: 'os', label: 'All OS', options: osOptions },
                        { key: 'managed', label: 'All Management', options: [
                            { value: 'managed', label: 'Managed' },
                            { value: 'unmanaged', label: 'Unmanaged' },
                        ]},
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{ value: filters.search, onChange: handleSearch, placeholder: 'Search devices...' }}
                    onReset={handleReset}
                />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
                {inventoryLoading ? (
                    <div className="p-6"><SkeletonLoader variant="table" count={8} /></div>
                ) : (
                    <>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3">Device Name</th>
                                    <th className="px-4 py-3">OS</th>
                                    <th className="px-4 py-3">Compliance</th>
                                    <th className="px-4 py-3">Managed By</th>
                                    <th className="px-4 py-3">Tenant</th>
                                    <th className="px-4 py-3">Last Sync</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map((device) => (
                                    <tr
                                        key={device.id}
                                        className="border-b last:border-0 hover:bg-slate-50/50 cursor-pointer"
                                        onClick={() => setSelectedDevice(device)}
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-800">{device.display_name}</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {device.os}
                                            {device.os_version && <span className="ml-1 text-xs text-slate-400">{device.os_version}</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                variant={device.compliance_state === 'compliant' ? 'compliant' : 'nonCompliant'}
                                                label={device.compliance_state}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 capitalize">{device.managed_by ?? 'Unmanaged'}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{device.customer_name ?? device.tenant_id.slice(0, 12) + '...'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                            {device.last_sync_at ? new Date(device.last_sync_at).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {inventory.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            No devices match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {inventoryPagination.total > 0 && (
                            <PaginationControls
                                currentPage={inventoryPagination.current_page}
                                lastPage={inventoryPagination.last_page}
                                perPage={inventoryPagination.per_page}
                                total={inventoryPagination.total}
                                onPageChange={(page) => fetchInventory(page, inventoryPagination.per_page)}
                                onPerPageChange={(pp) => fetchInventory(1, pp)}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Detail Panel */}
            <DetailPanel
                open={selectedDevice !== null}
                onClose={() => setSelectedDevice(null)}
                title={selectedDevice?.display_name ?? 'Device Details'}
                subtitle={selectedDevice?.os}
            >
                {selectedDevice && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3">
                            <StatusBadge
                                variant={selectedDevice.compliance_state === 'compliant' ? 'compliant' : 'nonCompliant'}
                                label={selectedDevice.compliance_state}
                                size="md"
                            />
                            {selectedDevice.managed_by ? (
                                <StatusBadge variant="active" label={`Managed by ${selectedDevice.managed_by}`} size="md" />
                            ) : (
                                <StatusBadge variant="neutral" label="Unmanaged" size="md" />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <p className="text-xs text-slate-400">Device Name</p>
                                <p className="mt-0.5 text-sm font-medium text-slate-700">{selectedDevice.display_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Device ID</p>
                                <p className="mt-0.5 text-sm font-mono text-slate-600">{selectedDevice.device_id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Operating System</p>
                                <p className="mt-0.5 text-sm text-slate-700">{selectedDevice.os} {selectedDevice.os_version}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Tenant</p>
                                <p className="mt-0.5 text-sm font-medium text-slate-700">{selectedDevice.customer_name ?? selectedDevice.tenant_id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Enrolled</p>
                                <p className="mt-0.5 text-sm text-slate-700">{selectedDevice.enrolled_at ? new Date(selectedDevice.enrolled_at).toLocaleString() : '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Last Sync</p>
                                <p className="mt-0.5 text-sm text-slate-700">{selectedDevice.last_sync_at ? new Date(selectedDevice.last_sync_at).toLocaleString() : '-'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </DetailPanel>
        </AppLayout>
    );
}
