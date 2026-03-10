import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import SkeletonLoader from '../../Components/SkeletonLoader';
import StatusBadge from '../../Components/StatusBadge';
import FilterBar from '../../Components/FilterBar';
import ExportButton from '../../Components/ExportButton';
import { useConditionalAccessData, type CaFilters } from './hooks/useConditionalAccessData';
import { KeyIcon, CheckCircleIcon, DocumentTextIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import { useTenantScope } from '../../hooks/useTenantScope';

// ── Helpers ─────────────────────────────────────────────────────────────────

const stateVariant = (state: string) => {
    switch (state) {
        case 'enabled': return 'enabled' as const;
        case 'enabledForReportingButNotEnforced': return 'reportOnly' as const;
        case 'disabled': return 'disabled' as const;
        default: return 'neutral' as const;
    }
};

const stateLabel = (state: string) => {
    switch (state) {
        case 'enabled': return 'Enabled';
        case 'enabledForReportingButNotEnforced': return 'Report Only';
        case 'disabled': return 'Disabled';
        default: return state;
    }
};

function parseConditions(conditionsJson: string): string[] {
    try {
        const parsed = JSON.parse(conditionsJson);
        const tags: string[] = [];
        if (parsed.users?.includeUsers?.length) {
            tags.push(
                `Users: ${parsed.users.includeUsers.length === 1 && parsed.users.includeUsers[0] === 'All' ? 'All Users' : `${parsed.users.includeUsers.length} users`}`,
            );
        }
        if (parsed.users?.includeGroups?.length) {
            tags.push(`Groups: ${parsed.users.includeGroups.length}`);
        }
        if (parsed.applications?.includeApplications?.length) {
            const apps = parsed.applications.includeApplications;
            tags.push(apps[0] === 'All' ? 'All Apps' : `${apps.length} apps`);
        }
        if (parsed.platforms?.includePlatforms?.length) {
            tags.push(`Platforms: ${parsed.platforms.includePlatforms.join(', ')}`);
        }
        if (parsed.locations?.includeLocations?.length) {
            tags.push(`Locations: ${parsed.locations.includeLocations.length}`);
        }
        return tags;
    } catch {
        return [];
    }
}

function parseGrantControls(grantJson: string): string[] {
    try {
        const parsed = JSON.parse(grantJson);
        return parsed.builtInControls ?? [];
    } catch {
        return [];
    }
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function ConditionalAccess() {
    const { isFiltered } = useTenantScope();
    const { data, loading, filters, search, setFilters, setSearch, fetchPolicies } = useConditionalAccessData();

    // ── Filter handlers ─────────────────────────────────────────────────────

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: CaFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        fetchPolicies(newFilters, search);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        fetchPolicies(filters, value);
    };

    const handleReset = () => {
        const empty: CaFilters = { state: '' };
        setFilters(empty);
        setSearch('');
        fetchPolicies(empty, '');
    };

    // ── Loading state ───────────────────────────────────────────────────────

    if (loading && !data) {
        return (
            <AppLayout title="Conditional Access">
                <PageHeader
                    title="Conditional Access Policies"
                    subtitle="Cross-tenant Conditional Access policy inventory"
                    breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Conditional Access' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
            </AppLayout>
        );
    }

    const d = data!;

    return (
        <AppLayout title="Conditional Access">
            <PageHeader
                title="Conditional Access Policies"
                subtitle="Cross-tenant Conditional Access policy inventory"
                breadcrumbs={[{ label: 'Identity', href: '/identity' }, { label: 'Conditional Access' }]}
                actions={<ExportButton csvEndpoint="/api/v1/reports/conditional-access" />}
            />

            {/* ── Stat Cards ────────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Total Policies" value={d.total} icon={KeyIcon} accentColor="blue" />
                <StatCard label="Enabled" value={d.enabled} icon={CheckCircleIcon} accentColor="emerald" />
                <StatCard label="Report Only" value={d.report_only} icon={DocumentTextIcon} accentColor="amber" />
                <StatCard label="Disabled" value={d.disabled} icon={NoSymbolIcon} accentColor="slate" />
            </div>

            {/* ── Filter Bar ────────────────────────────────────────────────── */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'state',
                            label: 'All States',
                            options: [
                                { value: 'enabled', label: 'Enabled' },
                                { value: 'enabledForReportingButNotEnforced', label: 'Report Only' },
                                { value: 'disabled', label: 'Disabled' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{
                        value: search,
                        onChange: handleSearchChange,
                        placeholder: 'Search by policy name...',
                    }}
                    onReset={handleReset}
                />
            </div>

            {/* ── Policy Cards ──────────────────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {d.items.map((policy) => {
                    const conditionTags = parseConditions(policy.conditions);
                    const grantTags = parseGrantControls(policy.grant_controls);

                    return (
                        <div key={policy.id} className="rounded-xl border border-slate-200 bg-white p-5">
                            <div className="mb-3 flex items-start justify-between">
                                <h3 className="text-sm font-semibold text-slate-800">{policy.display_name}</h3>
                                <StatusBadge variant={stateVariant(policy.state)} label={stateLabel(policy.state)} dot />
                            </div>
                            <p className="mb-3 text-xs text-slate-400">{policy.customer_name ?? policy.tenant_id.slice(0, 8)}</p>

                            {conditionTags.length > 0 && (
                                <div className="mb-2">
                                    <div className="flex flex-wrap gap-1">
                                        {conditionTags.map((tag) => (
                                            <span key={tag} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {conditionTags.length > 0 && grantTags.length > 0 && (
                                <div className="mb-2 border-t border-slate-100" />
                            )}

                            {grantTags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {grantTags.map((ctrl) => (
                                        <span key={ctrl} className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-600">
                                            {ctrl}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {d.items.length === 0 && (
                    <div className="col-span-full py-12 text-center text-sm text-slate-400">
                        No conditional access policies match your filters.
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
