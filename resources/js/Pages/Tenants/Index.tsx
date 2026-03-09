import { FormEvent, useCallback, useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

type Tenant = {
  tenant_id: string;
  customer_name: string;
  primary_domain: string;
  gdap_status: string;
  assigned_engineer?: string | null;
  support_tier?: string | null;
};

type TenantFormState = {
  tenant_id: string;
  customer_name: string;
  primary_domain: string;
  support_tier: string;
  assigned_engineer: string;
};

const emptyForm: TenantFormState = {
  tenant_id: '',
  customer_name: '',
  primary_domain: '',
  support_tier: '',
  assigned_engineer: '',
};

export default function TenantsIndex() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<TenantFormState>(emptyForm);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/tenants');
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? 'Failed to load tenants.');
      }

      setTenants(payload?.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenants.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  const onCreateTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/v1/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error?.message ?? 'Failed to create tenant.');
      }

      setForm(emptyForm);
      setMessage('Tenant created successfully.');
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant.');
    }
  };

  const onSyncTenant = async (tenantId: string) => {
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/v1/sync/tenant/${tenantId}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error?.message ?? 'Failed to queue sync.');
      }

      setMessage(`Sync queued for tenant ${tenantId}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to queue sync.');
    }
  };

  return (
    <AppLayout title="Managed Tenants" userRoles={['engineer']}>
      <div className="mb-6 rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">Add Tenant</h2>
        <form onSubmit={onCreateTenant} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Tenant ID"
            value={form.tenant_id}
            onChange={(e) => setForm((prev) => ({ ...prev, tenant_id: e.target.value }))}
            required
          />
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Customer Name"
            value={form.customer_name}
            onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
            required
          />
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Primary Domain"
            value={form.primary_domain}
            onChange={(e) => setForm((prev) => ({ ...prev, primary_domain: e.target.value }))}
            required
          />
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Support Tier"
            value={form.support_tier}
            onChange={(e) => setForm((prev) => ({ ...prev, support_tier: e.target.value }))}
          />
          <input
            className="rounded border px-3 py-2 text-sm md:col-span-2"
            placeholder="Assigned Engineer"
            value={form.assigned_engineer}
            onChange={(e) => setForm((prev) => ({ ...prev, assigned_engineer: e.target.value }))}
          />
          <button className="w-fit rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">
            Create Tenant
          </button>
        </form>
      </div>

      {message && <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">{message}</div>}
      {error && <div className="mb-4 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm">{error}</div>}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Tenant ID</th>
              <th className="px-4 py-3 text-left">Primary Domain</th>
              <th className="px-4 py-3 text-left">GDAP</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-3 text-slate-500" colSpan={5}>
                  Loading tenants...
                </td>
              </tr>
            )}
            {!loading && tenants.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-slate-500" colSpan={5}>
                  No tenants found.
                </td>
              </tr>
            )}
            {tenants.map((tenant) => (
              <tr key={tenant.tenant_id} className="border-t">
                <td className="px-4 py-3">{tenant.customer_name}</td>
                <td className="px-4 py-3">{tenant.tenant_id}</td>
                <td className="px-4 py-3">{tenant.primary_domain}</td>
                <td className="px-4 py-3">{tenant.gdap_status}</td>
                <td className="px-4 py-3">
                  <button
                    className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
                    onClick={() => void onSyncTenant(tenant.tenant_id)}
                    type="button"
                  >
                    Queue Sync
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
