import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import ChartCard from '../../Components/ChartCard';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useSecureScoreActionsData, type SecureScoreFilters } from './hooks/useSecureScoreActionsData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { ChartBarSquareIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const statusVariant = (status: string | null) => {
    switch ((status ?? '').toLowerCase()) {
        case 'completed': return 'success' as const;
        case 'in_progress':
        case 'inprogress': return 'info' as const;
        case 'risk_accepted':
        case 'riskaccepted': return 'warning' as const;
        case 'to_address':
        case 'toaddress': return 'critical' as const;
        default: return 'neutral' as const;
    }
};

const categoryVariant = (category: string) => {
    switch (category.toLowerCase()) {
        case 'identity': return 'info' as const;
        case 'data': return 'warning' as const;
        case 'device': return 'success' as const;
        case 'apps': return 'medium' as const;
        default: return 'neutral' as const;
    }
};

export default function SecureScoreActions() {
    const { isFiltered } = useTenantScope();
    const {
        data, loading, error, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchData,
    } = useSecureScoreActionsData();

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: SecureScoreFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setPage(1);
        fetchData(1, perPage, newFilters, search);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
        fetchData(1, perPage, filters, value);
    };

    const handleReset = () => {
        const empty: SecureScoreFilters = { status: '', category: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        fetchData(1, perPage, empty, '');
    };

    if (loading && !data) {
        return (
            <AppLayout title="Secure Score Actions">
                <PageHeader
                    title="Secure Score Actions"
                    subtitle="Microsoft Secure Score improvement actions"
                    breadcrumbs={[{ label: 'Security & Compliance', href: '/security' }, { label: 'Secure Score Actions' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
                <SkeletonLoader variant="table" count={10} />
            </AppLayout>
        );
    }

    if (!data || error) {
        return (
            <AppLayout title="Secure Score Actions">
                <PageHeader
                    title="Secure Score Actions"
                    subtitle="Microsoft Secure Score improvement actions"
                    breadcrumbs={[{ label: 'Security & Compliance', href: '/security' }, { label: 'Secure Score Actions' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load secure score actions. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    const { summary, actions, score_by_category, pagination } = data;

    return (
        <AppLayout title="Secure Score Actions">
            <PageHeader
                title="Secure Score Actions"
                subtitle={isFiltered ? 'Actions for selected tenant' : 'Secure Score improvement actions across all tenants'}
                breadcrumbs={[{ label: 'Security & Compliance', href: '/security' }, { label: 'Secure Score Actions' }]}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Total Actions" value={summary.total_actions} icon={ChartBarSquareIcon} accentColor="blue" />
                <StatCard label="Completed" value={summary.completed} accentColor="emerald" />
                <StatCard label="In Progress" value={summary.in_progress} accentColor="cyan" />
                <StatCard label="Risk Accepted" value={summary.risk_accepted} accentColor="amber" />
                <StatCard label="Points to Gain" value={`+${summary.potential_points_gain}`} accentColor="purple" />
            </div>

            {/* Score by Category Bar Chart */}
            {score_by_category && score_by_category.length > 0 && (
                <div className="mb-6">
                    <ChartCard title="Score by Category" subtitle="Current vs maximum score per category">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={score_by_category}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="current_score" name="Current Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="max_score" name="Max Score" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}

            {/* Filter Bar */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'status',
                            label: 'All Statuses',
                            options: [
                                { value: 'completed', label: 'Completed' },
                                { value: 'inProgress', label: 'In Progress' },
                                { value: 'riskAccepted', label: 'Risk Accepted' },
                                { value: 'toAddress', label: 'To Address' },
                            ],
                        },
                        {
                            key: 'category',
                            label: 'All Categories',
                            options: [
                                { value: 'identity', label: 'Identity' },
                                { value: 'data', label: 'Data' },
                                { value: 'device', label: 'Device' },
                                { value: 'apps', label: 'Apps' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{ value: search, onChange: handleSearchChange, placeholder: 'Search actions...' }}
                    onReset={handleReset}
                />
            </div>

            {/* Actions Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {loading ? (
                    <div className="p-6"><SkeletonLoader variant="table" count={10} /></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Title</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Max Score</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Current</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">User Impact</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Implementation</th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {actions.map((action) => (
                                        <tr key={action.id} className="hover:bg-slate-50">
                                            <td className="max-w-xs truncate px-4 py-3 font-medium text-slate-900">{action.title}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={categoryVariant(action.category)} label={action.category} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{action.max_score}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span className={action.current_score >= action.max_score ? 'font-medium text-emerald-600' : 'text-slate-600'}>
                                                    {action.current_score}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={statusVariant(action.status)} label={(action.status ?? 'unknown').replace(/_/g, ' ')} dot />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500 capitalize text-xs">{action.user_impact ?? '-'}</td>
                                            <td className="max-w-xs truncate px-4 py-3 text-slate-500 text-xs">{action.remediation_description ?? action.implementation ?? '-'}</td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                                    {action.customer_name ?? action.tenant_id.slice(0, 12) + '...'}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {actions.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 7 : 8} className="py-12 text-center text-sm text-slate-400">
                                                No secure score actions found.
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
                                onPageChange={(pg) => { setPage(pg); fetchData(pg, perPage, filters, search); }}
                                onPerPageChange={(pp) => { setPerPage(pp); setPage(1); fetchData(1, pp, filters, search); }}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
