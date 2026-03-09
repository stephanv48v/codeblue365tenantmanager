import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import BulkActionBar from '../../Components/BulkActionBar';
import { useTenantScope } from '../../hooks/useTenantScope';
import { BellAlertIcon, CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline';

type Alert = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    type: string;
    severity: string;
    title: string;
    message: string | null;
    status: string;
    acknowledged_by: string | null;
    acknowledged_at: string | null;
    created_at: string;
};

type Pagination = {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

type Summary = {
    total: number;
    open: number;
    acknowledged: number;
    dismissed: number;
};

const severityVariant = (severity: string) => {
    switch (severity) {
        case 'critical': return 'critical' as const;
        case 'high': return 'high' as const;
        case 'medium': return 'medium' as const;
        case 'low': return 'low' as const;
        default: return 'info' as const;
    }
};

export default function AlertsIndex() {
    const { selectedTenantId } = useTenantScope();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, per_page: 25, current_page: 1, last_page: 1 });
    const [summary, setSummary] = useState<Summary>({ total: 0, open: 0, acknowledged: 0, dismissed: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [filters, setFilters] = useState({ status: '', severity: '', search: '' });

    const fetchAlerts = useCallback(async (page = 1, perPage = 25, currentFilters?: typeof filters) => {
        setLoading(true);
        const f = currentFilters ?? filters;
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', String(perPage));
        if (selectedTenantId) params.set('tenant_id', selectedTenantId);
        if (f.status) params.set('status', f.status);
        if (f.severity) params.set('severity', f.severity);
        if (f.search) params.set('search', f.search);

        try {
            const res = await fetch(`/api/v1/alerts?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setAlerts(data.data.items ?? []);
                setPagination(data.data.pagination ?? { total: 0, per_page: perPage, current_page: 1, last_page: 1 });
                setSummary(data.data.summary ?? { total: 0, open: 0, acknowledged: 0, dismissed: 0 });
            }
        } finally {
            setLoading(false);
        }
    }, [filters, selectedTenantId]);

    useEffect(() => {
        fetchAlerts();
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleBulkAction = async (action: 'dismiss' | 'acknowledge') => {
        await fetch('/api/v1/alerts/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: Array.from(selectedIds), action }),
        });
        setSelectedIds(new Set());
        fetchAlerts(pagination.current_page, pagination.per_page);
    };

    const handleSingleAction = async (id: number, action: 'acknowledge' | 'dismiss') => {
        await fetch(`/api/v1/alerts/${id}/${action}`, { method: 'PUT' });
        fetchAlerts(pagination.current_page, pagination.per_page);
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        fetchAlerts(1, pagination.per_page, newFilters);
    };

    const handleSearch = (value: string) => {
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        setTimeout(() => fetchAlerts(1, pagination.per_page, newFilters), 300);
    };

    const handleReset = () => {
        const empty = { status: '', severity: '', search: '' };
        setFilters(empty);
        fetchAlerts(1, pagination.per_page, empty);
    };

    const toggleSelection = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIds.size === alerts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(alerts.map((a) => a.id)));
        }
    };

    return (
        <AppLayout title="Alerts">
            <PageHeader
                title="Alerts"
                subtitle="System alerts and notifications"
                breadcrumbs={[{ label: 'Security & Compliance' }, { label: 'Alerts' }]}
            />

            {/* Stat Cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Total" value={summary.total} icon={BellAlertIcon} accentColor="blue" />
                <StatCard label="Open" value={summary.open} accentColor={summary.open > 0 ? 'red' : 'emerald'} />
                <StatCard label="Acknowledged" value={summary.acknowledged} icon={EyeIcon} accentColor="amber" />
                <StatCard label="Dismissed" value={summary.dismissed} icon={CheckCircleIcon} accentColor="slate" />
            </div>

            {/* Filter Bar */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        { key: 'status', label: 'All Statuses', options: [
                            { value: 'open', label: 'Open' },
                            { value: 'acknowledged', label: 'Acknowledged' },
                            { value: 'dismissed', label: 'Dismissed' },
                        ]},
                        { key: 'severity', label: 'All Severities', options: [
                            { value: 'critical', label: 'Critical' },
                            { value: 'high', label: 'High' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'low', label: 'Low' },
                        ]},
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{ value: filters.search, onChange: handleSearch, placeholder: 'Search alerts...' }}
                    onReset={handleReset}
                />
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="mb-4">
                    <BulkActionBar
                        selectedCount={selectedIds.size}
                        actions={[
                            { label: 'Acknowledge', onClick: () => handleBulkAction('acknowledge') },
                            { label: 'Dismiss', onClick: () => handleBulkAction('dismiss'), variant: 'danger' },
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
                                        checked={alerts.length > 0 && selectedIds.size === alerts.length}
                                        onChange={toggleAll}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-4 py-3">Severity</th>
                                <th className="px-4 py-3">Alert</th>
                                <th className="px-4 py-3">Tenant</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Created</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map((alert) => (
                                <tr key={alert.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(alert.id)}
                                            onChange={() => toggleSelection(alert.id)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge variant={severityVariant(alert.severity)} label={alert.severity} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-slate-800">{alert.title}</p>
                                        {alert.message && <p className="mt-0.5 truncate text-xs text-slate-500 max-w-xs">{alert.message}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{alert.customer_name ?? alert.tenant_id.slice(0, 12) + '...'}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge
                                            variant={alert.status === 'open' ? 'critical' : alert.status === 'acknowledged' ? 'warning' : 'neutral'}
                                            label={alert.status}
                                            dot
                                        />
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                        {new Date(alert.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        {alert.status === 'open' && (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleSingleAction(alert.id, 'acknowledge')}
                                                    className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                                                >
                                                    Ack
                                                </button>
                                                <button
                                                    onClick={() => handleSingleAction(alert.id, 'dismiss')}
                                                    className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {alerts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        No alerts match your filters.
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
                            onPageChange={(page) => fetchAlerts(page, pagination.per_page)}
                            onPerPageChange={(pp) => fetchAlerts(1, pp)}
                        />
                    )}
                </div>
            )}
        </AppLayout>
    );
}
