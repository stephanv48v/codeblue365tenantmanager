import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

type Integration = { slug: string; name: string; status: string };

export default function IntegrationsIndex() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch('/api/v1/integrations');
      const payload = await response.json();
      setIntegrations(payload?.data?.items ?? []);
    }

    void load();
  }, []);

  return (
    <AppLayout title="Integrations" userRoles={['integration-admin']}>
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
