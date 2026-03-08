import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

type Tenant = { tenant_id: string; customer_name: string; primary_domain: string; gdap_status: string };

export default function TenantsIndex() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch('/api/v1/tenants');
      const payload = await response.json();
      setTenants(payload?.data?.items ?? []);
    }

    void load();
  }, []);

  return (
    <AppLayout title="Managed Tenants" userRoles={['engineer']}>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Tenant ID</th>
              <th className="px-4 py-3 text-left">Primary Domain</th>
              <th className="px-4 py-3 text-left">GDAP</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.tenant_id} className="border-t">
                <td className="px-4 py-3">{tenant.customer_name}</td>
                <td className="px-4 py-3">{tenant.tenant_id}</td>
                <td className="px-4 py-3">{tenant.primary_domain}</td>
                <td className="px-4 py-3">{tenant.gdap_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
