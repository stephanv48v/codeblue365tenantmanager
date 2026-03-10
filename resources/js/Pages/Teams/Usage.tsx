import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import ChartCard from '../../Components/ChartCard';
import PaginationControls from '../../Components/PaginationControls';
import SkeletonLoader from '../../Components/SkeletonLoader';
import FilterBar from '../../Components/FilterBar';
import { useTeamsUsageData } from './hooks/useTeamsData';
import { useTenantScope } from '../../hooks/useTenantScope';
import {
    ChatBubbleLeftRightIcon,
    VideoCameraIcon,
    PhoneIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

// ── Main Component ──────────────────────────────────────────────────────────

export default function TeamsUsage() {
    const { isFiltered } = useTenantScope();
    const {
        data, loading, search, page, perPage,
        setSearch, setPage, setPerPage, fetchData,
    } = useTeamsUsageData();

    // ── Search handler ──────────────────────────────────────────────────────

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
        fetchData(1, perPage, value);
    };

    const handleReset = () => {
        setSearch('');
        setPage(1);
        fetchData(1, perPage, '');
    };

    // ── Loading state ───────────────────────────────────────────────────────

    if (loading && !data) {
        return (
            <AppLayout title="Teams Usage Analytics">
                <PageHeader
                    title="Teams Usage Analytics"
                    subtitle="Detailed usage metrics and activity trends"
                    breadcrumbs={[{ label: 'Teams', href: '/teams' }, { label: 'Usage Analytics' }]}
                />
                <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                    <SkeletonLoader variant="stat-card" count={4} className="contents" />
                </div>
                <SkeletonLoader variant="chart" count={2} />
            </AppLayout>
        );
    }

    const d = data!;

    return (
        <AppLayout title="Teams Usage Analytics">
            <PageHeader
                title="Teams Usage Analytics"
                subtitle="Detailed usage metrics and activity trends"
                breadcrumbs={[{ label: 'Teams', href: '/teams' }, { label: 'Usage Analytics' }]}
            />

            {/* ── Stat Cards ────────────────────────────────────────────────── */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard
                    label="Total Messages"
                    value={d.total_messages.toLocaleString()}
                    icon={ChatBubbleLeftRightIcon}
                    accentColor="blue"
                />
                <StatCard
                    label="Total Meetings"
                    value={d.total_meetings.toLocaleString()}
                    icon={VideoCameraIcon}
                    accentColor="purple"
                />
                <StatCard
                    label="Total Calls"
                    value={d.total_calls.toLocaleString()}
                    icon={PhoneIcon}
                    accentColor="emerald"
                />
                <StatCard
                    label="Avg Meeting Duration"
                    value={`${d.avg_meeting_minutes} min`}
                    icon={ClockIcon}
                    accentColor="cyan"
                />
            </div>

            {/* ── Messages Trend ─────────────────────────────────────────────── */}
            {d.trend && d.trend.length > 0 && (
                <div className="mb-6 grid gap-6 lg:grid-cols-2">
                    <ChartCard title="Messages Trend" subtitle="Daily message volume over time">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={d.trend}>
                                <defs>
                                    <linearGradient id="messagesGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(v: string) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        return (
                                            <div className="rounded-lg border bg-white px-3 py-2 shadow-lg text-xs">
                                                <p className="font-semibold text-slate-800 mb-1">
                                                    {new Date(label).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                {payload.map((p) => (
                                                    <p key={p.dataKey} className="text-slate-600">
                                                        <span className="inline-block h-2 w-2 rounded-full mr-1" style={{ backgroundColor: p.color }} />
                                                        {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
                                                    </p>
                                                ))}
                                            </div>
                                        );
                                    }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="messages" name="Messages" stroke="#3b82f6" strokeWidth={2} fill="url(#messagesGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Meetings & Calls" subtitle="Activity breakdown over time">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={d.trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(v: string) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        return (
                                            <div className="rounded-lg border bg-white px-3 py-2 shadow-lg text-xs">
                                                <p className="font-semibold text-slate-800 mb-1">
                                                    {new Date(label).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                {payload.map((p) => (
                                                    <p key={p.dataKey} className="text-slate-600">
                                                        <span className="inline-block h-2 w-2 rounded-full mr-1" style={{ backgroundColor: p.color }} />
                                                        {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
                                                    </p>
                                                ))}
                                            </div>
                                        );
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="meetings" name="Meetings" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="calls" name="Calls" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}

            {/* ── User Activity Search ───────────────────────────────────────── */}
            <div className="mb-4">
                <FilterBar
                    filters={[]}
                    values={{}}
                    onChange={() => {}}
                    search={{
                        value: search,
                        onChange: handleSearchChange,
                        placeholder: 'Search by user name or UPN...',
                    }}
                    onReset={handleReset}
                />
            </div>

            {/* ── User Activity Table ────────────────────────────────────────── */}
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
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">UPN</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Messages Sent</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Meetings Attended</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Calls Made</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Meeting Minutes</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Last Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {d.user_activity.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{user.display_name}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{user.user_principal_name}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{user.messages_sent.toLocaleString()}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{user.meetings_attended}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{user.calls_made}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">{user.meeting_minutes.toLocaleString()}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                                {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {d.user_activity.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                                                No user activity data available.
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
                                onPageChange={(pg) => { setPage(pg); fetchData(pg, perPage, search); }}
                                onPerPageChange={(pp) => { setPerPage(pp); setPage(1); fetchData(1, pp, search); }}
                            />
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
