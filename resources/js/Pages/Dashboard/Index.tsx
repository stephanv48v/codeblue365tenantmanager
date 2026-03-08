import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

type DashboardStats = {
  tenants: number;
  openFindings: number;
  playbooks: number;
  integrations: number;
};

export default function DashboardIndex() {
  const [stats, setStats] = useState<DashboardStats>({ tenants: 0, openFindings: 0, playbooks: 0, integrations: 0 });

  useEffect(() => {
    async function load() {
      const [tenantsRes, findingsRes, playbooksRes, integrationsRes] = await Promise.all([
        fetch('/api/v1/tenants'),
        fetch('/api/v1/findings'),
        fetch('/api/v1/playbooks'),
        fetch('/api/v1/integrations'),
      ]);

      const [tenants, findings, playbooks, integrations] = await Promise.all([
        tenantsRes.json(),
        findingsRes.json(),
        playbooksRes.json(),
        integrationsRes.json(),
      ]);

      setStats({
        tenants: tenants?.data?.pagination?.total ?? 0,
        openFindings: findings?.data?.pagination?.total ?? 0,
        playbooks: playbooks?.data?.items?.length ?? 0,
        integrations: integrations?.data?.items?.length ?? 0,
      });
    }

    void load();
  }, []);

  const cards = [
    { label: 'Managed Tenants', value: stats.tenants },
    { label: 'Open Findings', value: stats.openFindings },
    { label: 'Playbooks', value: stats.playbooks },
    { label: 'Integrations', value: stats.integrations },
  ];

  return (
    <AppLayout title="Executive Dashboard" userRoles={['engineer', 'integration-admin', 'security-admin']}>
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
