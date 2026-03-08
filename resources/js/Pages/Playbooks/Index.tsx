import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

type Playbook = { slug: string; title: string; integration_slug: string; version: string; owner?: string };

export default function PlaybooksIndex() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch('/api/v1/playbooks');
      const payload = await response.json();
      setPlaybooks(payload?.data?.items ?? []);
    }

    void load();
  }, []);

  return (
    <AppLayout title="Integration Playbooks" userRoles={['integration-admin']}>
      <div className="space-y-3">
        {playbooks.map((playbook) => (
          <a key={playbook.slug} href={`/playbooks/${playbook.slug}`} className="block rounded-xl border bg-white p-4 hover:bg-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{playbook.title}</h3>
              <span className="text-xs text-slate-500">v{playbook.version}</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">Integration: {playbook.integration_slug}</p>
            <p className="text-xs text-slate-500">Owner: {playbook.owner ?? 'Unassigned'}</p>
          </a>
        ))}
      </div>
    </AppLayout>
  );
}
