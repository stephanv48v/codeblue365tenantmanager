import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import ExportButton from '../../Components/ExportButton';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import SectionHeader from '../../Components/SectionHeader';
import { useExchangeData, type ExchangeFilters } from './hooks/useExchangeData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    EnvelopeIcon,
    InboxStackIcon,
    CircleStackIcon,
    ArrowUturnRightIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatStorage(bytes: number): string {
    if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function ExchangeIndex() {
    const { isFiltered } = useTenantScope();
    const {
        data, loading, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchData,
    } = useExchangeData();

    // ── Filter handlers ─────────────────────────────────────────────────────

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: ExchangeFilters = { ...filters, [key]: value };
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
        const empty: ExchangeFilters = { type: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        fetchData(1, perPage, empty, '');
    };

    // ── Loading state ───────────────────────────────────────────────────────

    if (loading && !data) {
        return (
            <AppLayout title="Exchange Online">
                <PageHeader
                    title="Exchange Online"
                    subtitle="Mailbox inventory and forwarding analysis"
                    breadcrumbs={[{ label: 'Exchange', href: '/exchange' }, { label: 'Overview' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = data!;

    return (
        <AppLayout title="Exchange Online">
            <PageHeader
                title="Exchange Online"
                subtitle="Mailbox inventory and forwarding analysis"
                breadcrumbs={[{ label: 'Exchange', href: '/exchange' }, { label: 'Overview' }]}
                actions={<ExportButton csvEndpoint="/api/v1/exchange/overview" />}
            />

            {/* ── Stat Cards ────────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Total Mailboxes" value={d.total_mailboxes} icon={EnvelopeIcon} accentColor="blue" />
                <StatCard label="Shared Mailboxes" value={d.shared_mailboxes} icon={InboxStackIcon} accentColor="purple" />
                <StatCard
                    label="Total Storage"
                    value={formatStorage(d.total_storage_used)}
                    icon={CircleStackIcon}
                    accentColor="cyan"
                />
                <StatCard
                    label="Forwarding Rules"
                    value={d.forwarding_rules}
                    icon={ArrowUturnRightIcon}
                    href="/exchange/forwarding"
                    accentColor={d.external_forwarding > 0 ? 'red' : 'emerald'}
                    badge={d.external_forwarding > 0 ? { text: `${d.external_forwarding} external`, color: 'red' } : undefined}
                />
            </div>

            {/* ── Forwarding Alerts ──────────────────────────────────────────── */}
            {d.external_forwarding > 0 && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                            <ExclamationTriangleIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-red-800">
                                {d.external_forwarding} external forwarding rule{d.external_forwarding !== 1 ? 's' : ''} detected
                            </p>
                            <p className="text-xs text-red-600">
                                External forwarding can result in data exfiltration. Review these rules immediately.
                            </p>
                        </div>
                        <Link
                            href="/exchange/forwarding"
                            className="ml-auto rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                        >
                            Review Rules
                        </Link>
                    </div>
                </div>
            )}

            {/* ── Top Forwarding Rules Preview ───────────────────────────────── */}
            {d.forwarding && d.forwarding.length > 0 && (
                <div className="mb-6">
                    <SectionHeader
                        title="Forwarding Rules"
                        subtitle="Recent forwarding rules detected"
                        href="/exchange/forwarding"
                        linkText="View All"
                    />
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Target</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">External</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d.forwarding.slice(0, 5).map((rule) => (
                                        <tr key={rule.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{rule.user}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{rule.forwarding_target}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{rule.type}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge
                                                    variant={rule.is_external ? 'critical' : 'success'}
                                                    label={rule.is_external ? 'External' : 'Internal'}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Filter Bar ────────────────────────────────────────────────── */}
            <div className="mb-4">
                <SectionHeader title="Mailboxes" subtitle="All mailboxes across tenants" />
                <FilterBar
                    filters={[
                        {
                            key: 'type',
                            label: 'All Mailbox Types',
                            options: [
                                { value: 'user', label: 'User' },
                                { value: 'shared', label: 'Shared' },
                                { value: 'room', label: 'Room' },
                                { value: 'equipment', label: 'Equipment' },
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

            {/* ── Mailboxes Table ────────────────────────────────────────────── */}
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
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Storage Used</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Items</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d.mailboxes.map((mb) => (
                                        <tr key={mb.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{mb.display_name}</td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{mb.customer_name ?? mb.tenant_id.slice(0, 8)}</td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge
                                                    variant={mb.type === 'shared' ? 'info' : mb.type === 'room' ? 'neutral' : 'active'}
                                                    label={mb.type}
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatStorage(mb.storage_used)}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{mb.items_count.toLocaleString()}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                {mb.last_activity ? new Date(mb.last_activity).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {d.mailboxes.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 5 : 6} className="py-12 text-center text-sm text-slate-400">
                                                No mailboxes match your filters.
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

            {/* ── Quick Links ────────────────────────────────────────────────── */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Link href="/exchange/forwarding" className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                            <ArrowUturnRightIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Forwarding Rules</p>
                            <p className="text-xs text-slate-400">Audit all forwarding configurations</p>
                        </div>
                    </div>
                </Link>
                <Link href="/exchange/mail-flow" className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <EnvelopeIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Mail Flow Rules</p>
                            <p className="text-xs text-slate-400">Transport rule inventory</p>
                        </div>
                    </div>
                </Link>
                <Link href="/exchange/distribution-lists" className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                            <InboxStackIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Distribution Lists</p>
                            <p className="text-xs text-slate-400">Groups and distribution list management</p>
                        </div>
                    </div>
                </Link>
            </div>
        </AppLayout>
    );
}
