import AppLayout from '../../Layouts/AppLayout';
import {
    CreditCardIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import PageHeader from '../../Components/PageHeader';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { usePdfReport } from '../../hooks/usePdfReport';
import { useLicensingData } from './hooks/useLicensingData';

export default function LicensingIndex() {
    const { overview, loading } = useLicensingData();
    const { generating, generateReport } = usePdfReport();

    const handlePdfExport = async () => {
        if (!overview) return;
        const d = overview;
        await generateReport({
            title: 'Licensing Overview Report',
            subtitle: 'License utilization and waste tracking across all tenants',
            orientation: 'landscape',
            sections: [
                {
                    type: 'stats',
                    data: [
                        { label: 'Total Licenses', value: d.total_licenses.toLocaleString() },
                        { label: 'Assigned', value: d.assigned.toLocaleString() },
                        { label: 'Available', value: d.available.toLocaleString() },
                        { label: 'Waste', value: `${d.waste_percent}%` },
                        { label: 'Est. Monthly Waste', value: `$${Math.round(d.available * 12)}` },
                    ],
                },
                { type: 'chart', elementId: 'licensing-sku-chart', title: 'Utilization by SKU' },
                { type: 'chart', elementId: 'licensing-tenant-chart', title: 'Utilization by Tenant' },
                {
                    type: 'table',
                    title: 'Per-Tenant License Details',
                    headers: ['Tenant', 'Total', 'Assigned', 'Available', 'Utilization'],
                    rows: d.per_tenant_utilization.map((t) => [
                        t.customer_name,
                        t.total,
                        t.assigned,
                        t.available,
                        `${t.total > 0 ? Math.round((t.assigned / t.total) * 100) : 0}%`,
                    ]),
                },
            ],
        });
    };

    if (loading) {
        return (
            <AppLayout title="Licensing Overview">
                <PageHeader title="Licensing" subtitle="License utilization and waste tracking" />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = overview!;

    const skuData = d.top_skus.map((s) => ({
        name: s.sku_name.length > 20 ? s.sku_name.slice(0, 20) + '...' : s.sku_name,
        assigned: s.assigned,
        available: s.available,
    }));

    const tenantData = d.per_tenant_utilization.map((t) => ({
        name: t.customer_name.length > 15 ? t.customer_name.slice(0, 15) + '...' : t.customer_name,
        assigned: t.assigned,
        available: t.available,
    }));

    return (
        <AppLayout title="Licensing Overview">
            <PageHeader
                title="Licensing"
                subtitle="License utilization and waste tracking across all tenants"
                breadcrumbs={[{ label: 'Licensing' }]}
                actions={<ExportButton csvEndpoint="/api/v1/reports/license-utilization" onExportPdf={handlePdfExport} pdfGenerating={generating} />}
            />

            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Total Licenses" value={d.total_licenses.toLocaleString()} icon={CreditCardIcon} accentColor="blue" />
                <StatCard label="Assigned" value={d.assigned.toLocaleString()} icon={CheckCircleIcon} accentColor="emerald" />
                <StatCard label="Available" value={d.available.toLocaleString()} accentColor="amber" />
                <StatCard
                    label="Waste"
                    value={`${d.waste_percent}%`}
                    icon={ExclamationTriangleIcon}
                    accentColor={d.waste_percent > 10 ? 'red' : d.waste_percent > 5 ? 'amber' : 'emerald'}
                />
                <StatCard
                    label="Est. Monthly Waste"
                    value={`$${Math.round(d.available * 12)}`}
                    accentColor="red"
                    subtitle="At ~$12/license avg"
                />
            </div>

            {/* Top Wasted SKUs */}
            {(() => {
                const wastedSkus = [...d.top_skus]
                    .map((s) => ({
                        name: s.sku_name,
                        waste: s.available,
                        wastePct: s.total > 0 ? Math.round((s.available / s.total) * 100) : 0,
                        total: s.total,
                    }))
                    .sort((a, b) => b.waste - a.waste)
                    .slice(0, 3);

                return wastedSkus.length > 0 && wastedSkus[0].waste > 0 ? (
                    <div className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-slate-800">Top Wasted SKUs</h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            {wastedSkus.map((sku) => (
                                <div
                                    key={sku.name}
                                    className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
                                >
                                    <p className="truncate text-sm font-medium text-slate-700" title={sku.name}>
                                        {sku.name}
                                    </p>
                                    <div className="mt-3 flex items-end justify-between">
                                        <div>
                                            <p className={`text-2xl font-bold ${sku.wastePct > 30 ? 'text-red-600' : sku.wastePct > 15 ? 'text-amber-600' : 'text-slate-800'}`}>
                                                {sku.waste.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-slate-400">unused licenses</p>
                                        </div>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                sku.wastePct > 30
                                                    ? 'bg-red-50 text-red-700'
                                                    : sku.wastePct > 15
                                                      ? 'bg-amber-50 text-amber-700'
                                                      : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {sku.wastePct}% waste
                                        </span>
                                    </div>
                                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
                                        <div
                                            className={`h-1.5 rounded-full ${sku.wastePct > 30 ? 'bg-red-500' : sku.wastePct > 15 ? 'bg-amber-500' : 'bg-slate-400'}`}
                                            style={{ width: `${Math.min(sku.wastePct, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;
            })()}

            <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <ChartCard title="Utilization by SKU" subtitle="Top license types" id="licensing-sku-chart">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={skuData} layout="vertical">
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="assigned" name="Assigned" stackId="a" fill="#3b82f6" />
                            <Bar dataKey="available" name="Available" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Utilization by Tenant" subtitle="Per-tenant license breakdown" id="licensing-tenant-chart">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={tenantData} layout="vertical">
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="assigned" name="Assigned" stackId="a" fill="#10b981" />
                            <Bar dataKey="available" name="Available" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Per-tenant detail table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h3 className="text-sm font-semibold text-slate-800">Per-Tenant License Details</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Total</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Assigned</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Available</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Utilization</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {d.per_tenant_utilization.map((t) => {
                                const utilization = t.total > 0 ? Math.round((t.assigned / t.total) * 100) : 0;
                                return (
                                    <tr key={t.tenant_id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{t.customer_name}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">{t.total}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">{t.assigned}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">{t.available}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-24 rounded-full bg-slate-100">
                                                    <div
                                                        className={`h-2 rounded-full ${utilization >= 90 ? 'bg-emerald-500' : utilization >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${utilization}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-500">{utilization}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
