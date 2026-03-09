import { Link } from '@inertiajs/react';

type Integration = { id: number; slug: string; name: string; status: string };
type RecentError = { tenant_id: string; sync_job: string; started_at: string };

type Props = {
    integrations: Integration[];
    recentErrors: RecentError[];
};

const statusStyles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    configured: 'bg-blue-100 text-blue-700',
    not_configured: 'bg-slate-100 text-slate-500',
};

export default function IntegrationStatusGrid({ integrations, recentErrors }: Props) {
    if (integrations.length === 0) {
        return <p className="py-8 text-center text-sm text-slate-400">No integrations configured.</p>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {integrations.map((integration) => {
                const errCount = recentErrors.filter((e) =>
                    e.sync_job.toLowerCase().includes(integration.slug.replace(/-/g, '').toLowerCase())
                ).length;

                return (
                    <Link
                        key={integration.id}
                        href="/integrations/health"
                        className="rounded-lg border border-slate-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                        <p className="text-sm font-medium text-slate-800 truncate">{integration.name}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[integration.status] ?? statusStyles.not_configured}`}>
                                {integration.status.replace('_', ' ')}
                            </span>
                            {errCount > 0 && (
                                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">
                                    {errCount} err
                                </span>
                            )}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
