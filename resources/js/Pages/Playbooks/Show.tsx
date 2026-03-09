import { FormEvent, useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

type PlaybookDetail = {
  slug: string;
  title: string;
  integration_slug: string;
  version: string;
  owner?: string;
  prerequisites?: string[];
  permissions?: string[];
};

type ValidationResponse = {
  playbook: string;
  tenant_id: string;
  status: string;
  checks: Array<{ name: string; result: string; details?: string }>;
};

export default function PlaybookShow({ slug }: { slug: string }) {
  const [playbook, setPlaybook] = useState<PlaybookDetail | null>(null);
  const [tenantId, setTenantId] = useState('');
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/v1/playbooks/${slug}`);
      const payload = await response.json();
      const data = payload?.data?.playbook;
      if (!data) return;

      setPlaybook({
        ...data,
        prerequisites: typeof data.prerequisites === 'string' ? JSON.parse(data.prerequisites) : data.prerequisites,
        permissions: typeof data.permissions === 'string' ? JSON.parse(data.permissions) : data.permissions,
      });
    }

    void load();
  }, [slug]);

  const onValidatePlaybook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setValidation(null);

    try {
      const response = await fetch(`/api/v1/playbooks/${slug}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error?.message ?? 'Playbook validation failed.');
      }

      setValidation(payload?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Playbook validation failed.');
    }
  };

  if (!playbook) {
    return (
      <AppLayout title="Playbook" userRoles={['integration-admin']}>
        <div className="rounded-xl border bg-white p-4">Loading playbook...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Playbook · ${playbook.title}`} userRoles={['integration-admin']}>
      <div className="space-y-4 rounded-xl border bg-white p-4">
        <div>
          <h2 className="text-lg font-semibold">{playbook.title}</h2>
          <p className="text-sm text-slate-600">
            {playbook.integration_slug} · v{playbook.version} · Owner: {playbook.owner ?? 'Unassigned'}
          </p>
        </div>

        <form onSubmit={onValidatePlaybook} className="rounded-lg border bg-slate-50 p-3">
          <h3 className="font-medium">Validate for Tenant</h3>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Tenant ID
              <input
                className="rounded border bg-white px-3 py-2"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="Tenant ID"
                required
              />
            </label>
            <button className="w-fit rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">
              Validate Playbook
            </button>
          </div>
          {error && <p className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm">{error}</p>}
          {validation && (
            <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
              <p>
                Status: <strong>{validation.status}</strong>
              </p>
              <ul className="mt-2 list-disc pl-4">
                {validation.checks.map((check) => (
                  <li key={check.name}>
                    {check.name}: {check.result}
                    {check.details ? ` (${check.details})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>

        <div>
          <h3 className="font-medium">Prerequisites</h3>
          <ul className="list-disc pl-5 text-sm text-slate-700">
            {(playbook.prerequisites ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-medium">Required Permissions</h3>
          <ul className="list-disc pl-5 text-sm text-slate-700">
            {(playbook.permissions ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
