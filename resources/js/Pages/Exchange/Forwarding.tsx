import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useForwardingData, type ForwardingFilters } from './hooks/useExchangeData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    ArrowUturnRightIcon,
    ExclamationTriangleIcon,
    ShieldCheckIcon,
    ShieldExclamationIcon,
} from '@heroicons/react/24/outline';

// ── Main Component ──────────────────────────────────────────────────────────

export default function Forwarding() {
    const { isFiltered } = useTenantScope();
    const {
        data, loading, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchData,
    } = useForwardingData();

    // ── Filter handlers ─────────────────────────────────────────────────────

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: ForwardingFilters = { ...filters, [key]: value };
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
        const empty: ForwardingFilters = { is_external: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        fetchData(1, perPage, empty, '');
    };

    // ── Loading state ───────────────────────────────────────────────────────

    if (loading && !data) {
        return (
            <AppLayout title="Forwarding Rules">
                <PageHeader
                    title="Forwarding Rules"
                    subtitle="Security audit of mailbox forwarding configurations"
                    breadcrumbs={[{ label: 'Exchange', href: '/exchange' }, { label: 'Forwarding Rules' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3">
                    <SkeletonLoader variant="stat-card" count={3} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = data!;

    return (
        <AppLayout title="Forwarding Rules">
            <PageHeader
                title="Forwarding Rules"
                subtitle="Security audit of mailbox forwarding configurations"
                breadcrumbs={[{ label: 'Exchange', href: '/exchange' }, { label: 'Forwarding Rules' }]}
            />

            {/* ── Stat Cards ────────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3">
                <StatCard label="Total Rules" value={d.total} icon={ArrowUturnRightIcon} accentColor="blue" />
                <StatCard
                    label="External Forwarding"
                    value={d.external_count}
                    icon={ShieldExclamationIcon}
                    accentColor={d.external_count > 0 ? 'red' : 'emerald'}
                />
                <StatCard label="Internal Forwarding" value={d.internal_count} icon={ShieldCheckIcon} accentColor="emerald" />
            </div>

            {/* ── Security Alert ─────────────────────────────────────────────── */}
            {d.external_count > 0 && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                            <ExclamationTriangleIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-red-800">
                                Security Warning: {d.external_count} external forwarding rule{d.external_count !== 1 ? 's' : ''} detected
                            </p>
                            <p className="text-xs text-red-600">
                                External mail forwarding can lead to data exfiltration. Review each rule and disable unauthorized forwarding.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Filter Bar ────────────────────────────────────────────────── */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'is_external',
                            label: 'All Directions',
                            options: [
                                { value: 'true', label: 'External Only' },
                                { value: 'false', label: 'Internal Only' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{
                        value: search,
                        onChange: handleSearchChange,
                        placeholder: 'Search by user or target...',
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
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Forwarding Target</th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Direction</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d.items.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{rule.user}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{rule.forwarding_target}</td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{rule.customer_name ?? rule.tenant_id.slice(0, 8)}</td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{rule.type}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge
                                                    variant={rule.is_external ? 'critical' : 'success'}
                                                    label={rule.is_external ? 'External' : 'Internal'}
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge
                                                    variant={rule.status === 'active' ? 'active' : 'disabled'}
                                                    label={rule.status}
                                                    dot
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    {d.items.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 5 : 6} className="py-12 text-center text-sm text-slate-400">
                                                No forwarding rules match your filters.
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
