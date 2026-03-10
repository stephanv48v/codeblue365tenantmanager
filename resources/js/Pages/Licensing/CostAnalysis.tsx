import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useLicenseCostData } from './hooks/useLicenseCostData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

const formatCurrency = (value: number) =>
    '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatCurrencyDecimal = (value: number) =>
    '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CostAnalysis() {
    const { isFiltered } = useTenantScope();
    const { data, loading, error, page, perPage, setPage, setPerPage, fetchData } = useLicenseCostData();

    if (loading && !data) {
        return (
            <AppLayout title="Cost Analysis">
                <PageHeader
                    title="License Cost Analysis"
                    subtitle="Spending and optimization insights"
                    breadcrumbs={[{ label: 'Licensing', href: '/licensing' }, { label: 'Cost Analysis' }]}
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
            <AppLayout title="Cost Analysis">
                <PageHeader
                    title="License Cost Analysis"
                    subtitle="Spending and optimization insights"
                    breadcrumbs={[{ label: 'Licensing', href: '/licensing' }, { label: 'Cost Analysis' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load cost analysis data. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    const { summary, items, pagination } = data;

    return (
        <AppLayout title="Cost Analysis">
            <PageHeader
                title="License Cost Analysis"
                subtitle={isFiltered ? 'Cost analysis for selected tenant' : 'License cost analysis across all tenants'}
                breadcrumbs={[{ label: 'Licensing', href: '/licensing' }, { label: 'Cost Analysis' }]}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Total Monthly Spend" value={formatCurrency(summary.total_monthly_spend)} icon={CurrencyDollarIcon} accentColor="blue" />
                <StatCard label="Total Wasted" value={formatCurrency(summary.total_wasted)} accentColor={summary.total_wasted > 0 ? 'red' : 'emerald'} />
                <StatCard label="Potential Savings" value={formatCurrency(summary.potential_savings)} accentColor={summary.potential_savings > 0 ? 'amber' : 'emerald'} />
                <StatCard label="License Utilization" value={`${summary.license_utilization_percent}%`} accentColor={summary.license_utilization_percent >= 80 ? 'emerald' : 'amber'} />
            </div>

            {/* Cost Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {loading ? (
                    <div className="p-6"><SkeletonLoader variant="table" count={10} /></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">SKU Name</th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Purchased</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Assigned</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Active</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Cost / Unit</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Monthly Cost</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Wasted / Month</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Recommendation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{item.sku_friendly_name}</td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                    {item.customer_name ?? item.tenant_id.slice(0, 12) + '...'}
                                                </td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.purchased_units.toLocaleString()}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.assigned_units.toLocaleString()}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.active_units.toLocaleString()}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatCurrencyDecimal(item.cost_per_unit)}</td>
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{formatCurrencyDecimal(item.total_monthly_cost)}</td>
                                            <td className={`whitespace-nowrap px-4 py-3 font-medium ${item.wasted_monthly_cost > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                {formatCurrencyDecimal(item.wasted_monthly_cost)}
                                            </td>
                                            <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-500">{item.optimization_recommendation ?? '-'}</td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 8 : 9} className="py-12 text-center text-sm text-slate-400">
                                                No license cost data found.
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
