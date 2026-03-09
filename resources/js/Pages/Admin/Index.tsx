import { useState } from 'react';
import {
    ClipboardDocumentListIcon,
    AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import useAdminData from './hooks/useAdminData';

const defaultThresholds: Record<string, { label: string; description: string; suffix: string; defaultValue: number }> = {
    mfa_coverage_min: { label: 'MFA Coverage Minimum', description: 'Alert when MFA coverage drops below this percentage', suffix: '%', defaultValue: 90 },
    stale_days: { label: 'Stale Account Threshold', description: 'Mark users as stale after this many days of inactivity', suffix: ' days', defaultValue: 90 },
    license_waste_max: { label: 'License Waste Maximum', description: 'Alert when license waste exceeds this percentage', suffix: '%', defaultValue: 10 },
    device_compliance_min: { label: 'Device Compliance Minimum', description: 'Alert when device compliance drops below this percentage', suffix: '%', defaultValue: 90 },
    secure_score_min: { label: 'Secure Score Minimum', description: 'Alert when Microsoft Secure Score drops below this percentage', suffix: '%', defaultValue: 50 },
};

const tabs = [
    { key: 'audit-logs', label: 'Audit Logs', icon: ClipboardDocumentListIcon },
    { key: 'thresholds', label: 'Thresholds', icon: AdjustmentsHorizontalIcon },
] as const;

type Tab = (typeof tabs)[number]['key'];

export default function AdminIndex() {
    const [activeTab, setActiveTab] = useState<Tab>('audit-logs');
    const {
        auditLogs, pagination, eventTypes, thresholds, loading, thresholdsLoading,
        filters, setFilters, fetchAuditLogs, saveThresholds,
    } = useAdminData();

    const [thresholdValues, setThresholdValues] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const getThresholdValue = (key: string): number => {
        if (thresholdValues[key] !== undefined) return thresholdValues[key];
        const found = thresholds.find((t) => t.key === key);
        if (found && typeof found.value === 'number') return found.value;
        return defaultThresholds[key]?.defaultValue ?? 0;
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        fetchAuditLogs(1, pagination.per_page, newFilters);
    };

    const handleSearchChange = (value: string) => {
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        setTimeout(() => fetchAuditLogs(1, pagination.per_page, newFilters), 300);
    };

    const handleResetFilters = () => {
        const empty = { event_type: '', actor: '', date_from: '', date_to: '', search: '' };
        setFilters(empty);
        fetchAuditLogs(1, pagination.per_page, empty);
    };

    const handleSaveThresholds = async () => {
        setSaving(true);
        const settings = Object.keys(defaultThresholds).map((key) => ({
            key,
            value: getThresholdValue(key),
        }));
        const success = await saveThresholds(settings);
        setSaving(false);
        if (success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    return (
        <AppLayout title="Administration">
            <PageHeader
                title="Administration"
                subtitle="Manage audit logs, thresholds, and system configuration"
            />

            {/* Tabs */}
            <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === tab.key
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Audit Logs Tab */}
            {activeTab === 'audit-logs' && (
                <div className="space-y-4">
                    <FilterBar
                        filters={[
                            {
                                key: 'event_type',
                                label: 'All Event Types',
                                options: eventTypes.map((t) => ({ value: t, label: t })),
                            },
                        ]}
                        values={{ event_type: filters.event_type }}
                        onChange={handleFilterChange}
                        search={{
                            value: filters.search,
                            onChange: handleSearchChange,
                            placeholder: 'Search events, actors, payloads...',
                        }}
                        onReset={handleResetFilters}
                    />

                    <div className="rounded-xl border border-slate-200 bg-white">
                        {loading ? (
                            <div className="p-6">
                                <SkeletonLoader variant="table" count={8} />
                            </div>
                        ) : (
                            <>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            <th className="px-6 py-3">Event</th>
                                            <th className="px-6 py-3">Actor</th>
                                            <th className="px-6 py-3">Details</th>
                                            <th className="px-6 py-3">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditLogs.map((log) => (
                                            <tr key={log.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                                <td className="px-6 py-3">
                                                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                                                        {log.event_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-slate-600">
                                                    {log.actor_identifier ?? (
                                                        <span className="text-slate-400">system</span>
                                                    )}
                                                </td>
                                                <td className="max-w-xs truncate px-6 py-3 text-xs text-slate-400">
                                                    {log.payload ?? '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-3 text-xs text-slate-400">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {auditLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                    No audit logs match your filters.
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
                                        onPageChange={(page) => fetchAuditLogs(page, pagination.per_page)}
                                        onPerPageChange={(pp) => fetchAuditLogs(1, pp)}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Thresholds Tab */}
            {activeTab === 'thresholds' && (
                <div className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                        <div className="mb-6">
                            <h3 className="text-base font-semibold text-slate-800">Alert Thresholds</h3>
                            <p className="mt-0.5 text-sm text-slate-500">
                                Configure the thresholds that trigger findings and alerts across your managed tenants.
                            </p>
                        </div>

                        {thresholdsLoading ? (
                            <SkeletonLoader variant="stat-card" count={5} />
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(defaultThresholds).map(([key, config]) => (
                                    <div key={key} className="rounded-lg border border-slate-200 p-4">
                                        <label className="block text-sm font-medium text-slate-700">
                                            {config.label}
                                        </label>
                                        <p className="mt-0.5 text-xs text-slate-400">{config.description}</p>
                                        <div className="mt-3 flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={getThresholdValue(key)}
                                                onChange={(e) =>
                                                    setThresholdValues((prev) => ({
                                                        ...prev,
                                                        [key]: Number(e.target.value),
                                                    }))
                                                }
                                                className="w-24 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                min={0}
                                                max={key === 'stale_days' ? 365 : 100}
                                            />
                                            <span className="text-sm text-slate-400">{config.suffix}</span>
                                        </div>
                                    </div>
                                ))}

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={handleSaveThresholds}
                                        disabled={saving}
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save Thresholds'}
                                    </button>
                                    {saved && (
                                        <span className="text-sm font-medium text-emerald-600">
                                            Thresholds saved successfully
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
