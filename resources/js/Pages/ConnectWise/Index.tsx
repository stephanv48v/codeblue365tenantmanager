import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import ExportButton from '../../Components/ExportButton';
import { useConnectWiseData, type ConnectWiseFilters } from './hooks/useConnectWiseData';
import { useTenantScope } from '../../hooks/useTenantScope';
import { TicketIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

const statusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'open':
        case 'new': return 'warning' as const;
        case 'in progress':
        case 'in_progress': return 'info' as const;
        case 'closed':
        case 'completed': return 'success' as const;
        case 'waiting': return 'neutral' as const;
        default: return 'neutral' as const;
    }
};

const priorityVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
        case 'critical':
        case 'emergency': return 'critical' as const;
        case 'high': return 'high' as const;
        case 'medium': return 'medium' as const;
        case 'low': return 'low' as const;
        default: return 'neutral' as const;
    }
};

export default function ConnectWiseIndex() {
    const { isFiltered } = useTenantScope();
    const {
        data, loading, error, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchData,
    } = useConnectWiseData();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTicket, setNewTicket] = useState({ summary: '', priority: 'medium', description: '' });

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: ConnectWiseFilters = { ...filters, [key]: value };
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
        const empty: ConnectWiseFilters = { status: '', priority: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        fetchData(1, perPage, empty, '');
    };

    const [createError, setCreateError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const handleCreateTicket = async () => {
        setCreateError(null);
        setCreating(true);
        try {
            const res = await fetch('/api/v1/connectwise/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTicket),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.message ?? `Failed to create ticket (${res.status})`);
            }
            setShowCreateModal(false);
            setNewTicket({ summary: '', priority: 'medium', description: '' });
            fetchData();
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : 'Failed to create ticket. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    if (loading && !data) {
        return (
            <AppLayout title="ConnectWise">
                <PageHeader
                    title="ConnectWise"
                    subtitle="PSA ticket management"
                    breadcrumbs={[{ label: 'Integrations' }, { label: 'ConnectWise' }]}
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
            <AppLayout title="ConnectWise">
                <PageHeader
                    title="ConnectWise"
                    subtitle="PSA ticket management"
                    breadcrumbs={[{ label: 'Integrations' }, { label: 'ConnectWise' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load ConnectWise data. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    const { summary, tickets, pagination } = data;

    return (
        <AppLayout title="ConnectWise">
            <PageHeader
                title="ConnectWise"
                subtitle={isFiltered ? 'Tickets for selected tenant' : 'PSA ticket management across all tenants'}
                breadcrumbs={[{ label: 'Integrations' }, { label: 'ConnectWise' }]}
                actions={
                    <div className="flex items-center gap-2">
                        <ExportButton csvEndpoint="/api/v1/connectwise/overview" />
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
                        >
                            <TicketIcon className="h-4 w-4" />
                            New Ticket
                        </button>
                    </div>
                }
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Open Tickets" value={summary.open_tickets} icon={TicketIcon} accentColor="amber" />
                <StatCard label="In Progress" value={summary.in_progress} accentColor="blue" />
                <StatCard label="Closed This Month" value={summary.closed_this_month} accentColor="emerald" />
                <StatCard label="Critical Priority" value={summary.critical_priority} icon={WrenchScrewdriverIcon} accentColor={summary.critical_priority > 0 ? 'red' : 'slate'} />
            </div>

            {/* Filter Bar */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'status',
                            label: 'All Statuses',
                            options: [
                                { value: 'open', label: 'Open' },
                                { value: 'in_progress', label: 'In Progress' },
                                { value: 'closed', label: 'Closed' },
                                { value: 'waiting', label: 'Waiting' },
                            ],
                        },
                        {
                            key: 'priority',
                            label: 'All Priorities',
                            options: [
                                { value: 'critical', label: 'Critical' },
                                { value: 'high', label: 'High' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'low', label: 'Low' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{ value: search, onChange: handleSearchChange, placeholder: 'Search tickets...' }}
                    onReset={handleReset}
                />
            </div>

            {/* Tickets Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {loading ? (
                    <div className="p-6"><SkeletonLoader variant="table" count={10} /></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Ticket ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Summary</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Priority</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Source</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Assigned To</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-blue-600">{ticket.ticket_id}</td>
                                            <td className="max-w-xs truncate px-4 py-3 text-slate-900">{ticket.summary}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">
                                                {ticket.customer_name ?? ticket.tenant_id.slice(0, 12) + '...'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={statusVariant(ticket.status)} label={ticket.status} dot />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge variant={priorityVariant(ticket.priority)} label={ticket.priority} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500 capitalize">{ticket.source}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{ticket.assigned_to ?? '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                {new Date(ticket.created_date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {tickets.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                                                No tickets found.
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

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Create New Ticket</h2>
                        {createError && (
                            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{createError}</div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
                                <input
                                    type="text"
                                    value={newTicket.summary}
                                    onChange={(e) => setNewTicket({ ...newTicket, summary: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter ticket summary..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                <select
                                    value={newTicket.priority}
                                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                    rows={4}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Describe the issue..."
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTicket}
                                disabled={!newTicket.summary.trim() || creating}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                                {creating ? 'Creating...' : 'Create Ticket'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
