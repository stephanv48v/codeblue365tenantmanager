import { FormEvent, useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PageHeader from '../../Components/PageHeader';
import StatCard from '../../Components/StatCard';
import StatusBadge from '../../Components/StatusBadge';
import {
    PuzzlePieceIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    PlayIcon,
} from '@heroicons/react/24/outline';

type Integration = { slug: string; name: string; status: string };
type ValidationCheck = { name: string; result: string };
type ValidationResult = {
    integration: string;
    tenant_id: string;
    status: string;
    checks: ValidationCheck[];
};

const statusVariant = (status: string) => {
    switch (status) {
        case 'healthy': return 'success' as const;
        case 'configured': return 'active' as const;
        case 'not_configured': return 'neutral' as const;
        case 'error': return 'critical' as const;
        default: return 'neutral' as const;
    }
};

export default function IntegrationsIndex() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [tenantId, setTenantId] = useState('');
    const [integrationSlug, setIntegrationSlug] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ValidationResult | null>(null);
    const [showValidation, setShowValidation] = useState(false);

    useEffect(() => {
        fetch('/api/v1/integrations')
            .then((r) => r.json())
            .then((payload) => {
                const items = payload?.data?.items ?? [];
                setIntegrations(items);
                if (items.length > 0) setIntegrationSlug(items[0].slug);
            });
    }, []);

    const onValidate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setResult(null);
        try {
            const response = await fetch('/api/v1/integrations/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ integration_slug: integrationSlug, tenant_id: tenantId }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.message ?? payload?.error?.message ?? 'Validation failed.');
            setResult(payload?.data ?? null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Validation failed.');
        }
    };

    const configured = integrations.filter((i) => i.status !== 'not_configured').length;
    const healthy = integrations.filter((i) => i.status === 'healthy').length;

    return (
        <AppLayout title="Integrations">
            <PageHeader
                title="Integrations"
                subtitle="Microsoft 365 connector inventory and validation"
                breadcrumbs={[{ label: 'Integrations' }]}
                actions={
                    <button
                        onClick={() => setShowValidation(!showValidation)}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        <PlayIcon className="h-4 w-4" />
                        Validate
                    </button>
                }
            />

            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard label="Total Integrations" value={integrations.length} icon={PuzzlePieceIcon} accentColor="blue" />
                <StatCard label="Configured" value={configured} icon={CheckCircleIcon} accentColor="emerald" />
                <StatCard label="Not Configured" value={integrations.length - configured} icon={ExclamationTriangleIcon} accentColor={integrations.length - configured > 0 ? 'amber' : 'emerald'} />
                <StatCard label="Healthy" value={healthy} accentColor="emerald" />
            </div>

            {/* Validation Panel */}
            {showValidation && (
                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
                    <h3 className="mb-4 text-sm font-semibold text-slate-800">Run Integration Validation</h3>
                    <form className="flex flex-col gap-3 md:flex-row md:items-end" onSubmit={onValidate}>
                        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-500">
                            Integration
                            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={integrationSlug} onChange={(e) => setIntegrationSlug(e.target.value)} required>
                                {integrations.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-500">
                            Tenant ID
                            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="contoso.onmicrosoft.com" required />
                        </label>
                        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" type="submit">Run</button>
                    </form>
                    {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
                    {result && (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-sm font-medium text-emerald-800">
                                {result.integration} on {result.tenant_id}: <StatusBadge variant={result.status === 'pass' ? 'success' : 'warning'} label={result.status} />
                            </p>
                            <div className="mt-2 space-y-1">
                                {result.checks.map((check) => (
                                    <div key={check.name} className="flex items-center gap-2 text-xs">
                                        <span className={`h-1.5 w-1.5 rounded-full ${check.result === 'pass' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        <span className="text-slate-700">{check.name}</span>
                                        <span className="text-slate-400">{check.result}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Integration Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {integrations.map((integration) => (
                    <div key={integration.slug} className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <h3 className="text-sm font-semibold text-slate-800">{integration.name}</h3>
                            <StatusBadge variant={statusVariant(integration.status)} label={integration.status} dot />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{integration.slug}</p>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
