import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import { useNotificationsData } from './hooks/useNotificationsData';
import { BellIcon, EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const channelTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case 'email': return EnvelopeIcon;
        case 'teams-webhook':
        case 'teams': return ChatBubbleLeftRightIcon;
        default: return BellIcon;
    }
};

const channelTypeVariant = (type: string) => {
    switch (type.toLowerCase()) {
        case 'email': return 'info' as const;
        case 'teams-webhook':
        case 'teams': return 'active' as const;
        default: return 'neutral' as const;
    }
};

const severityVariant = (severity: string) => {
    switch (severity.toLowerCase()) {
        case 'critical': return 'critical' as const;
        case 'high': return 'high' as const;
        case 'medium': return 'warning' as const;
        case 'low': return 'info' as const;
        default: return 'neutral' as const;
    }
};

export default function NotificationsIndex() {
    const { data, loading, error, fetchData } = useNotificationsData();

    if (loading && !data) {
        return (
            <AppLayout title="Notifications">
                <PageHeader
                    title="Notification Settings"
                    subtitle="Manage notification channels and rules"
                    breadcrumbs={[{ label: 'Administration', href: '/settings' }, { label: 'Notifications' }]}
                />
                <div className="mb-6">
                    <SkeletonLoader variant="stat-card" count={3} className="grid gap-4 grid-cols-1 md:grid-cols-3" />
                </div>
                <SkeletonLoader variant="table" count={6} />
            </AppLayout>
        );
    }

    if (!data || error) {
        return (
            <AppLayout title="Notifications">
                <PageHeader
                    title="Notification Settings"
                    subtitle="Manage notification channels and rules"
                    breadcrumbs={[{ label: 'Administration', href: '/settings' }, { label: 'Notifications' }]}
                />
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    {error ?? 'Unable to load notification settings. Please try again later.'}
                </div>
            </AppLayout>
        );
    }

    const { channels, rules } = data;

    return (
        <AppLayout title="Notifications">
            <PageHeader
                title="Notification Settings"
                subtitle="Manage notification channels and rules"
                breadcrumbs={[{ label: 'Administration', href: '/settings' }, { label: 'Notifications' }]}
            />

            {/* Channels Section */}
            <div className="mb-8">
                <h2 className="mb-4 text-base font-semibold text-slate-800">Notification Channels</h2>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {channels.map((channel) => {
                        const Icon = channelTypeIcon(channel.type);
                        return (
                            <div
                                key={channel.id}
                                className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{channel.name}</p>
                                            <StatusBadge variant={channelTypeVariant(channel.type)} label={channel.type} />
                                        </div>
                                    </div>
                                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <span className={`h-2 w-2 rounded-full ${channel.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        {channel.enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                                <div className="mt-3 border-t border-slate-100 pt-3">
                                    <p className="text-xs text-slate-400">
                                        Last sent: {channel.last_sent_at ? new Date(channel.last_sent_at).toLocaleString() : 'Never'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    {channels.length === 0 && (
                        <div className="col-span-full flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400">
                            No notification channels configured.
                        </div>
                    )}
                </div>
            </div>

            {/* Rules Section */}
            <div>
                <h2 className="mb-4 text-base font-semibold text-slate-800">Notification Rules</h2>
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Event Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Severity Threshold</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Channel</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Enabled</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rules.map((rule) => (
                                    <tr key={rule.id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 capitalize">{rule.event_type.replace(/_/g, ' ')}</td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <StatusBadge variant={severityVariant(rule.severity_threshold)} label={rule.severity_threshold} />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{rule.channel_name}</td>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <StatusBadge variant={rule.enabled ? 'enabled' : 'disabled'} label={rule.enabled ? 'Enabled' : 'Disabled'} dot />
                                        </td>
                                    </tr>
                                ))}
                                {rules.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-sm text-slate-400">
                                            No notification rules configured.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
