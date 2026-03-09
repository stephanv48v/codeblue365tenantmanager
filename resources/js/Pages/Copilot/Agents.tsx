import { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import FilterBar from '../../Components/FilterBar';
import { useCopilotAgents } from './hooks/useCopilotAgents';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    CpuChipIcon,
    CheckCircleIcon,
    NoSymbolIcon,
    ShieldExclamationIcon,
    CubeIcon,
    WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseDataSources(json: string | null): string[] {
    if (!json) return [];
    try {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function statusVariant(status: string): 'success' | 'neutral' | 'critical' {
    if (status === 'active') return 'success';
    if (status === 'disabled') return 'neutral';
    return 'critical';
}

function statusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function CopilotAgents() {
    const { isFiltered } = useTenantScope();
    const { data, loading, filters, search, setFilters, setSearch, refetch } = useCopilotAgents();

    // ── Filter handlers ──────────────────────────────────────────────────

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        refetch(newFilters, search);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        refetch(filters, value);
    };

    const handleReset = () => {
        const empty = { status: '', type: '' };
        setFilters(empty);
        setSearch('');
        refetch(empty, '');
    };

    // ── Render ───────────────────────────────────────────────────────────

    if (loading && !data) {
        return (
            <AppLayout title="Copilot Agents">
                <PageHeader
                    title="Copilot Agents"
                    subtitle="Agent inventory and management"
                    breadcrumbs={[{ label: 'Copilot', href: '/copilot' }, { label: 'Agents' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = data;

    return (
        <AppLayout title="Copilot Agents">
            <PageHeader
                title="Copilot Agents"
                subtitle={isFiltered ? 'Agent inventory for selected tenant' : 'Agent inventory across all tenants'}
                breadcrumbs={[{ label: 'Copilot', href: '/copilot' }, { label: 'Agents' }]}
            />

            {/* ── ROW 1: Stat Cards ────────────────────────────────────────── */}
            {d && (
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <StatCard
                        label="Total Agents"
                        value={d.total}
                        icon={CpuChipIcon}
                        accentColor="blue"
                    />
                    <StatCard
                        label="Active"
                        value={d.active}
                        icon={CheckCircleIcon}
                        accentColor="emerald"
                    />
                    <StatCard
                        label="Disabled"
                        value={d.disabled}
                        icon={NoSymbolIcon}
                        accentColor="slate"
                    />
                    <StatCard
                        label="Blocked"
                        value={d.blocked}
                        icon={ShieldExclamationIcon}
                        accentColor={d.blocked > 0 ? 'red' : 'slate'}
                    />
                </div>
            )}

            {/* ── ROW 2: Type Distribution ─────────────────────────────────── */}
            {d && (
                <div className="mb-6 grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <CubeIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Declarative Agents</p>
                            <p className="text-xl font-bold text-slate-800">{d.by_type.declarative}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                            <WrenchScrewdriverIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Custom Engine Agents</p>
                            <p className="text-xl font-bold text-slate-800">{d.by_type.custom_engine}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ROW 3: Filter Bar ────────────────────────────────────────── */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'status',
                            label: 'All Statuses',
                            options: [
                                { value: 'active', label: 'Active' },
                                { value: 'disabled', label: 'Disabled' },
                                { value: 'blocked', label: 'Blocked' },
                            ],
                        },
                        {
                            key: 'type',
                            label: 'All Types',
                            options: [
                                { value: 'declarative', label: 'Declarative' },
                                { value: 'custom_engine', label: 'Custom Engine' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{
                        value: search,
                        onChange: handleSearchChange,
                        placeholder: 'Search by name or description...',
                    }}
                    onReset={handleReset}
                />
            </div>

            {/* ── ROW 4: Agent Cards Grid ──────────────────────────────────── */}
            {loading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <SkeletonLoader variant="table" count={6} />
                </div>
            ) : d && d.items.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {d.items.map((agent) => {
                        const sources = parseDataSources(agent.data_sources);
                        return (
                            <div key={agent.id} className="rounded-xl border border-slate-200 bg-white p-5">
                                {/* Header */}
                                <div className="mb-3 flex items-start justify-between">
                                    <h3 className="text-sm font-semibold text-slate-800 leading-tight">
                                        {agent.display_name}
                                    </h3>
                                    <StatusBadge
                                        variant={statusVariant(agent.status)}
                                        label={statusLabel(agent.status)}
                                        dot
                                    />
                                </div>

                                {/* Tenant */}
                                <p className="mb-2 text-xs text-slate-400">
                                    {agent.customer_name ?? agent.tenant_id.slice(0, 8)}
                                </p>

                                {/* Agent type badge */}
                                <div className="mb-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                            agent.agent_type === 'declarative'
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'bg-purple-50 text-purple-700'
                                        }`}
                                    >
                                        {agent.agent_type === 'declarative' ? 'Declarative' : 'Custom Engine'}
                                    </span>
                                </div>

                                {/* Description */}
                                {agent.description && (
                                    <p className="mb-3 line-clamp-2 text-xs text-slate-500">
                                        {agent.description}
                                    </p>
                                )}

                                {/* Data sources */}
                                {sources.length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-1">
                                        {sources.map((source, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                                            >
                                                {source}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="border-t border-slate-100 pt-3">
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span>
                                            {agent.created_by ? `By ${agent.created_by}` : 'Unknown creator'}
                                        </span>
                                        <span>{agent.interaction_count} interactions</span>
                                    </div>
                                    {agent.last_activity_at && (
                                        <p className="mt-1 text-[10px] text-slate-300">
                                            Last active: {new Date(agent.last_activity_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
                    <CpuChipIcon className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-sm text-slate-400">No agents match your filters.</p>
                </div>
            )}
        </AppLayout>
    );
}
