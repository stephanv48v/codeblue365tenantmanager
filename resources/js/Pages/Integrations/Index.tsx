import { FormEvent, useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

type Integration = { slug: string; name: string; status: string };
type ValidationCheck = { name: string; result: string };

type ValidationResult = {
  integration: string;
  tenant_id: string;
  status: string;
  checks: ValidationCheck[];
};

export default function IntegrationsIndex() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [integrationSlug, setIntegrationSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch('/api/v1/integrations');
      const payload = await response.json();
      const items = payload?.data?.items ?? [];
      setIntegrations(items);
      if (items.length > 0) {
        setIntegrationSlug(items[0].slug);
      }
    }

    void load();
  }, []);

  const onValidate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/v1/integrations/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ integration_slug: integrationSlug, tenant_id: tenantId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error?.message ?? 'Integration validation failed.');
      }

      setResult(payload?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Integration validation failed.');
    }
  };

  return (
    <AppLayout title="Integrations" userRoles={['integration-admin']}>
      <div className="mb-6 rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">Validate Integration</h2>
        <form className="mt-4 flex flex-col gap-3 md:flex-row md:items-end" onSubmit={onValidate}>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Integration
            <select
              className="rounded border px-3 py-2"
              value={integrationSlug}
              onChange={(e) => setIntegrationSlug(e.target.value)}
              required
            >
              {integrations.map((integration) => (
                <option key={integration.slug} value={integration.slug}>
                  {integration.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Tenant ID
            <input
              className="rounded border px-3 py-2"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="contoso.onmicrosoft.com tenant"
              required
            />
          </label>
          <button className="w-fit rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">
            Run Validation
          </button>
        </form>

        {error && <p className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm">{error}</p>}
        {result && (
          <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
            <p>
              Validation status for <strong>{result.integration}</strong> on tenant <strong>{result.tenant_id}</strong>: {result.status}
            </p>
            <ul className="mt-2 list-disc pl-4">
              {result.checks.map((check) => (
                <li key={check.name}>
                  {check.name}: {check.result}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {integrations.map((integration) => (
          <div key={integration.slug} className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="font-semibold">{integration.name}</h3>
            <p className="mt-2 text-sm text-slate-600">Status: {integration.status}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
