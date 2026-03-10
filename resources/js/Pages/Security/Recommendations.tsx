import { useState, useEffect, Fragment } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import BulkActionBar from '../../Components/BulkActionBar';
import ExportButton from '../../Components/ExportButton';
import { LightBulbIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useRecommendationsData, type Recommendation } from './hooks/useRecommendationsData';

const priorityVariant = (p: string) => {
    switch (p) {
        case 'critical': return 'critical' as const;
        case 'high': return 'high' as const;
        case 'medium': return 'medium' as const;
        case 'low': return 'low' as const;
        default: return 'info' as const;
    }
};

const statusVariant = (s: string) => {
    switch (s) {
        case 'open': return 'critical' as const;
        case 'in_progress': return 'warning' as const;
        case 'resolved': return 'success' as const;
        default: return 'neutral' as const;
    }
};

const accentBorder: Record<string, string> = {
    critical: 'border-l-red-500',
    high: 'border-l-orange-500',
    medium: 'border-l-amber-500',
    low: 'border-l-blue-400',
};

export default function Recommendations() {
    const {
        items,
        loading,
        summary,
        pagination,
        selectedIds,
        fetchRecommendations,
        bulkUpdate,
        toggleSelection,
        toggleAll,
        clearSelection,
    } = useRecommendationsData();

    const [filters, setFilters] = useState({ priority: '', status: '', search: '' });
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        fetchRecommendations(1, 25, {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        fetchRecommendations(1, pagination.per_page, newFilters);
    };

    const handleSearch = (value: string) => {
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        setTimeout(() => fetchRecommendations(1, pagination.per_page, newFilters), 300);
    };

    const handleReset = () => {
        const empty = { priority: '', status: '', search: '' };
        setFilters(empty);
        fetchRecommendations(1, pagination.per_page, empty);
    };

    const handleBulkAction = async (action: 'start' | 'resolve' | 'reopen') => {
        await bulkUpdate(selectedIds, action);
        clearSelection();
        fetchRecommendations(pagination.current_page, pagination.per_page, filters);
    };

    const handleBulkStart = () => handleBulkAction('start');
    const handleBulkResolve = () => handleBulkAction('resolve');
    const handleBulkReopen = () => handleBulkAction('reopen');

    return (
        <AppLayout title="Recommendations">
            <PageHeader
                title="Recommendations"
                subtitle="Actionable security recommendations across tenants"
                breadcrumbs={[
                    { label: 'Security & Compliance', href: '/security' },
                    { label: 'Recommendations' },
                ]}
                actions={<ExportButton csvEndpoint="/api/v1/reports/recommendations" />}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Total" value={summary.total} icon={LightBulbIcon} accentColor="blue" />
                <StatCard label="Open" value={summary.open} accentColor={summary.open > 0 ? 'red' : 'emerald'} />
                <StatCard label="In Progress" value={summary.in_progress} accentColor="amber" />
                <StatCard label="Resolved" value={summary.resolved} accentColor="emerald" />
            </div>

            {/* Filter Bar */}
            <div className="mb-4">
                <FilterBar
                    filters={[
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
                        {
                            key: 'status',
                            label: 'All Statuses',
                            options: [
                                { value: 'open', label: 'Open' },
                                { value: 'in_progress', label: 'In Progress' },
                                { value: 'resolved', label: 'Resolved' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{ value: filters.search, onChange: handleSearch, placeholder: 'Search recommendations...' }}
                    onReset={handleReset}
                />
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="mb-4">
                    <BulkActionBar
                        selectedCount={selectedIds.length}
                        actions={[
                            { label: 'Start', onClick: handleBulkStart },
                            { label: 'Resolve', onClick: handleBulkResolve, variant: 'danger' },
                            { label: 'Reopen', onClick: handleBulkReopen, variant: 'default' },
                        ]}
                        onClearSelection={clearSelection}
                    />
                </div>
            )}

            {/* Table */}
            {loading ? (
                <SkeletonLoader variant="table" count={8} />
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={items.length > 0 && selectedIds.length === items.length}
                                        onChange={toggleAll}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-4 py-3">Priority</th>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Tenant</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Created</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((rec: Recommendation) => (
                                <Fragment key={rec.id}>
                                    <tr
                                        className={`border-b border-l-4 ${accentBorder[rec.priority] ?? 'border-l-slate-300'} last:border-b-0 hover:bg-slate-50/50 cursor-pointer`}
                                        onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                                    >
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(rec.id)}
                                                onChange={() => toggleSelection(rec.id)}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge variant={priorityVariant(rec.priority)} label={rec.priority} />
                                        </td>
                                        <td className="max-w-xs truncate px-4 py-3 text-slate-700">{rec.title}</td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">
                                            {rec.customer_name ?? rec.tenant_id.slice(0, 12) + '...'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                variant={statusVariant(rec.status)}
                                                label={rec.status.replace(/_/g, ' ')}
                                                dot
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                            {new Date(rec.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400">
                                            {expandedId === rec.id ? (
                                                <ChevronUpIcon className="h-4 w-4" />
                                            ) : (
                                                <ChevronDownIcon className="h-4 w-4" />
                                            )}
                                        </td>
                                    </tr>
                                    {expandedId === rec.id && (
                                        <tr key={`${rec.id}-detail`}>
                                            <td colSpan={7} className="bg-slate-50/50 px-6 py-4 border-b">
                                                <div className="space-y-3">
                                                    {rec.description && (
                                                        <div>
                                                            <p className="text-xs font-medium uppercase text-slate-400">Description</p>
                                                            <p className="mt-1 text-sm text-slate-700">{rec.description}</p>
                                                        </div>
                                                    )}
                                                    {rec.finding_description && (
                                                        <div>
                                                            <p className="text-xs font-medium uppercase text-slate-400">Related Finding</p>
                                                            <p className="mt-1 text-sm text-slate-700">{rec.finding_description}</p>
                                                        </div>
                                                    )}
                                                    {rec.action_url && (
                                                        <a
                                                            href={rec.action_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                                                        >
                                                            Open in Admin Center &rarr;
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        No recommendations match your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {pagination.total > 0 && (
                        <PaginationControls
                            currentPage={pagination.current_page}
                            lastPage={pagination.last_page}
                            perPage={pagination.per_page}
                            total={pagination.total}
                            onPageChange={(page) => fetchRecommendations(page, pagination.per_page, filters)}
                            onPerPageChange={(pp) => fetchRecommendations(1, pp, filters)}
                        />
                    )}
                </div>
            )}
        </AppLayout>
    );
}
