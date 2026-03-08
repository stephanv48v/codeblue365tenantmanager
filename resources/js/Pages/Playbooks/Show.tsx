import { useEffect, useState } from 'react';
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

export default function PlaybookShow({ slug }: { slug: string }) {
  const [playbook, setPlaybook] = useState<PlaybookDetail | null>(null);

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
