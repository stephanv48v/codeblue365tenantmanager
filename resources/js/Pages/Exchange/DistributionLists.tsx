import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useDistributionListsData, type DistributionFilters } from './hooks/useExchangeData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    InboxStackIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// ── Main Component ──────────────────────────────────────────────────────────

export default function DistributionLists() {
    const { isFiltered } = useTenantScope();
    const {
        data, loading, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchData,
    } = useDistributionListsData();

    // ── Filter handlers ─────────────────────────────────────────────────────

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: DistributionFilters = { ...filters, [key]: value };
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
        const empty: DistributionFilters = { group_type: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        fetchData(1, perPage, empty, '');
    };

    // ── Loading state ───────────────────────────────────────────────────────

    if (loading && !data) {
        return (
            <AppLayout title="Distribution Lists">
                <PageHeader
                    title="Distribution Lists"
                    subtitle="Distribution groups and mail-enabled groups"
                    breadcrumbs={[{ label: 'Exchange', href: '/exchange' }, { label: 'Distribution Lists' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-2">
                    <SkeletonLoader variant="stat-card" count={2} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = data!;

    return (
        <AppLayout title="Distribution Lists">
            <PageHeader
                title="Distribution Lists"
                subtitle="Distribution groups and mail-enabled groups"
                breadcrumbs={[{ label: 'Exchange', href: '/exchange' }, { label: 'Distribution Lists' }]}
            />

            {/* ── Stat Cards ────────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-2">
                <StatCard label="Total Lists" value={d.total} icon={InboxStackIcon} accentColor="blue" />
                <StatCard
                    label="External Senders Allowed"
                    value={d.external_senders_count}
                    icon={ExclamationTriangleIcon}
                    accentColor={d.external_senders_count > 0 ? 'amber' : 'emerald'}
                    subtitle="Lists accepting external mail"
                />
            </div>

            {/* ── Filter Bar ────────────────────────────────────────────────── */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'group_type',
                            label: 'All Group Types',
                            options: [
                                { value: 'distribution', label: 'Distribution' },
                                { value: 'mail_enabled_security', label: 'Mail-Enabled Security' },
                                { value: 'dynamic', label: 'Dynamic' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{
                        value: search,
                        onChange: handleSearchChange,
                        placeholder: 'Search by name or email...',
                    }}
                    onReset={handleReset}
                />
            </div>

            {/* ── Table ─────────────────────────────────────────────────────── */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {loading ? (
                    <div className="p-6"><SkeletonLoader variant="table" count={10} /></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Display Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Email</th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Members</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">External Senders</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Managed By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d.items.map((dl) => (
                                        <tr key={dl.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{dl.display_name}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{dl.email}</td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{dl.customer_name ?? dl.tenant_id.slice(0, 8)}</td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant="info" label={dl.group_type} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{dl.member_count}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge
                                                    variant={dl.external_senders_allowed ? 'warning' : 'success'}
                                                    label={dl.external_senders_allowed ? 'Allowed' : 'Blocked'}
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">{dl.managed_by ?? '-'}</td>
                                        </tr>
                                    ))}
                                    {d.items.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 6 : 7} className="py-12 text-center text-sm text-slate-400">
                                                No distribution lists match your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {d.pagination && d.pagination.total > 0 && (
                            <PaginationControls
                                currentPage={d.pagination.current_page}
                                lastPage={d.pagination.last_page}
                                perPage={d.pagination.per_page}
                                total={d.pagination.total}
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
