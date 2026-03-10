import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import ExportButton from '../../Components/ExportButton';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import ChartCard from '../../Components/ChartCard';
import FilterBar from '../../Components/FilterBar';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useTeamsData, type TeamsFilters } from './hooks/useTeamsData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    UsersIcon,
    ChatBubbleLeftRightIcon,
    VideoCameraIcon,
    PhoneIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

// ── Helpers ─────────────────────────────────────────────────────────────────

const MESSAGE_COLORS: Record<string, string> = {
    'Channel': '#3b82f6',
    'Chat': '#10b981',
    'Reply': '#f59e0b',
    'Mentions': '#8b5cf6',
};

// ── Main Component ──────────────────────────────────────────────────────────

export default function TeamsIndex() {
    const { isFiltered } = useTenantScope();
    const {
        data, loading, filters, search, page, perPage,
        setFilters, setSearch, setPage, setPerPage, fetchData,
    } = useTeamsData();

    // ── Filter handlers ─────────────────────────────────────────────────────

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: TeamsFilters = { ...filters, [key]: value };
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
        const empty: TeamsFilters = { visibility: '' };
        setFilters(empty);
        setSearch('');
        setPage(1);
        fetchData(1, perPage, empty, '');
    };

    // ── Loading state ───────────────────────────────────────────────────────

    if (loading && !data) {
        return (
            <AppLayout title="Microsoft Teams">
                <PageHeader
                    title="Microsoft Teams"
                    subtitle="Teams inventory and collaboration analytics"
                    breadcrumbs={[{ label: 'Teams', href: '/teams' }, { label: 'Overview' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <SkeletonLoader variant="stat-card" count={5} className="contents" />
                </div>
                <SkeletonLoader variant="chart" count={1} />
            </AppLayout>
        );
    }

    const d = data!;

    // ── Chart data ──────────────────────────────────────────────────────────

    const messageTypeData = (d.message_types ?? []).map((item) => ({
        name: item.type,
        count: item.count,
        fill: MESSAGE_COLORS[item.type] ?? '#94a3b8',
    }));

    return (
        <AppLayout title="Microsoft Teams">
            <PageHeader
                title="Microsoft Teams"
                subtitle="Teams inventory and collaboration analytics"
                breadcrumbs={[{ label: 'Teams', href: '/teams' }, { label: 'Overview' }]}
                actions={<ExportButton csvEndpoint="/api/v1/teams/overview" />}
            />

            {/* ── Stat Cards ────────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Total Teams" value={d.total_teams} icon={UsersIcon} accentColor="blue" />
                <StatCard label="Active Users" value={d.active_users} icon={UsersIcon} accentColor="emerald" />
                <StatCard
                    label="Messages (30d)"
                    value={d.total_messages_30d.toLocaleString()}
                    icon={ChatBubbleLeftRightIcon}
                    accentColor="purple"
                />
                <StatCard label="Meetings" value={d.meetings_organized} icon={VideoCameraIcon} accentColor="cyan" />
                <StatCard label="Calls" value={d.calls} icon={PhoneIcon} accentColor="amber" />
            </div>

            {/* ── Message Types Chart ────────────────────────────────────────── */}
            {messageTypeData.length > 0 && (
                <div className="mb-6">
                    <ChartCard title="Message Types" subtitle="Channel messages vs. chat messages (30-day period)">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={messageTypeData}>
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" name="Messages" radius={[4, 4, 0, 0]}>
                                    {messageTypeData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}

            {/* ── Filter Bar ────────────────────────────────────────────────── */}
            <div className="mb-4">
                <FilterBar
                    filters={[
                        {
                            key: 'visibility',
                            label: 'All Visibility',
                            options: [
                                { value: 'public', label: 'Public' },
                                { value: 'private', label: 'Private' },
                            ],
                        },
                    ]}
                    values={filters}
                    onChange={handleFilterChange}
                    search={{
                        value: search,
                        onChange: handleSearchChange,
                        placeholder: 'Search by team name...',
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
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Team Name</th>
                                        {!isFiltered && (
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Visibility</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Members</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Channels</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Guests</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Archived</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d.items.map((team) => (
                                        <tr key={team.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{team.display_name}</td>
                                            {!isFiltered && (
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{team.customer_name ?? team.tenant_id.slice(0, 8)}</td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge
                                                    variant={team.visibility === 'Public' ? 'info' : 'neutral'}
                                                    label={team.visibility}
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{team.member_count}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{team.channel_count}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span className={team.guest_count > 0 ? 'font-medium text-amber-600' : 'text-slate-500'}>
                                                    {team.guest_count}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <StatusBadge
                                                    variant={team.is_archived ? 'disabled' : 'active'}
                                                    label={team.is_archived ? 'Yes' : 'No'}
                                                    dot
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                {team.last_activity ? new Date(team.last_activity).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {d.items.length === 0 && (
                                        <tr>
                                            <td colSpan={isFiltered ? 7 : 8} className="py-12 text-center text-sm text-slate-400">
                                                No teams match your filters.
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
            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Link href="/teams/usage" className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                            <ChatBubbleLeftRightIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Usage Analytics</p>
                            <p className="text-xs text-slate-400">Detailed usage metrics and trends</p>
                        </div>
                    </div>
                </Link>
                <Link href="/groups" className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <UsersIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Groups Management</p>
                            <p className="text-xs text-slate-400">View all Microsoft 365 groups</p>
                        </div>
                    </div>
                </Link>
            </div>
        </AppLayout>
    );
}
