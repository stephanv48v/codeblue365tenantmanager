import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import SkeletonLoader from '../../Components/SkeletonLoader';
import {
    BookOpenIcon,
    CheckCircleIcon,
    ClockIcon,
    PuzzlePieceIcon,
} from '@heroicons/react/24/outline';

type Playbook = {
    slug: string;
    title: string;
    integration_slug: string;
    version: string;
    owner?: string;
    status?: string;
    last_validated_at?: string | null;
};

export default function PlaybooksIndex() {
    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const response = await fetch('/api/v1/playbooks');
            const payload = await response.json();
            setPlaybooks(payload?.data?.items ?? []);
            setLoading(false);
        }

        void load();
    }, []);

    const total = playbooks.length;
    const active = playbooks.filter((p) => !p.status || p.status === 'active').length;
    const pendingValidation = playbooks.filter((p) => p.status === 'pending_validation').length;
    const integrations = new Set(playbooks.map((p) => p.integration_slug)).size;

    const playbookStatus = (p: Playbook) => {
        if (p.status === 'pending_validation') return 'pending' as const;
        if (p.status === 'disabled') return 'disabled' as const;
        return 'active' as const;
    };

    const playbookStatusLabel = (p: Playbook) => {
        if (p.status === 'pending_validation') return 'Pending';
        if (p.status === 'disabled') return 'Disabled';
        return 'Active';
    };

    return (
        <AppLayout title="Integration Playbooks">
            <PageHeader
                title="Integration Playbooks"
                subtitle="Automation playbooks for Microsoft 365 integrations"
                breadcrumbs={[{ label: 'Integrations' }, { label: 'Playbooks' }]}
            />

            {loading ? (
                <>
                    <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                        <SkeletonLoader variant="stat-card" count={4} className="contents" />
                    </div>
                    <SkeletonLoader variant="chart" count={4} />
                </>
            ) : (
                <>
                    <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                        <StatCard label="Total Playbooks" value={total} icon={BookOpenIcon} accentColor="blue" />
                        <StatCard label="Active" value={active} icon={CheckCircleIcon} accentColor="emerald" />
                        <StatCard
                            label="Pending Validation"
                            value={pendingValidation}
                            icon={ClockIcon}
                            accentColor={pendingValidation > 0 ? 'amber' : 'emerald'}
                        />
                        <StatCard label="Integrations" value={integrations} icon={PuzzlePieceIcon} accentColor="purple" />
                    </div>

                    {playbooks.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                            <BookOpenIcon className="mx-auto h-10 w-10 text-slate-300" />
                            <p className="mt-3 text-sm font-medium text-slate-600">No playbooks configured</p>
                            <p className="mt-1 text-xs text-slate-400">Playbooks will appear here once integrations are set up.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {playbooks.map((playbook) => (
                                <a
                                    key={playbook.slug}
                                    href={`/playbooks/${playbook.slug}`}
                                    className="group rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                            <BookOpenIcon className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <StatusBadge variant={playbookStatus(playbook)} label={playbookStatusLabel(playbook)} dot />
                                    </div>
                                    <h3 className="mt-3 text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                        {playbook.title}
                                    </h3>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                            <PuzzlePieceIcon className="h-3 w-3" />
                                            {playbook.integration_slug}
                                        </span>
                                        <span className="text-xs text-slate-400">v{playbook.version}</span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                                        <span className="text-xs text-slate-400">
                                            {playbook.owner ?? 'Unassigned'}
                                        </span>
                                        {playbook.last_validated_at && (
                                            <span className="text-xs text-slate-400">
                                                Validated {new Date(playbook.last_validated_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </>
            )}
        </AppLayout>
    );
}
