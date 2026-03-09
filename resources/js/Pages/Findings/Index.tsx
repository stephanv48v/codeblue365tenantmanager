import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import BulkActionBar from '../../Components/BulkActionBar';
import DetailPanel from '../../Components/DetailPanel';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import useFindingsData from './hooks/useFindingsData';

const severityVariant = (s: string) => {
    switch (s) {
        case 'critical': return 'critical' as const;
        case 'high': return 'high' as const;
        case 'medium': return 'medium' as const;
        case 'low': return 'low' as const;
        default: return 'info' as const;
    }
};

const accentBorder: Record<string, string> = {
    critical: 'border-l-red-500',
    high: 'border-l-orange-500',
    medium: 'border-l-amber-500',
    low: 'border-l-blue-400',
};

export default function FindingsIndex() {
    const {
        findings, pagination, summary, loading,
        selectedFinding, setSelectedFinding,
        selectedIds, setSelectedIds,
        filters, setFilters,
        fetchFindings, bulkUpdate,
        toggleSelection, toggleAll,
    } = useFindingsData();

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        fetchFindings(1, pagination.per_page, newFilters);
    };

    const handleSearch = (value: string) => {
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        setTimeout(() => fetchFindings(1, pagination.per_page, newFilters), 300);
    };

    const handleReset = () => {
        const empty = { tenant_id: '', severity: '', category: '', status: '', search: '' };
        setFilters(empty);
        fetchFindings(1, pagination.per_page, empty);
    };

    return (
        <AppLayout title="Findings">
            <PageHeader
                title="Findings"
                subtitle="Security and compliance findings across all tenants"
                breadcrumbs={[{ label: 'Security & Compliance' }, { label: 'Findings' }]}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Total" value={summary.total} icon={ShieldExclamationIcon} accentColor="blue" />
                <StatCard label="Open" value={summary.open} accentColor={summary.open > 0 ? 'red' : 'emerald'} />
                <StatCard label="Critical" value={summary.critical} accentColor="red" />
                <StatCard label="High" value={summary.high} accentColor="amber" />
                <StatCard label="Medium" value={summary.medium} accentColor="amber" />
                <StatCard label="Low" value={summary.low} accentColor="blue" />
            </div>

            {/* Filter Bar */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        { key: 'severity', label: 'All Severities', options: [
                            { value: 'critical', label: 'Critical' },
                            { value: 'high', label: 'High' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'low', label: 'Low' },
                        ]},
                        { key: 'category', label: 'All Categories', options: [
                            { value: 'identity', label: 'Identity' },
                            { value: 'devices', label: 'Devices' },
                            { value: 'licensing', label: 'Licensing' },
                            { value: 'security', label: 'Security' },
                            { value: 'governance', label: 'Governance' },
                        ]},
                        { key: 'status', label: 'All Statuses', options: [
                            { value: 'open', label: 'Open' },
                            { value: 'acknowledged', label: 'Acknowledged' },
                            { value: 'dismissed', label: 'Dismissed' },
                        ]},
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{ value: filters.search, onChange: handleSearch, placeholder: 'Search findings...' }}
                    onReset={handleReset}
                />
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="mb-4">
                    <BulkActionBar
                        selectedCount={selectedIds.size}
                        actions={[
                            { label: 'Acknowledge', onClick: () => bulkUpdate(Array.from(selectedIds), 'acknowledge') },
                            { label: 'Dismiss', onClick: () => bulkUpdate(Array.from(selectedIds), 'dismiss'), variant: 'danger' },
                            { label: 'Reopen', onClick: () => bulkUpdate(Array.from(selectedIds), 'reopen'), variant: 'default' },
                        ]}
                        onClearSelection={() => setSelectedIds(new Set())}
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
                                        checked={findings.length > 0 && selectedIds.size === findings.length}
                                        onChange={toggleAll}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-4 py-3">Severity</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3">Tenant</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Detected</th>
                            </tr>
                        </thead>
                        <tbody>
                            {findings.map((f) => (
                                <tr
                                    key={f.id}
                                    className={`border-b border-l-4 ${accentBorder[f.severity] ?? 'border-l-slate-300'} last:border-b-0 hover:bg-slate-50/50 cursor-pointer`}
                                    onClick={() => setSelectedFinding(f)}
                                >
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(f.id)}
                                            onChange={() => toggleSelection(f.id)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge variant={severityVariant(f.severity)} label={f.severity} />
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 capitalize">{f.category.replace(/_/g, ' ')}</td>
                                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">{f.description}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{f.customer_name ?? f.tenant_id.slice(0, 12) + '...'}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge
                                            variant={f.status === 'open' ? 'critical' : f.status === 'acknowledged' ? 'warning' : 'neutral'}
                                            label={f.status ?? 'open'}
                                            dot
                                        />
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                        {f.last_detected_at ? new Date(f.last_detected_at).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                            {findings.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        No findings match your filters.
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
                            onPageChange={(page) => fetchFindings(page, pagination.per_page)}
                            onPerPageChange={(pp) => fetchFindings(1, pp)}
                        />
                    )}
                </div>
            )}

            {/* Detail Panel */}
            <DetailPanel
                open={selectedFinding !== null}
                onClose={() => setSelectedFinding(null)}
                title="Finding Details"
                subtitle={selectedFinding?.category.replace(/_/g, ' ')}
            >
                {selectedFinding && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3">
                            <StatusBadge variant={severityVariant(selectedFinding.severity)} label={selectedFinding.severity} size="md" />
                            <StatusBadge
                                variant={selectedFinding.status === 'open' ? 'critical' : selectedFinding.status === 'acknowledged' ? 'warning' : 'neutral'}
                                label={selectedFinding.status ?? 'open'}
                                size="md"
                                dot
                            />
                        </div>

                        <div>
                            <h4 className="text-xs font-medium uppercase tracking-wide text-slate-400">Description</h4>
                            <p className="mt-1 text-sm text-slate-700">{selectedFinding.description}</p>
                        </div>

                        {selectedFinding.impact && (
                            <div>
                                <h4 className="text-xs font-medium uppercase tracking-wide text-slate-400">Impact</h4>
                                <p className="mt-1 text-sm text-slate-700">{selectedFinding.impact}</p>
                            </div>
                        )}

                        {selectedFinding.recommended_remediation && (
                            <div>
                                <h4 className="text-xs font-medium uppercase tracking-wide text-slate-400">Recommended Remediation</h4>
                                <p className="mt-1 text-sm text-blue-700">{selectedFinding.recommended_remediation}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <p className="text-xs text-slate-400">Tenant</p>
                                <p className="mt-0.5 text-sm font-medium text-slate-700">{selectedFinding.customer_name ?? selectedFinding.tenant_id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Category</p>
                                <p className="mt-0.5 text-sm font-medium text-slate-700 capitalize">{selectedFinding.category.replace(/_/g, ' ')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">First Detected</p>
                                <p className="mt-0.5 text-sm text-slate-700">{selectedFinding.first_detected_at ? new Date(selectedFinding.first_detected_at).toLocaleString() : '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Last Detected</p>
                                <p className="mt-0.5 text-sm text-slate-700">{selectedFinding.last_detected_at ? new Date(selectedFinding.last_detected_at).toLocaleString() : '-'}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => { bulkUpdate([selectedFinding.id], 'acknowledge'); setSelectedFinding(null); }}
                                className="rounded-lg bg-amber-50 border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
                            >
                                Acknowledge
                            </button>
                            <button
                                onClick={() => { bulkUpdate([selectedFinding.id], 'dismiss'); setSelectedFinding(null); }}
                                className="rounded-lg bg-slate-50 border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                                Dismiss
                            </button>
                            {selectedFinding.status !== 'open' && (
                                <button
                                    onClick={() => { bulkUpdate([selectedFinding.id], 'reopen'); setSelectedFinding(null); }}
                                    className="rounded-lg bg-blue-50 border border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                                >
                                    Reopen
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </DetailPanel>
        </AppLayout>
    );
}
